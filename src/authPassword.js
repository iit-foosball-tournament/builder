// Use a fixed, already verified user's JWT for this mutation. The shared Auth
// client's updateUser() could otherwise pick up a different session from another tab.
export function createSessionPasswordUpdater({ url, publishableKey, fetcher = globalThis.fetch }) {
  const endpoint = `${url.replace(/\/$/, '')}/auth/v1/user`;
  return async (session, password) => {
    if (!session?.user?.id || typeof session.access_token !== 'string' || !session.access_token ||
        typeof password !== 'string' || password.length < 12) throw new Error('Invalid password setup request');
    const response = await fetcher(endpoint, {
      method: 'PUT',
      headers: { apikey: publishableKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, data: { foosball_password_setup_required: false } }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('Password update failed');
    const user = await response.json();
    if (user?.id !== session.user.id) throw new Error('Password update identity mismatch');
    return { data: { user }, error: null };
  };
}
