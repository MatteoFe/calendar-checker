import { describe, expect, it } from 'vitest';
import { resolveCalendars, toggleCalendar } from './settings';
import type { RawCalendarListEntry } from './types';

const all: RawCalendarListEntry[] = [
  { id: 'a', summary: 'A', selected: true },
  { id: 'b', summary: 'B', selected: true },
  { id: 'c', summary: 'C' },
];

describe('resolveCalendars', () => {
  it('falls back to the calendars selected in Google when nothing is saved', () => {
    expect(resolveCalendars(all, null).map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('uses the saved selection, even for calendars Google leaves unchecked', () => {
    expect(resolveCalendars(all, ['c']).map((c) => c.id)).toEqual(['c']);
    expect(resolveCalendars(all, []).map((c) => c.id)).toEqual([]);
  });

  it('ignores saved ids of calendars that no longer exist', () => {
    expect(resolveCalendars(all, ['a', 'gone']).map((c) => c.id)).toEqual(['a']);
  });
});

describe('toggleCalendar', () => {
  it('materializes the default selection on the first change', () => {
    expect(toggleCalendar(all, null, 'c', true).sort()).toEqual(['a', 'b', 'c']);
    expect(toggleCalendar(all, null, 'a', false)).toEqual(['b']);
  });

  it('adds and removes from a saved selection', () => {
    expect(toggleCalendar(all, ['a'], 'b', true).sort()).toEqual(['a', 'b']);
    expect(toggleCalendar(all, ['a', 'b'], 'a', false)).toEqual(['b']);
  });
});
