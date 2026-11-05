import { render } from 'preact';
import '../style.css';
import { authorize, calendars, checkedIds, errorMessage, init, status, toggle } from './options-store';

const DEFAULT_COLOR = '#4285f4';

const Authorize = () => (
  <section class="flex flex-col items-start gap-3">
    <p class="text-sm">
      Per mostrare gli eventi serve il permesso di sola lettura su Google Calendar. Google potrebbe avvisare che l'app non è verificata:
      è normale per un'estensione personale.
    </p>
    <button type="button" class="btn btn-primary" onClick={() => void authorize()}>
      Autorizza accesso a Google Calendar
    </button>
  </section>
);

const CalendarList = () => (
  <section class="flex flex-col gap-2">
    <h2 class="text-lg font-semibold">Calendari da mostrare</h2>
    <p class="text-sm opacity-70">Le modifiche si applicano subito.</p>
    {calendars.value.length === 0 && <p class="text-sm opacity-70">Nessun calendario trovato.</p>}
    <ul class="flex flex-col gap-1">
      {calendars.value.map((calendar) => (
        <li key={calendar.id}>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-base-200">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={checkedIds.value.has(calendar.id)}
              onChange={(event) => void toggle(calendar.id, event.currentTarget.checked)}
            />
            <span class="size-3 shrink-0 rounded-full" style={{ background: calendar.backgroundColor ?? DEFAULT_COLOR }} />
            <span class="truncate">{calendar.summary}</span>
          </label>
        </li>
      ))}
    </ul>
  </section>
);

const App = () => (
  <main class="mx-auto flex max-w-xl flex-col gap-6 p-6">
    <h1 class="text-xl font-bold">Calendar Checker</h1>
    {status.value === 'loading' && <span class="loading loading-spinner" />}
    {status.value === 'unauthorized' && <Authorize />}
    {status.value === 'ready' && <CalendarList />}
    {status.value === 'error' && (
      <div class="flex flex-col items-start gap-3">
        <p class="text-sm text-error">Non riesco a leggere i calendari: {errorMessage.value}</p>
        <button type="button" class="btn" onClick={() => void authorize()}>
          Riprova
        </button>
      </div>
    )}
  </main>
);

void init();
render(<App />, document.getElementById('app')!);
