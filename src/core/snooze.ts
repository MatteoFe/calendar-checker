import { eventStartMs } from './reminders';
import type { CalendarEvent, SnoozeOptionId } from './types';

const MINUTE = 60_000;

export interface SnoozeOption {
  id: SnoozeOptionId;
  label: string;
  hint: string;
  // "Remind me X minutes before the start" options, as opposed to plain delays from now
  relativeToStart: boolean;
}

interface SnoozeDefinition {
  id: SnoozeOptionId;
  label: string;
  // Tooltip with the full meaning of the short label
  hint: string;
  // Fixed options are relative to now, the others to the event start
  base: 'now' | 'start';
  offsetMinutes: number;
}

const DEFINITIONS: readonly SnoozeDefinition[] = [
  { id: 'm5', label: '5m', hint: 'Posticipa di 5 minuti', base: 'now', offsetMinutes: 5 },
  { id: 'm10', label: '10m', hint: 'Posticipa di 10 minuti', base: 'now', offsetMinutes: 10 },
  { id: 'm15', label: '15m', hint: 'Posticipa di 15 minuti', base: 'now', offsetMinutes: 15 },
  { id: 'm30', label: '30m', hint: 'Posticipa di 30 minuti', base: 'now', offsetMinutes: 30 },
  { id: 'h1', label: '1h', hint: 'Posticipa di 1 ora', base: 'now', offsetMinutes: 60 },
  { id: 'h4', label: '4h', hint: 'Posticipa di 4 ore', base: 'now', offsetMinutes: 240 },
  { id: 'before10', label: '−10m', hint: "10 minuti prima dell'inizio", base: 'start', offsetMinutes: -10 },
  { id: 'before5', label: '−5m', hint: "5 minuti prima dell'inizio", base: 'start', offsetMinutes: -5 },
  { id: 'atStart', label: 'Inizio', hint: "All'inizio dell'evento", base: 'start', offsetMinutes: 0 },
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
): SnoozeOption[] =>
  DEFINITIONS.filter((d) => d.base === 'now' || snoozeUntil(d.id, event, now) > now).map(({ id, label, hint, base }) => ({ id, label, hint, relativeToStart: base === 'start' }));
