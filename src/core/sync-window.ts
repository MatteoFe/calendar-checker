const DAYS_AHEAD = 60;

export interface SyncWindow {
  readonly timeMin: string;
  readonly timeMax: string;
}

// Events are cached from the first day of the current month to now + 60 days
export const syncWindow = (now: Date): SyncWindow => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + DAYS_AHEAD, now.getHours(), now.getMinutes());
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
};
