// Thin wrapper over chrome.storage.local for the sync cache.
import type { SyncCache } from '../core/types';

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
