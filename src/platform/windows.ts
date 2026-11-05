// Thin wrapper over chrome.windows for the reminder popup window.
const WIDTH = 440;
// Initial height only: the page resizes the window to fit its content
const HEIGHT = 320;

// Focuses the window with the given id if it still exists as a popup, otherwise opens a new one
export async function focusOrCreatePopup(path: string, knownId: number | undefined): Promise<number | undefined> {
  if (knownId !== undefined) {
    try {
      const existing = await chrome.windows.get(knownId);
      if (existing.type === 'popup') {
        await chrome.windows.update(knownId, { focused: true, drawAttention: true });
        return knownId;
      }
    } catch {
      // window closed: fall through and create a new one
    }
  }
  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(path),
    type: 'popup',
    width: WIDTH,
    height: HEIGHT,
    focused: true,
  });
  return created?.id;
}

export async function closeCurrentWindow(): Promise<void> {
  const current = await chrome.windows.getCurrent();
  if (current.id !== undefined) await chrome.windows.remove(current.id);
}
