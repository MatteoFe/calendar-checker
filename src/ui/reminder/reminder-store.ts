import { batch, computed, signal } from '@preact/signals';
import { eventRef, eventStartMs, findEvent, firedEntries } from '../../core/reminders';
import type { CalendarEvent, ReminderState, SyncCache } from '../../core/types';
import { onStorageChanged, readCache, readReminderState } from '../../platform/storage';

const DEFAULT_COLOR = '#4285f4';
const CLOCK_REFRESH_MS = 15_000;

export interface ReminderCard {
  event: CalendarEvent;
  keys: string[];
  color: string;
}

export const loaded = signal(false);
export const now = signal(Date.now());
const cache = signal<SyncCache>({ calendars: [], events: [], lastSync: null });
const reminders = signal<ReminderState>({});

// One card per event: several fired reminders of the same event are grouped
export const cards = computed<ReminderCard[]>(() => {
  const groups = new Map<string, ReminderCard>();
  for (const entry of firedEntries(reminders.value)) {
    const event = findEvent(entry, cache.value.events);
    if (!event) continue;
    const ref = eventRef(event);
    const existing = groups.get(ref);
    if (existing) {
      existing.keys.push(entry.key);
    } else {
      const color = cache.value.calendars.find((c) => c.id === event.calendarId)?.color ?? DEFAULT_COLOR;
      groups.set(ref, { event, keys: [entry.key], color });
    }
  }
  return [...groups.values()].sort((a, b) => eventStartMs(a.event) - eventStartMs(b.event));
});

async function load(): Promise<void> {
  const [freshCache, freshReminders] = await Promise.all([readCache(), readReminderState()]);
  batch(() => {
    cache.value = freshCache;
    reminders.value = freshReminders;
    loaded.value = true;
  });
}

// The UI only reads from storage; the service worker is the only writer
export function startStore(): void {
  void load();
  onStorageChanged(() => void load());
  setInterval(() => {
    now.value = Date.now();
  }, CLOCK_REFRESH_MS);
}
