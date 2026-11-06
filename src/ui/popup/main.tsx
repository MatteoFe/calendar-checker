import { render } from 'preact';
import { readableTextColor } from '../../core/color';
import { chipLabel } from '../../core/format';
import { type GridDay, dayKey, shiftMonth } from '../../core/month-view';
import { eventEndMs } from '../../core/reminders';
import type { CalendarEvent } from '../../core/types';
import { requestShowReminders } from '../../platform/messaging';
import { openOptionsPage } from '../../platform/runtime';
import '../style.css';
import {
  byDay,
  colorOf,
  grid,
  loadingRemote,
  neverSynced,
  pendingReminders,
  remoteFailed,
  selectedDay,
  startStore,
  syncing,
  view,
} from './popup-store';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MAX_CHIPS = 3;

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const monthTitle = (year: number, month: number): string =>
  capitalize(new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1)));

const dayTitle = (key: string): string => {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return capitalize(
    new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day)),
  );
};

const goToMonth = (delta: number): void => {
  view.value = shiftMonth(view.value.year, view.value.month, delta);
  selectedDay.value = null;
};

const goToToday = (): void => {
  const now = new Date();
  view.value = { year: now.getFullYear(), month: now.getMonth() };
  selectedDay.value = dayKey(now);
};

const isDeclined = (event: CalendarEvent): boolean => event.responseStatus === 'declined';

const isPast = (event: CalendarEvent): boolean => eventEndMs(event) <= Date.now();

const Chip = ({ event }: { event: CalendarEvent }) => {
  const color = colorOf(event.calendarId);
  const faded = isDeclined(event) || isPast(event);
  return (
    <a
      href={event.htmlLink || undefined}
      target="_blank"
      rel="noreferrer"
      title={event.title}
      class="block truncate rounded px-1 text-[11px] leading-4"
      style={{
        background: color,
        color: readableTextColor(color),
        opacity: faded ? 0.5 : 1,
        filter: isPast(event) ? 'grayscale(0.6)' : undefined,
        textDecoration: isDeclined(event) ? 'line-through' : undefined,
      }}
    >
      {chipLabel(event)}
    </a>
  );
};

const DayCell = ({ day, todayKey }: { day: GridDay; todayKey: string }) => {
  const events = day.inMonth ? (byDay.value.get(day.key) ?? []) : [];
  const hidden = events.length - MAX_CHIPS;
  const isToday = day.key === todayKey;
  const isSelected = selectedDay.value === day.key;
  return (
    <div
      class={`flex min-h-[78px] flex-col gap-0.5 border border-base-300 p-0.5 ${day.inMonth ? '' : 'opacity-40'} ${isSelected ? 'bg-base-200' : ''}`}
    >
      <button
        type="button"
        class={`self-start rounded-full px-1.5 text-xs ${isToday ? 'bg-primary font-bold text-primary-content' : ''}`}
        onClick={() => (selectedDay.value = day.key)}
      >
        {day.day}
      </button>
      {events.slice(0, MAX_CHIPS).map((event) => (
        <Chip key={`${event.calendarId}|${event.id}|${event.start}`} event={event} />
      ))}
      {hidden > 0 && (
        <button type="button" class="self-start px-1 text-[11px] opacity-70 hover:underline" onClick={() => (selectedDay.value = day.key)}>
          +{hidden} altri
        </button>
      )}
    </div>
  );
};

const DayPanel = ({ day }: { day: string }) => {
  const events = byDay.value.get(day) ?? [];
  return (
    <section class="border-t border-base-300 p-3">
      <h2 class="mb-2 text-sm font-bold">{dayTitle(day)}</h2>
      {events.length === 0 ? (
        <p class="text-sm opacity-70">Nessun evento.</p>
      ) : (
        <ul class="flex flex-col gap-1">
          {events.map((event) => (
            <li key={`${event.calendarId}|${event.id}|${event.start}`}>
              <Chip event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const App = () => {
  const { year, month } = view.value;
  const todayKey = dayKey(new Date());
  return (
    <main class="flex flex-col">
      <header class="flex items-center gap-2 p-3">
        <button type="button" class="btn btn-sm btn-ghost btn-square" aria-label="Mese precedente" onClick={() => goToMonth(-1)}>
          ‹
        </button>
        <button type="button" class="btn btn-sm btn-ghost btn-square" aria-label="Mese successivo" onClick={() => goToMonth(1)}>
          ›
        </button>
        <h1 class="text-lg font-bold">{monthTitle(year, month)}</h1>
        <button type="button" class="btn btn-sm btn-outline" onClick={goToToday}>
          Oggi
        </button>
        <span class="ml-auto text-xs opacity-70">{syncing.value ? 'Aggiornamento…' : loadingRemote.value ? 'Caricamento…' : ''}</span>
      </header>
      {pendingReminders.value > 0 && (
        <button
          type="button"
          class="mx-3 mb-3 flex items-center gap-2 border-y border-base-300 bg-base-200 px-3 py-2 text-left text-sm"
          onClick={() => void requestShowReminders()}
        >
          <span class="size-2 rounded-full bg-warning" />
          <span class="flex-1">
            {pendingReminders.value === 1 ? '1 promemoria in sospeso' : `${pendingReminders.value} promemoria in sospeso`}
          </span>
          <span class="font-medium text-primary">Mostra</span>
        </button>
      )}
      {neverSynced.value && (
        <button type="button" class="px-3 pb-2 text-left text-sm text-warning underline" onClick={() => void openOptionsPage()}>
          Nessuna sincronizzazione ancora: autorizza l'accesso a Google Calendar dalle opzioni.
        </button>
      )}
      {remoteFailed.value && <p class="px-3 pb-2 text-sm text-error">Impossibile caricare questo mese.</p>}
      <div class="grid grid-cols-7 px-3 text-center text-xs font-semibold opacity-70">
        {WEEKDAYS.map((name) => (
          <div key={name}>{name}</div>
        ))}
      </div>
      <div class="grid grid-cols-7 px-3 pb-3">
        {grid.value.flat().map((day) => (
          <DayCell key={day.key} day={day} todayKey={todayKey} />
        ))}
      </div>
      {selectedDay.value && <DayPanel day={selectedDay.value} />}
    </main>
  );
};

startStore();
render(<App />, document.getElementById('app')!);
