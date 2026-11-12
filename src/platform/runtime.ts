// Thin wrapper over chrome.runtime helpers used by the UI.
export async function openOptionsPage(): Promise<void> {
  await chrome.runtime.openOptionsPage();
}

export async function openUrl(url: string): Promise<void> {
  await chrome.tabs.create({ url });
}
