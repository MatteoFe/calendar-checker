import { eventEndMs, eventStartMs } from './reminders';
import type { CalendarEvent } from './types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "ven 6 nov · 10:00–11:00", or "ven 6 nov · tutto il giorno"
export const formatEventTime = (event: CalendarEvent, timeZone?: string): string => {
  const intl = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('it-IT', { ...options, timeZone });
  const start = new Date(eventStartMs(event));
  const day = intl({ weekday: 'short', day: 'numeric', month: 'short' }).format(start);
  if (event.allDay) return `${day} · tutto il giorno`;
  const time = intl({ hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time.format(start)}–${time.format(new Date(eventEndMs(event)))}`;
};

// Human readable distance from the event start: "tra 5 min", "in corso"
export const relativeStart = (event: CalendarEvent, now: number): string => {
  const untilStart = eventStartMs(event) - now;
  if (untilStart <= 0) return eventEndMs(event) > now ? 'in corso' : 'terminato';
  if (untilStart < HOUR) return `tra ${Math.ceil(untilStart / MINUTE)} min`;
  if (untilStart < DAY) return `tra ${Math.floor(untilStart / HOUR)} h`;
  return `tra ${Math.floor(untilStart / DAY)} g`;
};
