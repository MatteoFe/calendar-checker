# Calendar Checker

A lightweight Chrome extension (Manifest V3) that shows your Google Calendar events at a glance and handles reminders with snooze. No backend: everything runs in the browser.

> Personal project, not published on the Chrome Web Store. The UI is in Italian.

## Features

- **Month view** in the toolbar popup, using each calendar's own color. Clicking an event opens it in Google Calendar.
- **Next-event badge** on the toolbar icon (`ora`, `Xm`, `Xh`, `Xg`), shown when the next event is less than 2 days away, with title and time in the tooltip.
- **Reminders** based on those already configured in Google Calendar (event overrides or calendar defaults), shown in a popup window with one card per event.
- **Snooze** for 5, 10, 15, 30 minutes, 1 hour or 4 hours, plus "dismiss all".
- **Missed reminders** fired while Chrome was closed are shown at startup, only for events not yet over.
- **Read-only access**: uses the `calendar.readonly` scope and never modifies your calendars.

## Tech stack

- TypeScript
- Preact + `@preact/signals`
- Vite (multi-page build)
- Tailwind CSS + DaisyUI
- Vitest

No date library: dates are handled with `Intl` and pure functions.

Preact was chosen after building the same popup with Angular and React: the gzipped popup bundle was 8.8 kB with Preact versus 29.7 kB with Angular and 68.9 kB with React.

## Architecture

```
src/
├── core/        pure domain logic, no chrome.* or Preact imports (unit tested)
├── platform/    thin wrappers around chrome.* APIs
├── background/  service worker: sync, reminders, badge
└── ui/          Preact pages: popup, reminder window, options
```

Main design rules:

- **Functional core, imperative shell**: all business logic lives in `core/` as pure functions; `platform/` and `background/` handle side effects.
- **Stateless service worker**: MV3 terminates the worker when idle, so state lives only in `chrome.storage` and alarms. On startup everything is recomputed from stored state.
- **Single writer**: only the service worker writes reminder state; the UI reads from storage (`onChanged`) and sends commands via `runtime.sendMessage`.
- **Simple sync**: periodic polling over a fixed window (first day of the current month to today + 60 days), replacing the cache entirely.

## Getting started

Requirements: Node.js and Google Chrome.

```bash
npm install
npm run build    # type check + production build into dist/
npm run dev      # rebuild on change
npm test         # unit tests
```

Load the extension in Chrome:

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `dist/` folder.

### Using your own OAuth client

The `oauth2.client_id` and `key` in `public/manifest.json` belong to the author's Google Cloud project, so sign-in will not work for other users. To run your own copy:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/) and enable the **Google Calendar API**.
2. Configure the OAuth consent screen and add yourself as a test user.
3. Create an OAuth client ID of type **Chrome Extension**, using your extension ID.
4. Replace `client_id` in `public/manifest.json` and remove or replace `key`.

## License

[MIT](LICENSE)
