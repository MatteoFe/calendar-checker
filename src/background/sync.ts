import { mergeSync } from '../core/merge-sync';
import { mapCalendar, mapEvent } from '../core/map-event';
import { type SyncWindow, syncWindow } from '../core/sync-window';
import type { CachedCalendar, CalendarEvent, CalendarSyncResult, RawCalendarListEntry } from '../core/types';
import { listEvents, listSelectedCalendars } from '../platform/calendar-api';
import { readCache, writeCache } from '../platform/storage';

async function fetchCalendarEvents(
  calendar: CachedCalendar,
  window: ReturnType<typeof syncWindow>,
  interactive: boolean,
): Promise<CalendarEvent[] | null> {
  try {
    const raw = await listEvents(calendar.id, window, interactive);
    return raw.flatMap((e) => mapEvent(e, calendar) ?? []);
  } catch (error) {
    console.warn(`Sync failed for calendar ${calendar.id}`, error);
    return null;
  }
}

// Full sync: on any failure of the calendar list the cache is left untouched
export async function runSync(interactive = false): Promise<void> {
  let rawCalendars: RawCalendarListEntry[];
  try {
    rawCalendars = await listSelectedCalendars(interactive);
  } catch (error) {
    console.warn('Sync skipped: cannot list calendars', error);
    return;
  }

  const now = new Date();
  const window = syncWindow(now);
  const calendars = rawCalendars.map(mapCalendar);
  const results: CalendarSyncResult[] = await Promise.all(
    calendars.map(async (calendar) => ({ calendar, events: await fetchCalendarEvents(calendar, window, interactive) })),
  );

  await writeCache(mergeSync(await readCache(), results, now));
}

// Events of the cached calendars in an arbitrary range; nothing is stored.
// Used by the popup for months outside the sync window.
export async function fetchEventsInRange(window: SyncWindow): Promise<CalendarEvent[]> {
  const { calendars } = await readCache();
  const results = await Promise.all(calendars.map((calendar) => fetchCalendarEvents(calendar, window, false)));
  return results.flatMap((events) => events ?? []);
}
