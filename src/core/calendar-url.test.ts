import { describe, expect, it } from 'vitest';
import { newEventUrl } from './calendar-url';

describe('newEventUrl', () => {
  it('builds an all-day range ending on the next day', () => {
    expect(newEventUrl('2026-11-15')).toBe('https://calendar.google.com/calendar/r/eventedit?dates=20261115/20261116');
  });

  it('rolls over month and year boundaries', () => {
    expect(newEventUrl('2026-12-31')).toBe('https://calendar.google.com/calendar/r/eventedit?dates=20261231/20270101');
  });
});
