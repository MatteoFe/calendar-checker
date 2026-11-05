import { dismiss, dismissAll, findEvent, fireDue, firedEntries, nextFireAt, snooze, syncReminders } from '../core/reminders';
import { snoozeUntil } from '../core/snooze';
import type { ReminderCommand, ReminderState } from '../core/types';
import {
  readCache,
  readReminderState,
  readReminderWindowId,
  writeReminderState,
  writeReminderWindowId,
} from '../platform/storage';
import { focusOrCreatePopup } from '../platform/windows';

export const REMINDER_ALARM = 'reminder';
const REMINDER_PAGE = 'reminder.html';

// Events and alarms can overlap inside one service worker lifetime: running the
// read-modify-write cycles one at a time keeps the stored state consistent.
let queue: Promise<void> = Promise.resolve();
const serialize = async <T>(task: () => Promise<T>): Promise<T> => {
  const previous = queue;
  let release: () => void = () => undefined;
  queue = new Promise<void>((resolve) => (release = resolve));
  await previous;
  try {
    return await task();
  } finally {
    release();
  }
};

// A single alarm for the earliest pending or snoozed reminder
async function scheduleAlarm(state: ReminderState): Promise<void> {
  const next = nextFireAt(state);
  if (next === undefined) {
    await chrome.alarms.clear(REMINDER_ALARM);
    return;
  }
  await chrome.alarms.create(REMINDER_ALARM, { when: Math.max(next, Date.now() + 1000) });
}

async function showWindow(): Promise<void> {
  const id = await focusOrCreatePopup(REMINDER_PAGE, await readReminderWindowId());
  await writeReminderWindowId(id);
}

async function persist(previous: ReminderState, next: ReminderState): Promise<void> {
  if (JSON.stringify(previous) !== JSON.stringify(next)) await writeReminderState(next);
  await scheduleAlarm(next);
}

// Recomputes reminders from the cached events and opens the window for newly fired ones.
// With reopenIfFired, a window is also shown for reminders still waiting for an answer.
export const refreshReminders = (reopenIfFired = false): Promise<void> =>
  serialize(async () => {
    const now = Date.now();
    const { events } = await readCache();
    const previous = await readReminderState();
    const { state, fired } = fireDue(syncReminders(previous, events, now), events, now);
    await persist(previous, state);
    if (fired.length > 0 || (reopenIfFired && firedEntries(state).length > 0)) await showWindow();
  });

export const handleReminderCommand = (command: ReminderCommand): Promise<void> =>
  serialize(async () => {
    const previous = await readReminderState();
    let next = previous;
    if (command.type === 'dismiss') {
      next = dismiss(previous, command.keys);
    } else if (command.type === 'dismissAll') {
      next = dismissAll(previous);
    } else {
      const entry = previous[command.keys[0] ?? ''];
      const event = entry && findEvent(entry, (await readCache()).events);
      if (event) next = snooze(previous, command.keys, snoozeUntil(command.option, event, Date.now()));
    }
    await persist(previous, next);
  });

// Chrome window ids can be reused across restarts, so the stored one is discarded at startup
export async function forgetReminderWindow(): Promise<void> {
  await writeReminderWindowId(undefined);
}
