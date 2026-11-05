import { computed, signal } from '@preact/signals';
import { resolveCalendars, toggleCalendar } from '../../core/settings';
import type { RawCalendarListEntry } from '../../core/types';
import { listCalendars } from '../../platform/calendar-api';
import { getAuthToken } from '../../platform/identity';
import { requestSync } from '../../platform/messaging';
import { readSettings, writeSettings } from '../../platform/storage';

export type Status = 'loading' | 'unauthorized' | 'ready' | 'error';

export const status = signal<Status>('loading');
export const errorMessage = signal('');
export const calendars = signal<RawCalendarListEntry[]>([]);
const savedIds = signal<string[] | null>(null);

export const checkedIds = computed(() => new Set(resolveCalendars(calendars.value, savedIds.value).map((c) => c.id)));

async function loadCalendars(): Promise<void> {
  try {
    calendars.value = await listCalendars();
    status.value = 'ready';
  } catch (error) {
    errorMessage.value = String(error);
    status.value = 'error';
  }
}

async function refreshInBackground(): Promise<void> {
  try {
    await requestSync();
  } catch (error) {
    console.warn('Background sync failed', error);
  }
}

export async function init(): Promise<void> {
  savedIds.value = (await readSettings()).selectedCalendarIds;
  try {
    await getAuthToken(false);
  } catch {
    status.value = 'unauthorized';
    return;
  }
  await loadCalendars();
}

// Interactive: shows the Google consent screen
export async function authorize(): Promise<void> {
  try {
    await getAuthToken(true);
  } catch (error) {
    errorMessage.value = String(error);
    status.value = 'error';
    return;
  }
  status.value = 'loading';
  await loadCalendars();
  await refreshInBackground();
}

export async function toggle(calendarId: string, checked: boolean): Promise<void> {
  const ids = toggleCalendar(calendars.value, savedIds.value, calendarId, checked);
  savedIds.value = ids;
  await writeSettings({ selectedCalendarIds: ids });
  await refreshInBackground();
}
