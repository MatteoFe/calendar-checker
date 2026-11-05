import { effect } from '@preact/signals';
import { render } from 'preact';
import { formatEventTime, relativeStart } from '../../core/format';
import { availableSnoozeOptions } from '../../core/snooze';
import { sendReminderCommand } from '../../platform/messaging';
import { closeCurrentWindow } from '../../platform/windows';
import '../style.css';
import { playChime } from './chime';
import { type ReminderCard, cards, loaded, now, startStore } from './reminder-store';

const Reminder = ({ card }: { card: ReminderCard }) => {
  const { event, keys, color, calendarName } = card;
  const when = relativeStart(event, now.value);
  return (
    <article class="flex flex-col gap-4 py-5">
      <div class="flex flex-col gap-1">
        <p class="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-secondary">
          <span class="size-2 rounded-full" style={{ background: color }} />
          <span class="truncate">{calendarName || 'Calendario'}</span>
        </p>
        <p class={`text-3xl font-semibold tabular-nums tracking-tight ${when === 'in corso' ? 'text-success' : 'text-primary'}`}>
          {when}
        </p>
      </div>
      <div class="flex flex-col gap-0.5">
        <h2 class="text-lg font-medium leading-snug">{event.title}</h2>
        <p class="text-sm tabular-nums text-secondary">{formatEventTime(event)}</p>
      </div>
      <div class="flex flex-col gap-2">
        <p class="text-xs font-medium uppercase tracking-wider text-secondary">Posticipa</p>
        <div class="flex flex-wrap gap-1.5">
          {availableSnoozeOptions(event, now.value).map((option) => (
            <button
              key={option.id}
              type="button"
              class="rounded-full border border-base-300 px-3 py-1 text-xs tabular-nums transition-colors hover:border-primary hover:text-primary"
              onClick={() => void sendReminderCommand({ type: 'snooze', keys, option: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div class="flex justify-end">
        <button type="button" class="btn btn-sm btn-neutral" onClick={() => void sendReminderCommand({ type: 'dismiss', keys })}>
          Ignora
        </button>
      </div>
    </article>
  );
};

const App = () => (
  <main class="min-h-screen px-6 py-2">
    {cards.value.length > 1 && (
      <header class="flex items-center justify-between border-b border-base-300 py-3">
        <h1 class="text-sm font-semibold">{cards.value.length} promemoria</h1>
        <button type="button" class="btn btn-sm btn-ghost" onClick={() => void sendReminderCommand({ type: 'dismissAll' })}>
          Ignora tutti
        </button>
      </header>
    )}
    <div class="divide-y divide-base-300">
      {cards.value.map((card) => (
        <Reminder key={card.keys.join()} card={card} />
      ))}
    </div>
  </main>
);

// Chime once whenever a reminder not seen before appears (also when a snooze expires)
let seenKeys = new Set<string>();
effect(() => {
  if (!loaded.value) return;
  const keys = cards.value.flatMap((card) => card.keys);
  if (keys.some((key) => !seenKeys.has(key))) playChime();
  seenKeys = new Set(keys);
});

// Nothing left to answer: the window has done its job
effect(() => {
  if (loaded.value && cards.value.length === 0) void closeCurrentWindow();
});

startStore();
render(<App />, document.getElementById('app')!);
