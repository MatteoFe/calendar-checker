// Thin wrapper over chrome.storage.local for the sync cache.
import { DEFAULT_SETTINGS } from '../core/settings';
import type { ReminderState, Settings, SyncCache } from '../core/types';

const CACHE_KEY = 'syncCache';

const EMPTY_CACHE: SyncCache = { calendars: [], events: [], lastSync: null };

export async function readCache(): Promise<SyncCache> {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  return (stored[CACHE_KEY] as SyncCache | undefined) ?? EMPTY_CACHE;
}

// Single set call: the cache is replaced atomically
export async function writeCache(cache: SyncCache): Promise<void> {
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

const REMINDERS_KEY = 'reminderState';
const WINDOW_ID_KEY = 'reminderWindowId';

export async function readReminderState(): Promise<ReminderState> {
  const stored = await chrome.storage.local.get(REMINDERS_KEY);
  return (stored[REMINDERS_KEY] as ReminderState | undefined) ?? {};
}

export async function writeReminderState(state: ReminderState): Promise<void> {
  await chrome.storage.local.set({ [REMINDERS_KEY]: state });
}

// Id of the open reminder window, kept in storage because the service worker holds no state
export async function readReminderWindowId(): Promise<number | undefined> {
  const stored = await chrome.storage.local.get(WINDOW_ID_KEY);
  return stored[WINDOW_ID_KEY] as number | undefined;
}

export async function writeReminderWindowId(id: number | undefined): Promise<void> {
  if (id === undefined) await chrome.storage.local.remove(WINDOW_ID_KEY);
  else await chrome.storage.local.set({ [WINDOW_ID_KEY]: id });
}

// Notifies on any change of local storage; listeners re-read what they need
export function onStorageChanged(listener: () => void): void {
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === 'local') listener();
  });
}

const SETTINGS_KEY = 'settings';

export async function readSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] as Partial<Settings> | undefined) };
}

export async function writeSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}
