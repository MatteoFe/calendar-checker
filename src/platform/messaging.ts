import type { SyncWindow } from '../core/sync-window';
import type { CalendarEvent, CommandResponse, PopupCommand, ReminderCommand } from '../core/types';

// Commands from the UI to the service worker, the only writer of reminder state
export async function sendReminderCommand(command: ReminderCommand): Promise<void> {
  await chrome.runtime.sendMessage(command);
}

// Asks the service worker to sync now; the UI sees the result through storage changes
export async function requestSync(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'syncNow' } satisfies PopupCommand);
}

// Reopens the reminder window for reminders still waiting for an answer
export async function requestShowReminders(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'showReminders' } satisfies PopupCommand);
}

// Events of a range outside the cached window, fetched by the service worker
export async function requestRange(window: SyncWindow): Promise<CalendarEvent[]> {
  const command: PopupCommand = { type: 'fetchRange', timeMin: window.timeMin, timeMax: window.timeMax };
  const response = (await chrome.runtime.sendMessage(command)) as CommandResponse | undefined;
  if (!response?.ok) throw new Error('Range fetch failed');
  return response.events ?? [];
}
