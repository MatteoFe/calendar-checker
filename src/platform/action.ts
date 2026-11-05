// Thin wrapper over chrome.action (toolbar icon badge and tooltip).
const BADGE_COLOR = '#4285f4';

export async function setBadge(text: string): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  await chrome.action.setBadgeText({ text });
}

export async function setTooltip(title: string): Promise<void> {
  await chrome.action.setTitle({ title });
}
