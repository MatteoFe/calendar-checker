// Service worker entry point. No in-memory state: only storage and alarms.
import { listCalendars } from '../platform/calendar-api';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Calendar Checker installed');
});

// Temporary slice 2 check: run `await debugListCalendars()` in the service worker console
// to trigger the consent flow and log the calendars.
Object.assign(globalThis, {
  async debugListCalendars() {
    const calendars = await listCalendars(true);
    console.table(calendars.map(({ id, summary, primary }) => ({ id, summary, primary })));
    return calendars.length;
  },
});
