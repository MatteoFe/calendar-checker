import type { RawCalendarListEntry, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = { selectedCalendarIds: null };

// Calendars to sync: the saved selection, or the ones checked in Google Calendar by default
export const resolveCalendars = (all: readonly RawCalendarListEntry[], ids: readonly string[] | null): RawCalendarListEntry[] =>
  ids === null ? all.filter((c) => c.selected) : all.filter((c) => ids.includes(c.id));

export const toggleCalendar = (
  all: readonly RawCalendarListEntry[],
  ids: readonly string[] | null,
  calendarId: string,
  checked: boolean,
): string[] => {
  const selection = new Set(resolveCalendars(all, ids).map((c) => c.id));
  if (checked) selection.add(calendarId);
  else selection.delete(calendarId);
  return [...selection];
};
