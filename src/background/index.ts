// Service worker entry point. No in-memory state: only storage and alarms.
import type { CommandResponse, PopupCommand, ReminderCommand } from '../core/types';
import { updateBadge } from './badge';
import { REMINDER_ALARM, forgetReminderWindow, handleReminderCommand, refreshReminders } from './reminders';
import { fetchEventsInRange, runSync } from './sync';

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

async function syncAndRefresh(): Promise<void> {
  await runSync();
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

chrome.runtime.onInstalled.addListener((details) => {
  void bootstrap();
  // First run: the user has to authorize access and pick calendars
  if (details.reason === 'install') void chrome.runtime.openOptionsPage();
});
chrome.runtime.onStartup.addListener(() => void bootstrap());

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) void syncAndRefresh();
  // The tick also acts as a safety net in case the reminder alarm was lost
  if (alarm.name === TICK_ALARM) void Promise.all([updateBadge(), refreshReminders()]);
  if (alarm.name === REMINDER_ALARM) void refreshReminders();
});

type Command = ReminderCommand | PopupCommand;
const COMMAND_TYPES = ['snooze', 'dismiss', 'dismissAll', 'syncNow', 'showReminders', 'fetchRange'];

async function handleCommand(command: Command): Promise<CommandResponse> {
  switch (command.type) {
    case 'syncNow':
      await syncAndRefresh();
      return { ok: true };
    case 'showReminders':
      await refreshReminders(true);
      return { ok: true };
    case 'fetchRange':
      return { ok: true, events: await fetchEventsInRange(command) };
    default:
      await handleReminderCommand(command);
      return { ok: true };
  }
}

// Commands from the popup and the reminder window; the channel stays open until the work is done
chrome.runtime.onMessage.addListener((message: Command, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !COMMAND_TYPES.includes(message?.type)) return false;
  void (async () => {
    try {
      sendResponse(await handleCommand(message));
    } catch (error) {
      console.error('Command failed', message.type, error);
      sendResponse({ ok: false } satisfies CommandResponse);
    }
  })();
  return true;
});
