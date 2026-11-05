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

// Weeks start on Monday; only the weeks needed by the month are returned (5 or 6)
export const monthGrid = (year: number, month: number): GridDay[][] => {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
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

export const monthBounds = (year: number, month: number): SyncWindow => ({
  timeMin: new Date(year, month, 1).toISOString(),
  timeMax: new Date(year, month + 1, 1).toISOString(),
});

// True when the whole month falls inside the cached sync window
export const isMonthCovered = (window: SyncWindow, year: number, month: number): boolean => {
  const bounds = monthBounds(year, month);
  return Date.parse(window.timeMin) <= Date.parse(bounds.timeMin) && Date.parse(bounds.timeMax) <= Date.parse(window.timeMax);
};

export const shiftMonth = (year: number, month: number, delta: number): { year: number; month: number } => {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
};
