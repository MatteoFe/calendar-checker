import type { CalendarEvent } from './types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const BADGE_HORIZON = 2 * DAY;

// Empty string means "no badge"
export const badgeText = (event: CalendarEvent | undefined, now: Date): string => {
  if (!event) return '';
  const untilStart = Date.parse(event.start) - now.getTime();
  if (untilStart <= 0) return 'ora';
  if (untilStart > BADGE_HORIZON) return '';
  if (untilStart < HOUR) return `${Math.ceil(untilStart / MINUTE)}m`;
  if (untilStart < DAY) return `${Math.floor(untilStart / HOUR)}h`;
  return `${Math.floor(untilStart / DAY)}g`;
};

const NO_EVENTS = 'Nessun evento in arrivo';

// Title and start time; the day is prepended when the event is not today
export const tooltipText = (event: CalendarEvent | undefined, now: Date, timeZone?: string): string => {
  if (!event) return NO_EVENTS;
  const start = new Date(event.start);
  const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(d);
  const time = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone }).format(start);
  const day = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone }).format(start);
  const when = dayKey(start) === dayKey(now) ? time : `${day}, ${time}`;
  return `${event.title}\n${when}`;
};
