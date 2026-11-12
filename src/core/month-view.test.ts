import { describe, expect, it } from 'vitest';
import { chipLabel } from './format';
import { readableTextColor } from './color';
import { dayKey, eventsByDay, gridBounds, isMonthCovered, monthGrid, shiftMonth } from './month-view';
import type { CalendarEvent } from './types';

const ev = (partial: Partial<CalendarEvent> & { id: string }): CalendarEvent => ({
  calendarId: 'c',
  title: partial.id,
  start: '2026-11-05T10:00:00+01:00',
  end: '2026-11-05T11:00:00+01:00',
  allDay: false,
  htmlLink: '',
  reminderMinutes: [],
  ...partial,
});

describe('monthGrid', () => {
  it('starts on Monday and flags days outside the month', () => {
    // November 2026 starts on a Sunday: the first row begins on Monday 26 October
    const grid = monthGrid(2026, 10);
    expect(grid[0]?.[0]).toEqual({ key: '2026-10-26', day: 26, inMonth: false });
    expect(grid[0]?.[6]).toEqual({ key: '2026-11-01', day: 1, inMonth: true });
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it('uses only five rows when the month fits', () => {
    // February 2027 starts on Monday and has 28 days
    expect(monthGrid(2027, 1)).toHaveLength(4);
    expect(monthGrid(2026, 8)).toHaveLength(5);
  });
});

describe('eventsByDay', () => {
  it('places timed events on their local start day, all-day first', () => {
    const timed = ev({ id: 'timed', start: new Date(2026, 10, 5, 10).toISOString(), end: new Date(2026, 10, 5, 11).toISOString() });
    const allDay = ev({ id: 'allday', allDay: true, start: '2026-11-05', end: '2026-11-06' });
    const byDay = eventsByDay([timed, allDay]);
    expect(byDay.get('2026-11-05')?.map((e) => e.id)).toEqual(['allday', 'timed']);
    expect(byDay.has('2026-11-06')).toBe(false);
  });

  it('spreads multi-day all-day events over each day, end exclusive', () => {
    const trip = ev({ id: 'trip', allDay: true, start: '2026-11-05', end: '2026-11-08' });
    expect([...eventsByDay([trip]).keys()]).toEqual(['2026-11-05', '2026-11-06', '2026-11-07']);
  });

  it('does not spill a timed event ending at midnight into the next day', () => {
    const late = ev({ id: 'late', start: new Date(2026, 10, 5, 22).toISOString(), end: new Date(2026, 10, 6, 0).toISOString() });
    expect([...eventsByDay([late]).keys()]).toEqual(['2026-11-05']);
  });
});

describe('gridBounds', () => {
  it('spans the whole grid, adjacent months included', () => {
    expect(gridBounds(2026, 10)).toEqual({
      timeMin: new Date(2026, 9, 26).toISOString(),
      timeMax: new Date(2026, 11, 7).toISOString(),
    });
  });
});

describe('isMonthCovered', () => {
  const window = { timeMin: new Date(2026, 9, 26).toISOString(), timeMax: new Date(2027, 0, 4, 12).toISOString() };

  it('is true when the month grid is entirely inside the window', () => {
    expect(isMonthCovered(window, 2026, 10)).toBe(true);
    expect(isMonthCovered(window, 2026, 11)).toBe(true);
  });

  it('is false for past months and months crossing the window end', () => {
    expect(isMonthCovered(window, 2026, 9)).toBe(false);
    expect(isMonthCovered(window, 2027, 0)).toBe(false);
  });
});

describe('helpers', () => {
  it('shifts months across years', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it('formats local day keys', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('chooses readable text colors', () => {
    expect(readableTextColor('#ffffff')).toBe('#1f2937');
    expect(readableTextColor('#039be5')).toBe('#ffffff');
    expect(readableTextColor('not-a-color')).toBe('#ffffff');
  });

  it('builds chip labels', () => {
    const timed = ev({ id: 'x', title: 'Meeting', start: '2026-11-05T10:00:00+01:00' });
    expect(chipLabel(timed, 'Europe/Rome')).toBe('10:00 Meeting');
    expect(chipLabel(ev({ id: 'y', title: 'Festa', allDay: true, start: '2026-11-05', end: '2026-11-06' }))).toBe('Festa');
  });
});
