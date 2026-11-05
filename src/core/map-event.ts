import type { CachedCalendar, CalendarEvent, RawCalendarListEntry, RawEvent, RawReminder } from './types';

const DEFAULT_COLOR = '#4285f4';
const UNTITLED = '(Senza titolo)';

// Only popup reminders are relevant: email reminders must not open a window
const popupMinutes = (reminders: RawReminder[] | undefined): number[] =>
  (reminders ?? []).filter((r) => r.method === 'popup').map((r) => r.minutes);

export const mapCalendar = (raw: RawCalendarListEntry): CachedCalendar => ({
  id: raw.id,
  summary: raw.summary,
  color: raw.backgroundColor ?? DEFAULT_COLOR,
  defaultReminderMinutes: popupMinutes(raw.defaultReminders),
});

// Returns null for events that must not be cached (cancelled or without a start)
export const mapEvent = (raw: RawEvent, calendar: CachedCalendar): CalendarEvent | null => {
  if (raw.status === 'cancelled') return null;

  const allDay = raw.start?.date !== undefined;
  const start = raw.start?.dateTime ?? raw.start?.date;
  if (!start) return null;
  const end = raw.end?.dateTime ?? raw.end?.date ?? start;

  const reminderMinutes =
    raw.reminders?.useDefault === false ? popupMinutes(raw.reminders.overrides) : calendar.defaultReminderMinutes;

  return {
    id: raw.id,
    calendarId: calendar.id,
    title: raw.summary || UNTITLED,
    start,
    end,
    allDay,
    htmlLink: raw.htmlLink ?? '',
    responseStatus: raw.attendees?.find((a) => a.self)?.responseStatus,
    reminderMinutes,
  };
};
