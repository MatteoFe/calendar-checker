import { gridStart } from './month-view';

const DAYS_AHEAD = 60;

export interface SyncWindow {
  readonly timeMin: string;
  readonly timeMax: string;
}

// Events are cached from the first day shown by the current month grid to now + 60 days
export const syncWindow = (now: Date): SyncWindow => {
  const start = gridStart(now.getFullYear(), now.getMonth());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + DAYS_AHEAD, now.getHours(), now.getMinutes());
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
};
