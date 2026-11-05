import { describe, expect, it } from 'vitest';
import { formatEventTime, relativeStart } from './format';
import type { CalendarEvent } from './types';

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = Date.parse('2026-11-05T12:00:00Z');

const ev = (partial: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'e',
  calendarId: 'c',
  title: 'e',
  start: new Date(now + HOUR).toISOString(),
  end: new Date(now + 2 * HOUR).toISOString(),
  allDay: false,
  htmlLink: '',
  reminderMinutes: [],
  ...partial,
});

describe('formatEventTime', () => {
  it('shows day and time range for timed events', () => {
    const event = ev({ start: '2026-11-06T10:00:00+01:00', end: '2026-11-06T11:30:00+01:00' });
    expect(formatEventTime(event, 'Europe/Rome')).toBe('ven 6 nov · 10:00–11:30');
  });

  it('shows "tutto il giorno" for all-day events', () => {
    expect(formatEventTime(ev({ allDay: true, start: '2026-11-06', end: '2026-11-07' }))).toBe('ven 6 nov · tutto il giorno');
  });
});

describe('relativeStart', () => {
  const at = (offsetMs: number, durationMs = HOUR) =>
    ev({ start: new Date(now + offsetMs).toISOString(), end: new Date(now + offsetMs + durationMs).toISOString() });

  it('describes upcoming events by minutes, hours and days', () => {
    expect(relativeStart(at(5 * MIN), now)).toBe('tra 5 min');
    expect(relativeStart(at(30_000), now)).toBe('tra 1 min');
    expect(relativeStart(at(3 * HOUR), now)).toBe('tra 3 h');
    expect(relativeStart(at(50 * HOUR), now)).toBe('tra 2 g');
  });

  it('distinguishes events in progress from finished ones', () => {
    expect(relativeStart(at(-10 * MIN), now)).toBe('in corso');
    expect(relativeStart(at(-2 * HOUR), now)).toBe('terminato');
  });
});
