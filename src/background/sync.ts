import { mergeSync } from '../core/merge-sync';
import { mapCalendar, mapEvent } from '../core/map-event';
import { resolveCalendars } from '../core/settings';
import { type SyncWindow, syncWindow } from '../core/sync-window';
import type { CachedCalendar, CalendarEvent, CalendarSyncResult, RawCalendarListEntry } from '../core/types';
import { listCalendars, listEvents } from '../platform/calendar-api';
import { readCache, readSettings, writeCache } from '../platform/storage';

async function fetchCalendarEvents(
  calendar: CachedCalendar,
  window: SyncWindow,
): Promise<CalendarEvent[] | null> {
  try {
    const raw = await listEvents(calendar.id, window);
    return raw.flatMap((e) => mapEvent(e, calendar) ?? []);
  } catch (error) {
    console.warn(`Sync failed for calendar ${calendar.id}`, error);
    return null;
  }
}

// Full sync: on any failure of the calendar list the cache is left untouched.
// Authorization is granted from the options page, so this never prompts.
export async function runSync(): Promise<void> {
  let rawCalendars: RawCalendarListEntry[];
  try {
    rawCalendars = resolveCalendars(await listCalendars(), (await readSettings()).selectedCalendarIds);
  } catch (error) {
    console.warn('Sync skipped: cannot list calendars', error);
    return;
  }

  const now = new Date();
  const window = syncWindow(now);
  const calendars = rawCalendars.map(mapCalendar);
  const results: CalendarSyncResult[] = await Promise.all(
    calendars.map(async (calendar) => ({ calendar, events: await fetchCalendarEvents(calendar, window) })),
  );

  await writeCache(mergeSync(await readCache(), results, now));
}

// Events of the cached calendars in an arbitrary range; nothing is stored.
// Used by the popup for months outside the sync window.
export async function fetchEventsInRange(window: SyncWindow): Promise<CalendarEvent[]> {
  const { calendars } = await readCache();
  const results = await Promise.all(calendars.map((calendar) => fetchCalendarEvents(calendar, window)));
  return results.flatMap((events) => events ?? []);
}
