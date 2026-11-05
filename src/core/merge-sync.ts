import type { CalendarSyncResult, SyncCache } from './types';

// Replaces the cache calendar by calendar: a failed calendar keeps its previous events,
// calendars no longer selected are dropped.
export const mergeSync = (previous: SyncCache, results: CalendarSyncResult[], now: Date): SyncCache => ({
  calendars: results.map((r) => r.calendar),
  events: results.flatMap((r) => r.events ?? previous.events.filter((e) => e.calendarId === r.calendar.id)),
  lastSync: now.toISOString(),
});
