import type { ReminderCommand } from '../core/types';

// Commands from the UI to the service worker, the only writer of reminder state
export async function sendReminderCommand(command: ReminderCommand): Promise<void> {
  await chrome.runtime.sendMessage(command);
}
