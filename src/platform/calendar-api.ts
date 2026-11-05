import type { RawCalendarListEntry, RawEvent } from '../core/types';
import type { SyncWindow } from '../core/sync-window';
import { getAuthToken, removeCachedAuthToken } from './identity';

const API_BASE = 'https://www.googleapis.com/calendar/v3';
const PAGE_SIZE = '250';

// GET with Bearer token; on 401 drops the cached token and retries once.
async function apiGet<T>(path: string, params: URLSearchParams, interactive: boolean): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAuthToken(interactive);
    const res = await fetch(`${API_BASE}${path}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 && attempt === 0) {
      await removeCachedAuthToken(token);
      continue;
    }
    if (!res.ok) throw new Error(`Calendar API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }
  throw new Error('Unauthorized after retry');
}

// Calendars checked in the Google Calendar UI (selected: true)
export async function listSelectedCalendars(interactive = false): Promise<RawCalendarListEntry[]> {
  const params = new URLSearchParams({
    fields: 'items(id,summary,backgroundColor,selected,defaultReminders)',
  });
  const data = await apiGet<{ items?: RawCalendarListEntry[] }>('/users/me/calendarList', params, interactive);
  return (data.items ?? []).filter((c) => c.selected);
}

// All events in the window, recurrences expanded by the API, following pagination
export async function listEvents(calendarId: string, window: SyncWindow, interactive = false): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: window.timeMin,
      timeMax: window.timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: PAGE_SIZE,
      fields: 'nextPageToken,items(id,status,summary,htmlLink,start,end,attendees(self,responseStatus),reminders)',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await apiGet<{ items?: RawEvent[]; nextPageToken?: string }>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      params,
      interactive,
    );
    events.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return events;
}
