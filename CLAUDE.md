# Calendar Checker

Estensione Chrome (Manifest V3) per uso personale: mostra gli eventi di Google Calendar e gestisce promemoria con snooze. Analisi e decisioni in `docs/analisi-preliminare.md` (fonte di verità: aggiornarla quando si decide qualcosa).

## Stack

- TypeScript, Preact + `@preact/signals`, Vite (multi-page), Tailwind CSS + DaisyUI, Vitest.
- Nessun backend. Nessuna libreria di date (`Intl` e funzioni pure).
- Gli scaffolder in `experiments/` servono solo come confronto tra framework: non sono il progetto.

## Struttura

- `src/core/`: logica di dominio, funzioni pure, nessun import di `chrome.*` o Preact. Qui vanno i test Vitest.
- `src/platform/`: wrapper sottili su `chrome.*`.
- `src/background/`: service worker.
- `src/ui/`: Preact (popup, promemoria, opzioni).

## Regole MV3

- Il service worker viene terminato quando è inattivo: nessuno stato in memoria, solo `chrome.storage` e alarms.
- Solo il service worker scrive lo stato dei promemoria; la UI legge da storage (`onChanged`) e invia comandi con `runtime.sendMessage`.
- Un solo alarm "prossimo promemoria", più `sync` (5 min) e `tick` (1 min). All'avvio si ricalcola dallo stato salvato, non ci si fida degli alarm.
- Sync senza `syncToken`: finestra dal primo del mese corrente a oggi + 60 giorni, cache sostituita per intero.
- CSP di MV3: niente script inline.

## Flusso di lavoro

- Procedere per slice come nel piano dell'analisi, con piano approvato prima di implementare.
- Un commit per slice; nessun `git init` né push senza richiesta esplicita.
