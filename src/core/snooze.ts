import { eventStartMs } from './reminders';
import type { CalendarEvent, SnoozeOptionId } from './types';

const MINUTE = 60_000;

interface SnoozeDefinition {
  id: SnoozeOptionId;
  label: string;
  // Fixed options are relative to now, the others to the event start
  base: 'now' | 'start';
  offsetMinutes: number;
}

const DEFINITIONS: readonly SnoozeDefinition[] = [
  { id: 'm5', label: '5 minuti', base: 'now', offsetMinutes: 5 },
  { id: 'm10', label: '10 minuti', base: 'now', offsetMinutes: 10 },
  { id: 'm15', label: '15 minuti', base: 'now', offsetMinutes: 15 },
  { id: 'm30', label: '30 minuti', base: 'now', offsetMinutes: 30 },
  { id: 'h1', label: '1 ora', base: 'now', offsetMinutes: 60 },
  { id: 'h4', label: '4 ore', base: 'now', offsetMinutes: 240 },
  { id: 'before10', label: '10 min prima', base: 'start', offsetMinutes: -10 },
  { id: 'before5', label: '5 min prima', base: 'start', offsetMinutes: -5 },
  { id: 'atStart', label: "All'inizio", base: 'start', offsetMinutes: 0 },
];

const definitionOf = (id: SnoozeOptionId): SnoozeDefinition => DEFINITIONS.find((d) => d.id === id)!;

export const snoozeUntil = (id: SnoozeOptionId, event: CalendarEvent, now: number): number => {
  const { base, offsetMinutes } = definitionOf(id);
  return (base === 'now' ? now : eventStartMs(event)) + offsetMinutes * MINUTE;
};

// Relative-to-start options are offered only while they still fall in the future
export const availableSnoozeOptions = (
  event: CalendarEvent,
  now: number,
): { id: SnoozeOptionId; label: string }[] =>
  DEFINITIONS.filter((d) => d.base === 'now' || snoozeUntil(d.id, event, now) > now).map(({ id, label }) => ({ id, label }));
