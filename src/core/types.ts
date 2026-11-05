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
