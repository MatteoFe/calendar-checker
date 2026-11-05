import type { CalendarEvent } from './types';

// Next event for badge and tooltip: skips all-day and declined events, keeps the one
// in progress or the closest upcoming one.
export const nextEvent = (events: readonly CalendarEvent[], now: Date): CalendarEvent | undefined =>
  events
    .filter((e) => !e.allDay && e.responseStatus !== 'declined' && Date.parse(e.end) > now.getTime())
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
