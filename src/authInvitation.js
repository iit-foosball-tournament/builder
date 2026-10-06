// The URL is untrusted. Never include a token (or the original URL) in errors or UI copy.
const TOKEN_HASH = /^[A-Za-z0-9_-]{32,256}$/;
const INVITATION_TYPES = new Set(['invite', 'recovery']);

/** Returns null for ordinary routes, { invalid: true } for malformed builder invites,
 * or { type: 'invite', tokenHash } for an actionable invitation.
 * The search/query part of the location is deliberately not consulted.
 */
export function parseInvitation(location) {
  const hash = location?.hash;
  if (typeof hash !== 'string' || !hash.startsWith('#/builder?')) return null;
  const params = new URLSearchParams(hash.slice('#/builder?'.length));
  const types = params.getAll('type');
  const tokens = params.getAll('token_hash');
  if (tokens.length === 0 && !types.some(type => INVITATION_TYPES.has(type))) return null;
  if (types.length !== 1 || tokens.length !== 1 || !INVITATION_TYPES.has(types[0])
    || !TOKEN_HASH.test(tokens[0])) return { invalid: true };
  return { type: types[0], tokenHash: tokens[0] };
}

// These helpers intentionally never put SDK errors into thrown messages: auth errors can
// include confidential data and must not be displayed or logged by the activation UI.
export class InvitationActivationError extends Error {
  constructor(reason) {
    super('Impossibile completare l’attivazione.');
    this.name = 'InvitationActivationError';
    this.reason = reason;
  }
}

async function hasInvitationSession(client, recipientId) {
  try {
    const { data, error } = await client.auth.getSession();
    return !error && data?.session?.user?.id === recipientId;
  } catch {
    return false;
  }
}

/** Never sign out a different user who might have signed in in another tab. */
export async function signOutInvitationSession(client, recipientId) {
  if (!recipientId || !(await hasInvitationSession(client, recipientId))) return;
  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // Cleanup is best-effort; never reveal a provider error or touch another user's session.
  }
}

/** Explicit-button-only exchange. Caller must remove the token from browser history first. */
export async function verifyInvitation(client, invitation) {
  if (!INVITATION_TYPES.has(invitation?.type) || !TOKEN_HASH.test(invitation?.tokenHash || '')) {
    throw new InvitationActivationError('invalid');
  }
  let recipientId;
  try {
    const { data, error } = await client.auth.verifyOtp({
      token_hash: invitation.tokenHash,
      type: invitation.type
    });
    if (error) throw new InvitationActivationError('expired');
    recipientId = data?.user?.id;
    const email = data?.user?.email;
    if (typeof recipientId !== 'string' || !recipientId || typeof email !== 'string' || !email
      || data?.session?.user?.id !== recipientId || data.session.user.email !== email
      || !(await hasInvitationSession(client, recipientId))) {
      throw new InvitationActivationError('session');
    }
    const access = await client.rpc('is_tournament_editor');
    if (access.error || access.data !== true) throw new InvitationActivationError('access');
    if (!(await hasInvitationSession(client, recipientId))) {
      throw new InvitationActivationError('session');
    }
    return { id: recipientId, email };
  } catch (error) {
    await signOutInvitationSession(client, recipientId);
    if (error instanceof InvitationActivationError) throw error;
    throw new InvitationActivationError(recipientId ? 'access' : 'expired');
  }
}

/** Re-read the live session immediately before the password mutation, not just at verify time. */
export async function setInvitationPassword(client, recipient, password, updateForSession) {
  if (!recipient?.id || typeof updateForSession !== 'function' || typeof password !== 'string' || password.length < 12) {
    throw new InvitationActivationError('invalid');
  }
  let snapshot;
  try {
    const { data, error } = await client.auth.getSession();
    if (!error && data?.session?.user?.id === recipient.id && data.session.access_token) snapshot = data.session;
  } catch { /* Treat unavailable sessions as expired. */ }
  if (!snapshot) throw new InvitationActivationError('session');
  let result;
  try {
    result = await updateForSession(snapshot, password);
  } catch {
    if (!(await hasInvitationSession(client, recipient.id))) {
      await signOutInvitationSession(client, recipient.id);
      throw new InvitationActivationError('session');
    }
    throw new InvitationActivationError('update');
  }
  if (!(await hasInvitationSession(client, recipient.id))) {
    await signOutInvitationSession(client, recipient.id);
    throw new InvitationActivationError('session');
  }
  if (result?.error) throw new InvitationActivationError('update');
  if (result?.data?.user?.id !== recipient.id) {
    await signOutInvitationSession(client, recipient.id);
    throw new InvitationActivationError('session');
  }
}
