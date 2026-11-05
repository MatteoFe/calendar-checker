import { computed, effect, signal } from '@preact/signals';
import { eventsByDay, isMonthCovered, monthBounds, monthGrid } from '../../core/month-view';
import { firedEntries } from '../../core/reminders';
import { syncWindow } from '../../core/sync-window';
import type { CalendarEvent, ReminderState, SyncCache } from '../../core/types';
import { requestRange, requestSync } from '../../platform/messaging';
import { onStorageChanged, readCache, readReminderState } from '../../platform/storage';

const DEFAULT_COLOR = '#4285f4';

const today = new Date();
export const view = signal({ year: today.getFullYear(), month: today.getMonth() });
export const selectedDay = signal<string | null>(null);
export const loaded = signal(false);
export const syncing = signal(false);
export const remoteFailed = signal(false);

const cache = signal<SyncCache>({ calendars: [], events: [], lastSync: null });
// Events of months outside the sync window, kept only while the popup is open
const remote = signal<Record<string, CalendarEvent[]>>({});
const reminders = signal<ReminderState>({});

// Events with reminders that fired and still wait for an answer (e.g. the window was closed).
// The key minus its trailing minutes identifies the event, like the cards of the reminder window.
export const pendingReminders = computed(
  () => new Set(firedEntries(reminders.value).map((entry) => entry.key.slice(0, entry.key.lastIndexOf('|')))).size,
);

const monthId = (year: number, month: number): string => `${year}-${month}`;

const covered = computed(() => isMonthCovered(syncWindow(new Date()), view.value.year, view.value.month));

export const neverSynced = computed(() => loaded.value && cache.value.lastSync === null);
export const loadingRemote = computed(
  () => !covered.value && !remoteFailed.value && remote.value[monthId(view.value.year, view.value.month)] === undefined,
);

const visibleEvents = computed(() =>
  covered.value ? cache.value.events : (remote.value[monthId(view.value.year, view.value.month)] ?? []),
);

export const grid = computed(() => monthGrid(view.value.year, view.value.month));
export const byDay = computed(() => eventsByDay(visibleEvents.value));
export const calendarColors = computed(
  () => new Map(cache.value.calendars.map((calendar) => [calendar.id, calendar.color])),
);
export const colorOf = (calendarId: string): string => calendarColors.value.get(calendarId) ?? DEFAULT_COLOR;

async function load(): Promise<void> {
  const [freshCache, freshReminders] = await Promise.all([readCache(), readReminderState()]);
  cache.value = freshCache;
  reminders.value = freshReminders;
  loaded.value = true;
}

async function fetchRemoteMonth(year: number, month: number): Promise<void> {
  try {
    const events = await requestRange(monthBounds(year, month));
    remote.value = { ...remote.peek(), [monthId(year, month)]: events };
  } catch (error) {
    console.warn('Cannot load month', error);
    remoteFailed.value = true;
  }
}

async function refreshInBackground(): Promise<void> {
  syncing.value = true;
  try {
    await requestSync();
  } catch (error) {
    console.warn('Background sync failed', error);
  } finally {
    syncing.value = false;
  }
}

// The popup opens from the cache and updates as the service worker writes new data
export function startStore(): void {
  void load();
  onStorageChanged(() => void load());
  void refreshInBackground();

  // Months outside the cached window are requested when navigated to
  effect(() => {
    const { year, month } = view.value;
    remoteFailed.value = false;
    if (isMonthCovered(syncWindow(new Date()), year, month)) return;
    if (remote.peek()[monthId(year, month)] === undefined) void fetchRemoteMonth(year, month);
  });
}
