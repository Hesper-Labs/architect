# Architecture

This document describes how Architect is built — for contributors who want to extend it, replace pieces of it, or fork it for self-hosting.

## TL;DR

- **React 18** SPA, bundled by **Vite**.
- **Zustand** stores for state; everything persists to **localStorage** through a pluggable **StorageAdapter**.
- **BYOK Claude API** — calls go directly from the browser to `api.anthropic.com` using the user's key.
- No required backend. Forks can drop in a custom storage adapter (Supabase, Postgres, IndexedDB) to add sync.

## Repository layout

```
architect/
├── public/                Static assets served at /
│   └── logo.png
├── src/
│   ├── App.jsx            Top-level orchestrator (routing tabs, modals, theme, save loop)
│   ├── main.jsx           Vite entry; wraps App in ErrorBoundary
│   ├── components/
│   │   ├── shell/         Sidebar + Topbar
│   │   ├── canvas/        Diagram canvas (nodes, edges, drag, zoom)
│   │   ├── modals/        Preview, History, Import, Review, Design, Screens, Handoff
│   │   ├── chat/          Claude Code chat (drawer + small popup variants)
│   │   ├── tweaks/        Live theme tweaker shell + form-control helpers
│   │   ├── AiAssistant.jsx Inline AI panel for spec audits
│   │   └── ErrorBoundary.jsx
│   ├── views/             Top-level route screens
│   │   ├── Dashboard.jsx
│   │   ├── Editor.jsx
│   │   ├── Templates.jsx
│   │   └── Settings.jsx
│   ├── lib/               Pure logic (no React)
│   │   ├── claude.js      Anthropic API client (BYOK)
│   │   ├── export-engine.js
│   │   └── storage/
│   │       ├── adapter.js     Abstract base class
│   │       ├── local-storage.js  Default impl
│   │       └── index.js       Re-exports + singleton
│   ├── store/             Zustand stores
│   │   ├── projects.js    Project list + CRUD + import/export
│   │   └── settings.js    App settings, tweaks, API key
│   ├── data/
│   │   ├── demo-project.js     "Pulse" example project
│   │   ├── template-presets.js Bundled spec templates
│   │   ├── design-data.js      Tokens + component inventory (demo)
│   │   └── icons.jsx           Stroke-based SVG icon registry
│   ├── styles/
│   │   └── main.css       ~90 KB hand-crafted CSS, no UI framework
│   └── utils/
│       └── debounce.js
├── tests/                 Vitest unit tests
├── .github/               CI workflow, issue/PR templates, Dependabot
├── eslint.config.js       Flat config
├── vite.config.js         Vite + Vitest config
└── index.html             Vite HTML entry
```

## State and data flow

Three layers, each with a distinct lifetime:

1. **Persistent** (`localStorage` via `StorageAdapter`)
   - All projects (metadata + content)
   - User settings (export defaults, AI prefs, theme tweaks)
   - Anthropic API key
2. **Store** (`useProjectsStore`, `useSettingsStore`)
   - Hydrated from storage on app start
   - Mutations write through to storage
   - Components subscribe via Zustand selectors
3. **Local component state**
   - Modal open/close, search query, tab, hover/drag, etc.
   - Lives only for the session

### Editor save loop

```
User edits spec/canvas
  → setSpec / setNodes / setEdges in App.jsx (local state)
  → debounced save (600ms) to useProjectsStore.setContent
  → adapter.set("project:<id>", content)
  → updatedAt bumps in projects metadata
  → Sidebar's Recent list reflects the change
```

Switching projects (from the Dashboard or the Sidebar) cancels the pending save, then loads the new project's content into the editor state.

## Storage adapter pattern

Every persistent operation goes through `StorageAdapter`:

```js
class StorageAdapter {
  async get(key)
  async set(key, value)
  async remove(key)
  async list(prefix)
}
```

