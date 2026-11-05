import { effect } from '@preact/signals';
import { render } from 'preact';
import { formatEventTime, relativeStart } from '../../core/format';
import { availableSnoozeOptions } from '../../core/snooze';
import { sendReminderCommand } from '../../platform/messaging';
import { closeCurrentWindow } from '../../platform/windows';
import '../style.css';
import { playChime } from './chime';
import { type ReminderCard, cards, loaded, now, startStore } from './reminder-store';

const Card = ({ card }: { card: ReminderCard }) => {
  const { event, keys, color } = card;
  return (
    <article class="card card-border bg-base-200 shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
      <div class="card-body gap-2 p-4">
        <h2 class="card-title text-base">{event.title}</h2>
        <p class="text-sm">{formatEventTime(event)}</p>
        <p class="text-sm font-semibold">{relativeStart(event, now.value)}</p>
        <div class="flex flex-wrap items-center gap-1">
          <span class="text-xs opacity-70">Posticipa:</span>
          {availableSnoozeOptions(event, now.value).map((option) => (
            <button
              key={option.id}
              type="button"
              class="btn btn-xs"
              onClick={() => void sendReminderCommand({ type: 'snooze', keys, option: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div class="card-actions justify-end">
          <button type="button" class="btn btn-sm btn-primary" onClick={() => void sendReminderCommand({ type: 'dismiss', keys })}>
            Ignora
          </button>
        </div>
      </div>
    </article>
  );
};

const App = () => (
  <main class="flex flex-col gap-3 p-3">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-bold">Promemoria</h1>
      {cards.value.length > 1 && (
        <button type="button" class="btn btn-sm btn-outline" onClick={() => void sendReminderCommand({ type: 'dismissAll' })}>
          Ignora tutti
        </button>
      )}
    </header>
    {cards.value.map((card) => (
      <Card key={card.keys.join()} card={card} />
    ))}
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
