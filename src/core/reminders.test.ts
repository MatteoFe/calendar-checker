import { describe, expect, it } from 'vitest';
import { dismiss, dismissAll, fireDue, firedEntries, nextFireAt, reminderKey, snooze, syncReminders } from './reminders';
import { availableSnoozeOptions, snoozeUntil } from './snooze';
import type { CalendarEvent, ReminderEntry, ReminderState } from './types';

// Entry lookup that fails loudly instead of returning undefined
const at = (state: ReminderState, key: string): ReminderEntry => {
  const entry = state[key];
  if (!entry) throw new Error('missing entry ' + key);
  return entry;
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = Date.parse('2026-11-05T12:00:00Z');
const iso = (offsetMs: number): string => new Date(now + offsetMs).toISOString();

const ev = (partial: Partial<CalendarEvent> & { id: string }): CalendarEvent => ({
  calendarId: 'c',
  title: partial.id,
  start: iso(HOUR),
  end: iso(2 * HOUR),
  allDay: false,
  htmlLink: '',
  reminderMinutes: [10],
  ...partial,
});

describe('syncReminders', () => {
  it('creates a pending reminder firing before the start', () => {
    const event = ev({ id: 'a', reminderMinutes: [10, 60] });
    const state = syncReminders({}, [event], now);
    expect(at(state, reminderKey(event, 10))).toMatchObject({ status: 'pending', fireAt: now + HOUR - 10 * MIN });
    expect(at(state, reminderKey(event, 60))).toMatchObject({ status: 'pending', fireAt: now });
  });

  it('dismisses reminders of already finished events', () => {
    const event = ev({ id: 'old', start: iso(-2 * HOUR), end: iso(-HOUR) });
    expect(at(syncReminders({}, [event], now), reminderKey(event, 10)).status).toBe('dismissed');
  });

  it('keeps existing status and drops reminders of missing events', () => {
    const kept = ev({ id: 'kept' });
    const gone = ev({ id: 'gone' });
    const previous = dismiss(syncReminders({}, [kept, gone], now), [reminderKey(kept, 10)]);
    const state = syncReminders(previous, [kept], now);
    expect(Object.keys(state)).toEqual([reminderKey(kept, 10)]);
    expect(at(state, reminderKey(kept, 10)).status).toBe('dismissed');
  });

  it('uses local midnight for all-day events', () => {
    const event = ev({ id: 'ad', allDay: true, start: '2026-11-06', end: '2026-11-07', reminderMinutes: [0] });
    const entry = at(syncReminders({}, [event], now), reminderKey(event, 0));
    expect(entry.fireAt).toBe(new Date(2026, 10, 6).getTime());
  });

  it('keeps recurring occurrences distinct', () => {
    const first = ev({ id: 'rec', start: iso(HOUR) });
    const second = ev({ id: 'rec', start: iso(25 * HOUR), end: iso(26 * HOUR) });
    expect(Object.keys(syncReminders({}, [first, second], now))).toHaveLength(2);
  });
});

describe('fireDue', () => {
  it('fires due reminders of unfinished events, including events in progress', () => {
    const upcoming = ev({ id: 'up', start: iso(5 * MIN), end: iso(HOUR) });
    const running = ev({ id: 'run', start: iso(-30 * MIN), end: iso(HOUR) });
    const later = ev({ id: 'later', start: iso(3 * HOUR), end: iso(4 * HOUR) });
    const events = [upcoming, running, later];
    const { state, fired } = fireDue(syncReminders({}, events, now), events, now);
    expect(fired.sort()).toEqual([reminderKey(running, 10), reminderKey(upcoming, 10)].sort());
    expect(at(state, reminderKey(later, 10)).status).toBe('pending');
  });

  it('fires a snoozed reminder only when its time comes', () => {
    const event = ev({ id: 'a', start: iso(3 * HOUR), end: iso(4 * HOUR) });
    const key = reminderKey(event, 10);
    const snoozed = snooze(syncReminders({}, [event], now), [key], now + 5 * MIN);
    expect(fireDue(snoozed, [event], now + MIN).fired).toEqual([]);
    expect(fireDue(snoozed, [event], now + 5 * MIN).fired).toEqual([key]);
  });

  it('dismisses reminders whose event has finished', () => {
    const event = ev({ id: 'a', start: iso(5 * MIN), end: iso(HOUR) });
    const key = reminderKey(event, 10);
    const { state } = fireDue(syncReminders({}, [event], now), [event], now);
    expect(at(state, key).status).toBe('fired');
    expect(at(fireDue(state, [event], now + 2 * HOUR).state, key).status).toBe('dismissed');
  });

  it('does not fire the same reminder twice', () => {
    const event = ev({ id: 'a', start: iso(5 * MIN), end: iso(HOUR) });
    const first = fireDue(syncReminders({}, [event], now), [event], now);
    expect(fireDue(first.state, [event], now + MIN).fired).toEqual([]);
  });
});

describe('nextFireAt and commands', () => {
  const event = ev({ id: 'a', reminderMinutes: [10, 30], start: iso(2 * HOUR), end: iso(3 * HOUR) });
  const key10 = reminderKey(event, 10);
  const key30 = reminderKey(event, 30);
  const keys = [key10, key30];

  it('returns the earliest pending or snoozed time', () => {
    const state = syncReminders({}, [event], now);
    expect(nextFireAt(state)).toBe(now + 2 * HOUR - 30 * MIN);
    expect(nextFireAt({})).toBeUndefined();
    expect(nextFireAt(dismiss(state, keys))).toBeUndefined();
  });

  it('dismissAll closes every fired reminder only', () => {
    let state: ReminderState = syncReminders({}, [event], now);
    state = { ...state, [key10]: { ...at(state, key10), status: 'fired' } };
    const result = dismissAll(state);
    expect(at(result, key10).status).toBe('dismissed');
    expect(at(result, key30).status).toBe('pending');
    expect(firedEntries(result)).toEqual([]);
  });
});

describe('snooze options', () => {
  const event = ev({ id: 'a', start: iso(7 * MIN), end: iso(HOUR) });

  it('computes fixed options from now and relative ones from the start', () => {
    expect(snoozeUntil('m10', event, now)).toBe(now + 10 * MIN);
    expect(snoozeUntil('before5', event, now)).toBe(now + 2 * MIN);
    expect(snoozeUntil('atStart', event, now)).toBe(now + 7 * MIN);
  });

  it('offers relative options only while they are in the future', () => {
    const ids = (offset: number) => availableSnoozeOptions(ev({ id: 'x', start: iso(offset), end: iso(HOUR) }), now).map((o) => o.id);
    expect(ids(7 * MIN)).toEqual(['m5', 'm10', 'm15', 'm30', 'h1', 'h4', 'before5', 'atStart']);
    expect(ids(20 * MIN)).toContain('before10');
    expect(ids(-MIN)).not.toContain('atStart');
  });
});