The default implementation (`LocalStorageAdapter`) namespaces keys under `architect:` and is fully synchronous under the hood, but exposes the async interface so other adapters (network-backed, IndexedDB) can plug in cleanly.

To self-host with sync, implement an adapter and replace the singleton in `src/lib/storage/index.js`:

```js
import { SupabaseAdapter } from "./supabase.js"; // your impl
export const storage = new SupabaseAdapter(supabaseClient);
```

Stores and components don't change.

## Claude integration

`src/lib/claude.js` is a thin client around `POST https://api.anthropic.com/v1/messages`. Key points:

- **BYOK only.** The key is read from `useSettingsStore`, supplied by the user via Settings → Claude API. It is stored in `localStorage` and only sent to api.anthropic.com.
- **Direct browser access.** The required `anthropic-dangerous-direct-browser-access: true` header is set. This is acceptable for self-hosted, single-user deployments where the user owns the key. It is NOT acceptable for multi-tenant SaaS — use a proxy if you fork in that direction.
- **Three call sites:** `AiAssistant` (sidebar audit panel), `CodeChat` (small floating popup, currently unused), and `ClaudeCodeChat` (full drawer with tool-calling). All three fall back to canned sample responses when no key is configured, so the UI never breaks for new users.

The chat drawer parses `[TOOL: name] field: value [/TOOL]` blocks out of model output and renders an "Apply" button per block. Clicking Apply calls `App.jsx`'s `applyEdit`, which mutates `spec` / `nodes` / `edges` according to the tool name.

## Diagram canvas

`src/components/canvas/Canvas.jsx` is a hand-rolled SVG + DOM canvas (no React Flow / Konva). It supports:

- Drag, marquee select, multi-select, snap-to-grid
- Zoom (Ctrl/Cmd + wheel) and pan (middle-click or `H` then drag)
- Six diagram types — system / flow / sequence / ER / state / tree — sharing a single node/edge data model
- A simple BFS-based auto-layout that places nodes in columns by their position in the dependency graph

Diagram-type-specific rendering happens in `Canvas.jsx`; export rendering happens in `export-engine.js`. The two are intentionally decoupled — adding a new diagram type means adding a render branch in both.

## Export engine

`src/lib/export-engine.js` is a pure-function module that converts the project state into output formats:

| Function           | Output                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| `toMermaid`        | Mermaid syntax for graphs / sequence / state / ER / flow / tree           |
| `toAscii`          | Text-fallback diagram for agents without Mermaid renderers                |
| `toClaudeMd`       | A Markdown document in the CLAUDE.md style (the format Claude Code reads) |
| `toStructuredJSON` | A machine-readable spec                                                   |
| `toXML`            | XML for agents that prefer it                                             |
| `validate`         | Returns `{ score, issues }` — surfaces gaps and inconsistencies           |
| `estimateTokens`   | Rough char-based estimate                                                 |

Add a new exporter by exporting another function from this file and wiring it into `PreviewModal.jsx`.

## Build and tooling

- **Vite** for bundling, dev server, and HMR.
- **ESLint** flat config (`eslint.config.js`) — JSX, react-hooks, browser + node globals.
- **Prettier** with double quotes, 100-col print width.
- **Vitest** + jsdom for unit tests; tests live under `tests/`.
- **GitHub Actions** runs lint, format check, tests, and build on every PR (`.github/workflows/ci.yml`).
- **Dependabot** keeps npm + actions deps fresh.

## Forking & self-hosting

If you want sync across devices, multi-user collaboration, or a non-browser client:

1. Implement a `StorageAdapter` against your backend.
2. Replace the singleton in `src/lib/storage/index.js`.
3. (Optional) Add an auth layer in `src/App.jsx` — gate `useProjectsStore.load()` behind a logged-in user.
4. (Optional) Replace the BYOK Claude path in `src/lib/claude.js` with a server proxy so users don't need to manage their own keys.

The component layer doesn't need to change for any of these.
