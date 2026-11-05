import { render } from 'preact';
import '../style.css';
import { authorize, calendars, checkedIds, errorMessage, init, status, toggle } from './options-store';

const DEFAULT_COLOR = '#4285f4';

const SectionTitle = ({ children }: { children: string }) => (
  <h2 class="text-xs font-medium uppercase tracking-wider text-secondary">{children}</h2>
);

const Authorize = () => (
  <section class="flex flex-col items-start gap-4">
    <div class="flex flex-col gap-1">
      <h2 class="text-lg font-semibold">Collega Google Calendar</h2>
      <p class="max-w-md text-sm leading-relaxed text-secondary">
        Serve il permesso di sola lettura sul tuo calendario. Google può avvisare che l'app non è verificata: è normale per
        un'estensione personale.
      </p>
    </div>
    <button type="button" class="btn btn-neutral" onClick={() => void authorize()}>
      Autorizza accesso
    </button>
  </section>
);

const CalendarList = () => {
  const total = calendars.value.length;
  return (
    <section class="flex flex-col gap-3">
      <div class="flex items-baseline justify-between">
        <SectionTitle>Calendari</SectionTitle>
        <span class="text-xs tabular-nums text-secondary">
          {checkedIds.value.size} di {total} attivi
        </span>
      </div>
      {total === 0 && <p class="text-sm text-secondary">Nessun calendario trovato.</p>}
      <ul class="divide-y divide-base-300 border-y border-base-300">
        {calendars.value.map((calendar) => (
          <li key={calendar.id}>
            <label class="flex cursor-pointer items-center gap-3 py-3">
              <span class="size-3 shrink-0 rounded-sm" style={{ background: calendar.backgroundColor ?? DEFAULT_COLOR }} />
              <span class="flex-1 truncate">{calendar.summary}</span>
              <input
                type="checkbox"
                class="toggle toggle-sm toggle-primary"
                checked={checkedIds.value.has(calendar.id)}
                onChange={(event) => void toggle(calendar.id, event.currentTarget.checked)}
              />
            </label>
          </li>
        ))}
      </ul>
      <p class="text-xs text-secondary">Le modifiche si applicano subito.</p>
    </section>
  );
};

const Connected = () => (
  <section class="flex flex-col gap-3">
    <SectionTitle>Account</SectionTitle>
    <p class="flex items-center gap-2 border-y border-base-300 py-3 text-sm">
      <span class="size-2 rounded-full bg-success" />
      Google Calendar collegato, sola lettura
    </p>
  </section>
);

const App = () => (
  <main class="mx-auto flex max-w-xl flex-col gap-10 px-6 py-12">
    <header class="flex items-center gap-4">
      <img src="icons/icon-48.png" alt="" class="size-10" />
      <div>
        <h1 class="text-xl font-semibold leading-tight">Calendar Checker</h1>
        <p class="text-sm text-secondary">Opzioni</p>
      </div>
    </header>
    {status.value === 'loading' && <span class="loading loading-spinner text-secondary" />}
    {status.value === 'unauthorized' && <Authorize />}
    {status.value === 'ready' && (
      <>
        <Connected />
        <CalendarList />
      </>
    )}
    {status.value === 'error' && (
      <section class="flex flex-col items-start gap-3">
        <p class="text-sm text-error">Non riesco a leggere i calendari: {errorMessage.value}</p>
        <button type="button" class="btn btn-neutral btn-sm" onClick={() => void authorize()}>
          Riprova
        </button>
      </section>
    )}
  </main>
);

void init();
render(<App />, document.getElementById('app')!);
