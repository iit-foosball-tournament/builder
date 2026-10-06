import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  InvitationActivationError,
  parseInvitation,
  setInvitationPassword as setInvitationPasswordBound,
  signOutInvitationSession,
  verifyInvitation
} from '../src/authInvitation.js';

const tokenHash = 'aB09-_'.repeat(8);
const invitation = { type: 'invite', tokenHash };
const user = { id: 'recipient-id', email: 'editor@example.org' };
const session = { user, access_token: 'test-recipient-jwt' };
const setInvitationPassword = (client, recipient, password) => setInvitationPasswordBound(
  client, recipient, password, (snapshot, value) => client.auth.updateUser({ password: value }, snapshot)
);

function fakeClient(overrides = {}) {
  const calls = { verify: [], update: [], signOut: [], rpc: [], getSession: 0 };
  let live = session;
  const client = {
    auth: {
      async verifyOtp(input) { calls.verify.push(input); return { data: { user, session }, error: null }; },
      async getSession() { calls.getSession += 1; return { data: { session: live }, error: null }; },
      async updateUser(input) { calls.update.push(input); return { data: { user }, error: null }; },
      async signOut(input) { calls.signOut.push(input); live = null; return { error: null }; }
    },
    async rpc(input) { calls.rpc.push(input); return { data: true, error: null }; }
  };
  if (overrides.auth) Object.assign(client.auth, overrides.auth);
  if (overrides.rpc) client.rpc = overrides.rpc;
  return { client, calls, setLive: value => { live = value; } };
}

const location = hash => ({ hash, search: `?type=invite&token_hash=${'z'.repeat(48)}` });

test('only a valid builder hash invitation is parsed; arbitrary query data is ignored', () => {
  assert.deepEqual(parseInvitation(location(`#/builder?type=invite&token_hash=${tokenHash}`)), invitation);
  for (const hash of ['#/builder', '#/home', '#/home?type=invite&token_hash=abc',
    '#/builder?foo=bar', '#/builder-extra?type=invite&token_hash=abc',
    '#/builder/type=invite', '#/builder?type=other&foo=bar']) {
    assert.equal(parseInvitation(location(hash)), null, hash);
  }
  assert.equal(parseInvitation({ search: `?type=invite&token_hash=${tokenHash}` }), null);
});

test('recovery links use the same protected, explicitly activated flow', async () => {
  const recovery = { type: 'recovery', tokenHash };
  assert.deepEqual(parseInvitation(location(`#/builder?type=recovery&token_hash=${tokenHash}`)), recovery);
  const { client, calls } = fakeClient();
  assert.deepEqual(await verifyInvitation(client, recovery), user);
  assert.deepEqual(calls.verify, [{ token_hash: tokenHash, type: 'recovery' }]);
});

test('malformed intended invites are explicitly invalid without returning their secret', () => {
  const invalid = [
    `#/builder?type=invite`, `#/builder?token_hash=${tokenHash}`,
    `#/builder?type=invite&type=invite&token_hash=${tokenHash}`,
    `#/builder?type=invite&token_hash=${tokenHash}&token_hash=${tokenHash}`,
    `#/builder?type=magiclink&token_hash=${tokenHash}`,
    '#/builder?type=invite&token_hash=short',
    `#/builder?type=invite&token_hash=${'x'.repeat(257)}`,
    `#/builder?type=invite&token_hash=${'x'.repeat(31)}`,
    '#/builder?type=invite&token_hash=%3Cscript%3E',
    `#/builder?type=invite&token_hash=${tokenHash}%0A`,
    `#/builder?type=invite&token_hash=${tokenHash}%2F`
  ];
  for (const hash of invalid) {
    const result = parseInvitation(location(hash));
    assert.deepEqual(result, { invalid: true }, hash);
    assert.ok(!JSON.stringify(result).includes(tokenHash));
  }
});

