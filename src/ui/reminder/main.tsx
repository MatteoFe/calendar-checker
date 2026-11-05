import { effect, signal } from '@preact/signals';
import { render } from 'preact';
import { formatEventTime, relativeStart } from '../../core/format';
import { eventRef } from '../../core/reminders';
import { type SnoozeOption, availableSnoozeOptions } from '../../core/snooze';
import { sendReminderCommand } from '../../platform/messaging';
import { closeCurrentWindow } from '../../platform/windows';
import '../style.css';
import { playChime } from './chime';
import { type ReminderCard, cards, loaded, now, startStore } from './reminder-store';

const SCREEN_MARGIN_PX = 80;

// Delays from now on top, "before the start" options below; empty groups are dropped
const snoozeGroups = (event: ReminderCard['event']): SnoozeOption[][] => {
  const options = availableSnoozeOptions(event, now.value);
  return [options.filter((o) => !o.relativeToStart), options.filter((o) => o.relativeToStart)].filter((group) => group.length > 0);
};

// Reference of the card whose snooze options are shown (on hover or focus)
const expanded = signal<string | null>(null);

const Icon = ({ children }: { children: preact.ComponentChildren }) => (
  <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    {children}
  </svg>
);

const SnoozeIcon = () => (
  <Icon>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9v4l2.5 2" />
    <path d="M4.5 4.5 2.5 6.5M19.5 4.5l2 2" />
  </Icon>
);

const CheckIcon = () => (
  <Icon>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

const DoubleCheckIcon = () => (
  <Icon>
    <path d="m2.5 12.5 4.5 4.5L15 8.5" />
    <path d="m11 15.5 1.5 1.5L21.5 7.5" />
  </Icon>
);

const Reminder = ({ card }: { card: ReminderCard }) => {
  const { event, keys, color, calendarName } = card;
  const ref = eventRef(event);
  const isOpen = expanded.value === ref;
  const when = relativeStart(event, now.value);
  return (
    <article class="flex min-h-[76px] items-center" onKeyDown={(event) => event.key === 'Escape' && (expanded.value = null)}>
      <div class="flex w-full items-center gap-3">
        <span class="size-2.5 shrink-0 rounded-full" style={{ background: color }} title={calendarName} />
        <div class="min-w-0 flex-1">
          <h2 class="truncate text-base font-medium leading-snug" title={event.title}>
            {event.title}
          </h2>
          <p class="truncate text-xs tabular-nums text-secondary">
            <span class={`font-semibold ${when === 'in corso' ? 'text-success' : 'text-primary'}`}>{when}</span>
            {' · '}
            {formatEventTime(event)}
          </p>
        </div>
        {/* Button and floating options share a wrapper: leaving both closes the popup */}
        <div class="relative" onMouseLeave={() => isOpen && (expanded.value = null)}>
          <button
            type="button"
            class={`btn btn-ghost btn-square btn-sm ${isOpen ? 'bg-base-200' : ''}`}
            title="Posticipa"
            aria-label="Posticipa"
            aria-expanded={isOpen}
            onMouseEnter={() => (expanded.value = ref)}
            onFocus={() => (expanded.value = ref)}
            onClick={() => (expanded.value = ref)}
          >
            <SnoozeIcon />
          </button>
          {isOpen && (
            // Flush with the button (no gap) so the pointer can travel into the popup
            <div class="absolute right-full top-1/2 z-20 -translate-y-1/2 pr-1">
              <div class="flex w-max max-w-[330px] flex-col gap-1.5 rounded-box border border-base-300 bg-base-100 p-2.5 shadow-lg">
                {snoozeGroups(event).map((options, index) => (
                  <div key={index} class="flex flex-wrap gap-1.5">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        title={option.hint}
                        class="rounded-full border border-base-300 px-2.5 py-1 text-xs tabular-nums transition-colors hover:border-primary hover:text-primary"
                        onClick={() => void sendReminderCommand({ type: 'snooze', keys, option: option.id })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm"
          title="Ignora"
          aria-label="Ignora"
          onClick={() => void sendReminderCommand({ type: 'dismiss', keys })}
        >
          <CheckIcon />
        </button>
      </div>
    </article>
  );
};

const App = () => (
  <main class="px-4 py-2">
    {cards.value.length > 1 && (
      <header class="flex items-center justify-between border-b border-base-300 py-1.5 pl-1">
        <h1 class="text-xs font-medium uppercase tracking-wider text-secondary">{cards.value.length} promemoria</h1>
        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm"
          title="Ignora tutti"
          aria-label="Ignora tutti"
          onClick={() => void sendReminderCommand({ type: 'dismissAll' })}
        >
          <DoubleCheckIcon />
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

// Window title lists the events, so the taskbar already says what it is about
effect(() => {
  document.title = cards.value.map((card) => card.event.title).join(', ') || 'Promemoria';
});

// Nothing left to answer: the window has done its job
effect(() => {
  if (loaded.value && cards.value.length === 0) void closeCurrentWindow();
});

// Keeps the window as tall as its content, up to the screen height
const fitWindowToContent = (root: HTMLElement): void => {
  const frameHeight = window.outerHeight - window.innerHeight;
  const height = Math.min(root.scrollHeight + frameHeight, screen.availHeight - SCREEN_MARGIN_PX);
  window.resizeTo(window.outerWidth, height);
};

startStore();
const root = document.getElementById('app')!;
render(<App />, root);
new ResizeObserver(() => fitWindowToContent(root)).observe(root);
