// Service worker entry point. No in-memory state: only storage and alarms.
import { updateBadge } from './badge';
import { runSync } from './sync';

const SYNC_ALARM = 'sync';
const SYNC_PERIOD_MINUTES = 5;
const TICK_ALARM = 'tick';
const TICK_PERIOD_MINUTES = 1;

// Alarms may be lost, so they are recreated if missing; creation is idempotent
async function ensureAlarm(name: string, periodInMinutes: number): Promise<void> {
  if (!(await chrome.alarms.get(name))) {
    await chrome.alarms.create(name, { periodInMinutes });
  }
}

async function syncAndRefresh(interactive = false): Promise<void> {
  await runSync(interactive);
  await updateBadge();
}

async function bootstrap(): Promise<void> {
  await ensureAlarm(SYNC_ALARM, SYNC_PERIOD_MINUTES);
  await ensureAlarm(TICK_ALARM, TICK_PERIOD_MINUTES);
  await updateBadge();
  await syncAndRefresh();
}

chrome.runtime.onInstalled.addListener(() => void bootstrap());
chrome.runtime.onStartup.addListener(() => void bootstrap());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) void syncAndRefresh();
  if (alarm.name === TICK_ALARM) void updateBadge();
});

// Temporary: run `await debugSync()` in the service worker console to grant consent and sync.
// To be removed when the options page (slice 7) handles authorization.
Object.assign(globalThis, {
  async debugSync() {
    await syncAndRefresh(true);
    return chrome.storage.local.get('syncCache');
  },
});
