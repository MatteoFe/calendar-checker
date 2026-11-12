import { describe, expect, it } from 'vitest';
import { mapCalendar, mapEvent } from './map-event';
import type { CachedCalendar } from './types';

const calendar: CachedCalendar = { id: 'cal', summary: 'Cal', color: '#fff', defaultReminderMinutes: [10] };

describe('mapCalendar', () => {
  it('keeps only popup default reminders and falls back to a default color', () => {
    const mapped = mapCalendar({
      id: 'a',
      summary: 'A',
      defaultReminders: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    });
    expect(mapped.defaultReminderMinutes).toEqual([30]);
    expect(mapped.color).toBe('#4285f4');
  });
});

describe('mapEvent', () => {
  it('maps a timed event using calendar default reminders', () => {
    const event = mapEvent(
      {
        id: 'e1',
        summary: 'Meeting',
        htmlLink: 'https://x',
        start: { dateTime: '2026-11-06T10:00:00+01:00' },
        end: { dateTime: '2026-11-06T11:00:00+01:00' },
        reminders: { useDefault: true },
      },
      calendar,
    );
    expect(event).toMatchObject({ allDay: false, title: 'Meeting', reminderMinutes: [10], calendarId: 'cal' });
  });

  it('uses event overrides when useDefault is false, popup only', () => {
    const event = mapEvent(
      {
        id: 'e2',
        start: { dateTime: '2026-11-06T10:00:00+01:00' },
        end: { dateTime: '2026-11-06T11:00:00+01:00' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 5 },
            { method: 'email', minutes: 60 },
          ],
        },
      },
      calendar,
    );
    expect(event?.reminderMinutes).toEqual([5]);
  });

  it('gives no reminders when overrides are empty', () => {
    const event = mapEvent(
      {
        id: 'e3',
        start: { dateTime: '2026-11-06T10:00:00Z' },
        end: { dateTime: '2026-11-06T11:00:00Z' },
        reminders: { useDefault: false },
      },
      calendar,
    );
    expect(event?.reminderMinutes).toEqual([]);
  });

  it('maps all-day events keeping date strings', () => {
    const event = mapEvent({ id: 'e4', start: { date: '2026-11-06' }, end: { date: '2026-11-07' } }, calendar);
    expect(event).toMatchObject({ allDay: true, start: '2026-11-06', end: '2026-11-07', title: '(Senza titolo)' });
  });

  it('skips cancelled events and events without start', () => {
    expect(mapEvent({ id: 'e5', status: 'cancelled', start: { date: '2026-11-06' } }, calendar)).toBeNull();
    expect(mapEvent({ id: 'e6' }, calendar)).toBeNull();
  });

  it('reads the response status of the current user', () => {
    const event = mapEvent(
      {
        id: 'e7',
        start: { dateTime: '2026-11-06T10:00:00Z' },
        end: { dateTime: '2026-11-06T11:00:00Z' },
        attendees: [{ responseStatus: 'accepted' }, { self: true, responseStatus: 'declined' }],
      },
      calendar,
    );
    expect(event?.responseStatus).toBe('declined');
  });

  it('uses the event color when set, none otherwise', () => {
    const times = { start: { dateTime: '2026-11-06T10:00:00Z' }, end: { dateTime: '2026-11-06T11:00:00Z' } };
    expect(mapEvent({ id: 'e8', colorId: '11', ...times }, calendar)?.color).toBe('#d50000');
    expect(mapEvent({ id: 'e9', ...times }, calendar)?.color).toBeUndefined();
    expect(mapEvent({ id: 'e10', colorId: '99', ...times }, calendar)?.color).toBeUndefined();
  });
});
