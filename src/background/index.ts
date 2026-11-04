// Service worker entry point. No in-memory state: only storage and alarms.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Calendar Checker installed');
});
