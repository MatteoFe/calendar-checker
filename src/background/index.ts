// Service worker entry point. No in-memory state: only storage and alarms.
import type { ReminderCommand } from '../core/types';
import { updateBadge } from './badge';
import { REMINDER_ALARM, forgetReminderWindow, handleReminderCommand, refreshReminders } from './reminders';
import { runSync } from './sync';

const SYNC_ALARM = 'sync';
const SYNC_PERIOD_MINUTES = 5;
const TICK_ALARM = 'tick';
const TICK_PERIOD_MINUTES = 1;

// Alarms may be lost, so they are recreated if missing; creation is idempotent
async function ensureAlarm(name: string, periodInMinutes: number): Promise<void> {
  if (!(await chrome.alarms.get(name))) {
    await chrome.alarms.create(name, { periodInMinutes });
  }
}

async function syncAndRefresh(interactive = false): Promise<void> {
  await runSync(interactive);
  await updateBadge();
  await refreshReminders();
}

// Alarms are not trusted: everything is recomputed from the stored state.
async function bootstrap(): Promise<void> {
  await ensureAlarm(SYNC_ALARM, SYNC_PERIOD_MINUTES);
  await ensureAlarm(TICK_ALARM, TICK_PERIOD_MINUTES);
  await forgetReminderWindow();
  await updateBadge();
  await refreshReminders(true);
  await syncAndRefresh();
}

chrome.runtime.onInstalled.addListener(() => void bootstrap());
chrome.runtime.onStartup.addListener(() => void bootstrap());

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) void syncAndRefresh();
  // The tick also acts as a safety net in case the reminder alarm was lost
  if (alarm.name === TICK_ALARM) void Promise.all([updateBadge(), refreshReminders()]);
  if (alarm.name === REMINDER_ALARM) void refreshReminders();
});

// Commands from the reminder window; the channel stays open until the state is written
chrome.runtime.onMessage.addListener((message: ReminderCommand, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (message.type !== 'snooze' && message.type !== 'dismiss' && message.type !== 'dismissAll') return false;
  void (async () => {
    try {
      await handleReminderCommand(message);
      sendResponse({ ok: true });
    } catch (error) {
      console.error('Reminder command failed', error);
      sendResponse({ ok: false });
    }
  })();
  return true;
});

// Temporary: run `await debugSync()` in the service worker console to grant consent and sync.
// To be removed when the options page (slice 7) handles authorization.
Object.assign(globalThis, {
  async debugSync() {
    await syncAndRefresh(true);
    return chrome.storage.local.get(['syncCache', 'reminderState']);
  },
});