test('verification checks exchange identity, live session, and editor authorization', async () => {
  const { client, calls } = fakeClient();
  assert.deepEqual(await verifyInvitation(client, invitation), user);
  assert.deepEqual(calls.verify, [{ token_hash: tokenHash, type: 'invite' }]);
  assert.deepEqual(calls.rpc, ['is_tournament_editor']);
  assert.ok(calls.getSession >= 2);
  assert.deepEqual(calls.signOut, []);
});

test('expired invite is not retried, and errors never expose the token', async () => {
  const { client, calls } = fakeClient({ auth: {
    async verifyOtp(input) { calls.verify.push(input); return { data: null, error: new Error(tokenHash) }; }
  } });
  await assert.rejects(verifyInvitation(client, invitation), error => {
    assert.ok(error instanceof InvitationActivationError);
    assert.equal(error.reason, 'expired');
    assert.ok(!error.message.includes(tokenHash));
    return true;
  });
  assert.deepEqual(calls.signOut, []);
});

test('denied editor authorization signs out only the invitation recipient', async () => {
  const { client, calls } = fakeClient({ rpc: async () => ({ data: false, error: null }) });
  await assert.rejects(verifyInvitation(client, invitation), { reason: 'access' });
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('a switched live session is never signed out or used for password update', async () => {
  const { client, calls, setLive } = fakeClient();
  setLive({ user: { id: 'another-user' } });
  await assert.rejects(verifyInvitation(client, invitation), { reason: 'session' });
  assert.deepEqual(calls.signOut, []);
  await assert.rejects(setInvitationPassword(client, user, 'a long unique passphrase'), { reason: 'session' });
  assert.deepEqual(calls.update, []);
  assert.deepEqual(calls.signOut, []);
});

test('exchange response mismatch fails before authorization and only logs out owned session', async () => {
  const { client, calls } = fakeClient({ auth: {
    async verifyOtp() { return { data: { user, session: { user: { id: 'other-id' } } }, error: null }; }
  } });
  await assert.rejects(verifyInvitation(client, invitation), { reason: 'session' });
  assert.deepEqual(calls.rpc, []);
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('password update checks fresh session and returned user, then checks session again', async () => {
  const { client, calls } = fakeClient();
  await setInvitationPassword(client, user, 'a long unique passphrase');
  assert.deepEqual(calls.update, [{ password: 'a long unique passphrase' }]);
  assert.equal(calls.getSession, 2);
  assert.deepEqual(calls.signOut, []);
});

test('provider password rejection leaves the owned session available for a safe retry', async () => {
  const { client, calls } = fakeClient({ auth: {
    async updateUser() { return { data: { user: null }, error: new Error(tokenHash) }; }
  } });
  await assert.rejects(setInvitationPassword(client, user, 'a long unique passphrase'), error => {
    assert.equal(error.reason, 'update');
    assert.ok(!error.message.includes(tokenHash));
    return true;
  });
  assert.deepEqual(calls.signOut, []);
});

test('unexpected update identity is rejected and owned session signed out', async () => {
  const { client, calls } = fakeClient({ auth: {
    async updateUser(input) { calls.update.push(input); return { data: { user: { id: 'another-user' } }, error: null }; }
  } });
  await assert.rejects(setInvitationPassword(client, user, 'a long unique passphrase'), { reason: 'session' });
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('a session switch during update cannot complete activation or log out the other user', async () => {
  const { client, calls, setLive } = fakeClient({ auth: {
    async updateUser() { setLive({ user: { id: 'another-user' } }); return { data: { user }, error: null }; }
  } });
  await assert.rejects(setInvitationPassword(client, user, 'a long unique passphrase'), { reason: 'session' });
  assert.deepEqual(calls.signOut, []);
});

test('signout helper is a no-op for another live user', async () => {
  const { client, calls, setLive } = fakeClient();
  setLive({ user: { id: 'another-user' } });
  await signOutInvitationSession(client, user.id);
  assert.deepEqual(calls.signOut, []);
});
