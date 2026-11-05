// Service worker entry point. No in-memory state: only storage and alarms.
import { runSync } from './sync';

const SYNC_ALARM = 'sync';
const SYNC_PERIOD_MINUTES = 5;

// Alarms may be lost, so they are recreated if missing; creation is idempotent
async function ensureSyncAlarm(): Promise<void> {
  if (!(await chrome.alarms.get(SYNC_ALARM))) {
    await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_PERIOD_MINUTES });
  }
}

async function bootstrap(): Promise<void> {
  await ensureSyncAlarm();
  await runSync();
}

chrome.runtime.onInstalled.addListener(() => void bootstrap());
chrome.runtime.onStartup.addListener(() => void bootstrap());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) void runSync();
});

// Temporary: run `await debugSync()` in the service worker console to grant consent and sync.
// To be removed when the options page (slice 7) handles authorization.
Object.assign(globalThis, {
  async debugSync() {
    await runSync(true);
    return chrome.storage.local.get('syncCache');
  },
});
