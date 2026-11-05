import { describe, expect, it } from 'vitest';
import { mergeSync } from './merge-sync';
import type { CachedCalendar, CalendarEvent, SyncCache } from './types';

const cal = (id: string): CachedCalendar => ({ id, summary: id, color: '#fff', defaultReminderMinutes: [] });
const ev = (id: string, calendarId: string): CalendarEvent => ({
  id,
  calendarId,
  title: id,
  start: '2026-11-06',
  end: '2026-11-07',
  allDay: true,
  htmlLink: '',
  reminderMinutes: [],
});

const now = new Date('2026-11-05T12:00:00Z');
const previous: SyncCache = {
  calendars: [cal('a'), cal('b')],
  events: [ev('old-a', 'a'), ev('old-b', 'b')],
  lastSync: null,
};

describe('mergeSync', () => {
  it('replaces events of successful calendars entirely', () => {
    const merged = mergeSync(
      previous,
      [
        { calendar: cal('a'), events: [ev('new-a', 'a')] },
        { calendar: cal('b'), events: [] },
      ],
      now,
    );
    expect(merged.events.map((e) => e.id)).toEqual(['new-a']);
    expect(merged.lastSync).toBe(now.toISOString());
  });

  it('keeps previous events of a failed calendar', () => {
    const merged = mergeSync(
      previous,
      [
        { calendar: cal('a'), events: [ev('new-a', 'a')] },
        { calendar: cal('b'), events: null },
      ],
      now,
    );
    expect(merged.events.map((e) => e.id)).toEqual(['new-a', 'old-b']);
  });

  it('drops calendars that are no longer selected', () => {
    const merged = mergeSync(previous, [{ calendar: cal('a'), events: [ev('new-a', 'a')] }], now);
    expect(merged.calendars.map((c) => c.id)).toEqual(['a']);
    expect(merged.events.map((e) => e.id)).toEqual(['new-a']);
  });
});
