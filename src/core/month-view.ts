import { eventEndMs, eventStartMs } from './reminders';
import type { SyncWindow } from './sync-window';
import type { CalendarEvent } from './types';

const MAX_SPAN_DAYS = 62;

export interface GridDay {
  // Local date, YYYY-MM-DD
  key: string;
  day: number;
  inMonth: boolean;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export const dayKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Days of the previous month shown before the 1st (weeks start on Monday)
const gridOffset = (year: number, month: number): number => (new Date(year, month, 1).getDay() + 6) % 7;

const gridWeeks = (year: number, month: number): number =>
  Math.ceil((gridOffset(year, month) + new Date(year, month + 1, 0).getDate()) / 7);

// First day shown by the month grid, possibly in the previous month
export const gridStart = (year: number, month: number): Date => new Date(year, month, 1 - gridOffset(year, month));

// Only the weeks needed by the month are returned (5 or 6)
export const monthGrid = (year: number, month: number): GridDay[][] => {
  const offset = gridOffset(year, month);
  const weeks = gridWeeks(year, month);
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(year, month, 1 - offset + week * 7 + weekday);
      return { key: dayKey(date), day: date.getDate(), inMonth: date.getMonth() === month };
    }),
  );
};

// Local days touched by an event; all-day ends are exclusive and a timed event ending at
// midnight does not spill into the next day.
const daySpan = (event: CalendarEvent): string[] => {
  const startMs = eventStartMs(event);
  const endMs = eventEndMs(event);
  const lastKey = dayKey(new Date(endMs > startMs ? endMs - 1 : startMs));
  const keys: string[] = [];
  let date = new Date(startMs);
  for (let i = 0; i < MAX_SPAN_DAYS; i++) {
    const key = dayKey(date);
    keys.push(key);
    if (key === lastKey) break;
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }
  return keys;
};

// All-day events first, then by start time
const byDayOrder = (a: CalendarEvent, b: CalendarEvent): number =>
  Number(b.allDay) - Number(a.allDay) || eventStartMs(a) - eventStartMs(b) || a.title.localeCompare(b.title);

export const eventsByDay = (events: readonly CalendarEvent[]): Map<string, CalendarEvent[]> => {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    for (const key of daySpan(event)) {
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
    }
  }
  for (const list of byDay.values()) list.sort(byDayOrder);
  return byDay;
};

// Range shown by the month grid, including the days of the adjacent months (end is exclusive)
export const gridBounds = (year: number, month: number): SyncWindow => {
  const start = gridStart(year, month);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + gridWeeks(year, month) * 7);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
};

// True when the whole month grid falls inside the cached sync window
export const isMonthCovered = (window: SyncWindow, year: number, month: number): boolean => {
  const bounds = gridBounds(year, month);
  return Date.parse(window.timeMin) <= Date.parse(bounds.timeMin) && Date.parse(bounds.timeMax) <= Date.parse(window.timeMax);
};

export const shiftMonth = (year: number, month: number, delta: number): { year: number; month: number } => {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
};
