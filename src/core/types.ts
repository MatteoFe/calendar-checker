// Raw shapes returned by the Google Calendar API (only the fields we request).
export interface RawReminder {
  method: string;
  minutes: number;
}

export interface RawCalendarListEntry {
  id: string;
  summary: string;
  backgroundColor?: string;
  selected?: boolean;
  defaultReminders?: RawReminder[];
}

export interface RawEventTime {
  date?: string;
  dateTime?: string;
}

export interface RawEvent {
  id: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  start?: RawEventTime;
  end?: RawEventTime;
  attendees?: { self?: boolean; responseStatus?: string }[];
  reminders?: { useDefault?: boolean; overrides?: RawReminder[] };
}

// Domain shapes stored in chrome.storage.local.
export interface CachedCalendar {
  id: string;
  summary: string;
  color: string;
  defaultReminderMinutes: number[];
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  // ISO dateTime for timed events, YYYY-MM-DD for all-day events (end is exclusive)
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string;
  responseStatus?: string;
  reminderMinutes: number[];
}

export interface SyncCache {
  calendars: CachedCalendar[];
  events: CalendarEvent[];
  lastSync: string | null;
}

// events === null means the fetch for that calendar failed
export interface CalendarSyncResult {
  calendar: CachedCalendar;
  events: CalendarEvent[] | null;
}

// Reminder state, written only by the service worker.
export type ReminderStatus = 'pending' | 'fired' | 'snoozed' | 'dismissed';

export interface ReminderEntry {
  key: string;
  calendarId: string;
  eventId: string;
  // Epoch ms of the next time this reminder must fire (pending and snoozed only)
  fireAt: number;
  status: ReminderStatus;
}

export type ReminderState = Record<string, ReminderEntry>;

export type SnoozeOptionId = 'm5' | 'm10' | 'm15' | 'm30' | 'h1' | 'h4' | 'before10' | 'before5' | 'atStart';

// Commands sent by the UI to the service worker
export type ReminderCommand =
  | { type: 'snooze'; keys: string[]; option: SnoozeOptionId }
  | { type: 'dismiss'; keys: string[] }
  | { type: 'dismissAll' };

// Commands sent by the popup to the service worker
export type PopupCommand = { type: 'syncNow' } | { type: 'fetchRange'; timeMin: string; timeMax: string };

// Reply of the service worker to any command
export interface CommandResponse {
  ok: boolean;
  events?: CalendarEvent[];
}

// User settings, stored in chrome.storage.sync
export interface Settings {
  // null until the user changes the selection: then Google's own "selected" flags apply
  selectedCalendarIds: string[] | null;
}
