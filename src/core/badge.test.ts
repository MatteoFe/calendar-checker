import { describe, expect, it } from 'vitest';
import { badgeText, tooltipText } from './badge';
import { nextEvent } from './next-event';
import type { CalendarEvent } from './types';

// 13:00 in Europe/Rome (CET)
const now = new Date('2026-11-05T12:00:00Z');
const ZONE = 'Europe/Rome';

const at = (offsetMs: number): string => new Date(now.getTime() + offsetMs).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

const ev = (partial: Partial<CalendarEvent> & { id: string }): CalendarEvent => ({
  calendarId: 'c',
  title: partial.id,
  start: at(HOUR),
  end: at(2 * HOUR),
  allDay: false,
  htmlLink: '',
  reminderMinutes: [],
  ...partial,
});

describe('nextEvent', () => {
  it('skips all-day, declined and finished events', () => {
    const events = [
      ev({ id: 'allday', allDay: true, start: '2026-11-05', end: '2026-11-06' }),
      ev({ id: 'declined', start: at(5 * MIN), responseStatus: 'declined' }),
      ev({ id: 'finished', start: at(-2 * HOUR), end: at(-HOUR) }),
      ev({ id: 'ok', start: at(3 * HOUR), end: at(4 * HOUR) }),
    ];
    expect(nextEvent(events, now)?.id).toBe('ok');
  });

  it('picks the event in progress over later ones', () => {
    const events = [ev({ id: 'later', start: at(HOUR) }), ev({ id: 'running', start: at(-10 * MIN), end: at(MIN * 20) })];
    expect(nextEvent(events, now)?.id).toBe('running');
  });

  it('returns undefined when nothing qualifies', () => {
    expect(nextEvent([], now)).toBeUndefined();
  });
});

describe('badgeText', () => {
  const text = (offsetMs: number) => badgeText(ev({ id: 'x', start: at(offsetMs), end: at(offsetMs + HOUR) }), now);

  it('shows "ora" for an event in progress', () => {
    expect(badgeText(ev({ id: 'x', start: at(-MIN), end: at(MIN) }), now)).toBe('ora');
  });

  it('shows minutes below one hour, rounded up', () => {
    expect(text(10 * MIN)).toBe('10m');
    expect(text(30_000)).toBe('1m');
    expect(text(59 * MIN + 30_000)).toBe('60m');
  });

  it('shows hours below 24 hours, rounded down', () => {
    expect(text(HOUR)).toBe('1h');
    expect(text(23 * HOUR + 59 * MIN)).toBe('23h');
  });

  it('shows days up to 48 hours', () => {
    expect(text(24 * HOUR)).toBe('1g');
    expect(text(48 * HOUR)).toBe('2g');
  });

  it('shows nothing beyond 48 hours or without event', () => {
    expect(text(48 * HOUR + MIN)).toBe('');
    expect(badgeText(undefined, now)).toBe('');
  });
});

describe('tooltipText', () => {
  it('shows title and time for an event today', () => {
    const event = ev({ id: 'Meeting', title: 'Meeting', start: '2026-11-05T14:30:00+01:00', end: '2026-11-05T15:00:00+01:00' });
    expect(tooltipText(event, now, ZONE)).toBe('Meeting\n14:30');
  });

  it('prepends the day for another date', () => {
    const event = ev({ id: 'Meeting', title: 'Meeting', start: '2026-11-06T10:00:00+01:00', end: '2026-11-06T11:00:00+01:00' });
    expect(tooltipText(event, now, ZONE)).toBe('Meeting\nven 6 nov, 10:00');
  });

  it('handles no event', () => {
    expect(tooltipText(undefined, now, ZONE)).toBe('Nessun evento in arrivo');
  });
});
