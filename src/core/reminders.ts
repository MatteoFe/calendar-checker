import type { CalendarEvent, ReminderEntry, ReminderState } from './types';

const MINUTE = 60_000;

// All-day events carry a YYYY-MM-DD date: it means local midnight
const toEpoch = (value: string, allDay: boolean): number => {
  if (!allDay) return Date.parse(value);
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
};

export const eventStartMs = (event: CalendarEvent): number => toEpoch(event.start, event.allDay);
export const eventEndMs = (event: CalendarEvent): number => toEpoch(event.end, event.allDay);

export const eventRef = (event: Pick<CalendarEvent, 'calendarId' | 'id' | 'start'>): string =>
  `${event.calendarId}|${event.id}|${event.start}`;

// Distinct occurrences of recurring events stay distinct because start is part of the key
export const reminderKey = (event: CalendarEvent, minutes: number): string => `${eventRef(event)}|${minutes}`;

// Event identity of an entry key, used to look the event up
const entryEventRef = (entry: ReminderEntry): string => entry.key.slice(0, entry.key.lastIndexOf('|'));

export const findEvent = (entry: ReminderEntry, events: readonly CalendarEvent[]): CalendarEvent | undefined =>
  events.find((e) => eventRef(e) === entryEventRef(entry));

// Aligns the state with the cached events: new reminders appear, existing ones keep their
// status, reminders of events that disappeared are dropped.
export const syncReminders = (previous: ReminderState, events: readonly CalendarEvent[], now: number): ReminderState => {
  const next: ReminderState = {};
  for (const event of events) {
    for (const minutes of event.reminderMinutes) {
      const key = reminderKey(event, minutes);
      next[key] = previous[key] ?? {
        key,
        calendarId: event.calendarId,
        eventId: event.id,
        fireAt: eventStartMs(event) - minutes * MINUTE,
        // A reminder discovered for an already finished event must never fire
        status: eventEndMs(event) <= now ? 'dismissed' : 'pending',
      };
    }
  }
  return next;
};

export interface FireResult {
  state: ReminderState;
  fired: string[];
}

// Fires due reminders of events not yet finished; closes everything tied to finished events.
export const fireDue = (state: ReminderState, events: readonly CalendarEvent[], now: number): FireResult => {
  const next: ReminderState = {};
  const fired: string[] = [];
  for (const entry of Object.values(state)) {
    const event = findEvent(entry, events);
    if (entry.status === 'dismissed') {
      next[entry.key] = entry;
    } else if (!event || eventEndMs(event) <= now) {
      next[entry.key] = { ...entry, status: 'dismissed' };
    } else if ((entry.status === 'pending' || entry.status === 'snoozed') && entry.fireAt <= now) {
      next[entry.key] = { ...entry, status: 'fired' };
      fired.push(entry.key);
    } else {
      next[entry.key] = entry;
    }
  }
  return { state: next, fired };
};

// Time of the next alarm to schedule, if any
export const nextFireAt = (state: ReminderState): number | undefined => {
  const times = Object.values(state)
    .filter((e) => e.status === 'pending' || e.status === 'snoozed')
    .map((e) => e.fireAt);
  return times.length > 0 ? Math.min(...times) : undefined;
};

export const firedEntries = (state: ReminderState): ReminderEntry[] =>
  Object.values(state).filter((e) => e.status === 'fired');

const update = (state: ReminderState, keys: readonly string[], change: Partial<ReminderEntry>): ReminderState => {
  const next = { ...state };
  for (const key of keys) {
    if (next[key]) next[key] = { ...next[key], ...change };
  }
  return next;
};

export const snooze = (state: ReminderState, keys: readonly string[], until: number): ReminderState =>
  update(state, keys, { status: 'snoozed', fireAt: until });

export const dismiss = (state: ReminderState, keys: readonly string[]): ReminderState =>
  update(state, keys, { status: 'dismissed' });

export const dismissAll = (state: ReminderState): ReminderState =>
  dismiss(state, firedEntries(state).map((e) => e.key));
