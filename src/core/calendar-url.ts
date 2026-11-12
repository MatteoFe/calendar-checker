const compact = (date: Date): string =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

// Google Calendar "new event" URL for an all-day event on the given day key (YYYY-MM-DD).
// The end date is exclusive, so it is the following day.
export const newEventUrl = (key: string): string => {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return `https://calendar.google.com/calendar/r/eventedit?dates=${compact(start)}/${compact(end)}`;
};
