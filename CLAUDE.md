# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build
npm run serve     # Serve dist/ on port 3000
npm run parse     # Run parse-exercises.js utility
```

No test suite or linter is configured.

## Tech Stack

- **React 18** with TypeScript (strict mode: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`)
- **Vite 5** for build/dev server
- **Tailwind CSS 3** with `tw-` prefix on all utilities (configured in `tailwind.config.js`)
- **No routing library** — custom view switching via `ViewKey` union type
- **No state management library** — React hooks only, all state centralized in `App.tsx`
- **localStorage only** — no backend, no database

## Architecture

### Data Flow

All application state lives in `App.tsx` via `useState` hooks and is passed down through props (no Context API). Mutations go through functions in `src/lib/storage.ts`, which handle both the state transformation and localStorage persistence in one step.

```
App.tsx (state owner)
  ├── Pages receive data + callbacks as props
  ├── Modals always rendered, visibility controlled by state
  └── setData(prev => storageFunction(prev, params))  // mutation pattern
```

### Domain Model

The core distinction is **templates vs instances**:

- **`TemplateLibrary`** (`fitness-tracker-templates` key) — read-only blueprints defining exercise groups (A, B, C...). Stored separately from app data.
- **`Series`** (training blocks) — live instances cloned from a template. Each series owns its own `exercisesByGroup` (editable copy) and `exerciseWeights` (per-exercise weight history, max 50 entries).
- **`Session`** — a single workout occurrence within a series. Tracks exercise completion status and weights. On finish, completed exercises with weight > 0 auto-save to the parent series' weight history.

Key types are in `src/types/fitness.ts`. The `AppData` root contains `profile`, `series[]`, and `sessions[]`.

### View Navigation

Views are switched via a `ViewKey` state variable — no URL routing:

```
"landing" → "series" → "session-tracker"
                     → "history"
"landing" → "metrics"
"landing" → "sessions" → "session-tracker"
```

### Key Files

| File | Role |
|------|------|
| `src/components/App.tsx` | Root component, all state management (~580 lines) |
| `src/lib/storage.ts` | All CRUD operations, localStorage persistence, data migrations |
| `src/lib/utils.ts` | Date formatting, video embed URL extraction, ID generation |
| `src/types/fitness.ts` | All TypeScript interfaces |
| `src/data/exercises.ts` | Default template library (from `exercises.json`) |
| `src/styles/global.css` | Tailwind directives, custom CSS classes (`.glass-panel`, `.touch-target`, `.page-enter`) |

### localStorage Keys

| Key | Contents |
|-----|----------|
| `fitness-tracker-v2` | `AppData` (profile + series + sessions) |
| `fitness-tracker-templates` | `TemplateLibrary` (plan templates) |

Legacy keys (`fitness-tracker-weights`, `fitness-tracker-library`) are auto-migrated on load.

## Conventions

- **UI language is Portuguese (pt-BR)** — all user-facing text is in Portuguese
- **Tailwind prefix**: all utility classes use `tw-` prefix (e.g., `tw-flex`, `tw-bg-surface`)
- **Dark theme only**: background `#0f172a`, surface `#1e293b`, primary `#bef264` (lime), secondary `#a855f7` (purple)
- **Fonts**: Inter (body), Montserrat (display headings)
- **Mobile-first**: safe area insets, 44px touch targets, no-zoom viewport
- **Naming**: `handle*` for event handlers in components, `on*` for callback props
- **Dates**: stored as `YYYY-MM-DD`, displayed as `DD/MM/YYYY` via `formatDate()`
- **IDs**: generated as `"s-" + timestamp + "-" + random(7)` — no UUID dependency
