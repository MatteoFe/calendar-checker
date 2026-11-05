import { getAuthToken, removeCachedAuthToken } from './identity';

const API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

// GET with Bearer token; on 401 drops the cached token and retries once.
async function apiGet<T>(path: string, interactive: boolean): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAuthToken(interactive);
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 && attempt === 0) {
      await removeCachedAuthToken(token);
      continue;
    }
    if (!res.ok) throw new Error(`Calendar API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }
  throw new Error('Unauthorized after retry');
}

export async function listCalendars(interactive = false): Promise<CalendarListEntry[]> {
  const data = await apiGet<{ items?: CalendarListEntry[] }>('/users/me/calendarList', interactive);
  return data.items ?? [];
}
