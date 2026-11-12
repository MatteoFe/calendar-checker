import { describe, expect, it } from 'vitest';
import { syncWindow } from './sync-window';

describe('syncWindow', () => {
  it('starts on the first day shown by the current month grid', () => {
    const { timeMin } = syncWindow(new Date(2026, 10, 18, 15, 30));
    expect(timeMin).toBe(new Date(2026, 9, 26).toISOString());
  });

  it('ends 60 days after now, across month and year boundaries', () => {
    const { timeMax } = syncWindow(new Date(2026, 10, 18, 15, 30));
    expect(timeMax).toBe(new Date(2027, 0, 17, 15, 30).toISOString());
  });
});
