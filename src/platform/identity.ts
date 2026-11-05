// Thin wrapper over chrome.identity.

export async function getAuthToken(interactive: boolean): Promise<string> {
  const { token } = await chrome.identity.getAuthToken({ interactive });
  if (!token) throw new Error('No auth token returned');
  return token;
}

export async function removeCachedAuthToken(token: string): Promise<void> {
  await chrome.identity.removeCachedAuthToken({ token });
}
