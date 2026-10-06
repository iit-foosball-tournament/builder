import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionPasswordUpdater } from '../src/authPassword.js';
import { setInvitationPassword } from '../src/authInvitation.js';

const recipient = { id: 'invited-user', email: 'editor@example.org' };
const session = { user: recipient, access_token: 'test-invited-user-jwt' };
const password = 'a unique long test password';
const url = 'https://project.example.org';
const publishableKey = 'test-public-key';

test('password mutation is bound to the captured invitation JWT, not a shared client session', async () => {
  let live = session;
  let called = 0;
  const updater = createSessionPasswordUpdater({ url, publishableKey, fetcher: async (endpoint, request) => {
    called++;
    live = { user: { id: 'another-user' }, access_token: 'test-another-user-jwt' };
    assert.equal(endpoint, `${url}/auth/v1/user`);
    assert.equal(request.method, 'PUT');
    assert.equal(request.headers.Authorization, `Bearer ${session.access_token}`);
    assert.equal(request.headers.apikey, publishableKey);
    assert.deepEqual(JSON.parse(request.body), { password, data: { foosball_password_setup_required: false } });
    return { ok: true, json: async () => recipient };
  } });
  const client = { auth: { getSession: async () => ({ data: { session: live }, error: null }) } };
  await assert.rejects(setInvitationPassword(client, recipient, password, updater), { reason: 'session' });
  assert.equal(called, 1);
});

test('bound updater rejects HTTP errors without echoing provider response', async () => {
  const updater = createSessionPasswordUpdater({ url, publishableKey, fetcher: async () => ({ ok: false }) });
  await assert.rejects(updater(session, password), { message: 'Password update failed' });
});

test('bound updater rejects an unexpected returned identity', async () => {
  const updater = createSessionPasswordUpdater({ url, publishableKey, fetcher: async () => ({ ok: true, json: async () => ({ id: 'different-user' }) }) });
  await assert.rejects(updater(session, password), { message: 'Password update identity mismatch' });
});

test('invalid session or short password never reaches the network', async () => {
  let calls = 0;
  const updater = createSessionPasswordUpdater({ url, publishableKey, fetcher: async () => { calls++; } });
  await assert.rejects(updater({}, password));
  await assert.rejects(updater(session, 'short'));
  assert.equal(calls, 0);
});
