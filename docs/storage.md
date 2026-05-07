# Storage & persistence

Architect is **local-first**. Everything you do — projects, settings, snapshots, API keys — lives in your browser's `localStorage`. No backend, no server, no sync (yet).

## What's stored where

All keys are prefixed `architect:` to avoid collisions with other apps on the same origin.

| Key                           | What                                                               | Format     | Sensitive? |
| ----------------------------- | ------------------------------------------------------------------ | ---------- | ---------- |
| `architect:projects`          | Project metadata array (id, name, description, timestamps, isDemo) | JSON       | No         |
| `architect:project:<id>`      | Per-project content (spec, nodes, edges, diagramType, handoff)     | JSON       | No         |
| `architect:currentProjectId`  | The active project's id                                            | String     | No         |
| `architect:settings`          | App settings (export defaults, hasSeenWelcome, specPanelCollapsed) | JSON       | No         |
| `architect:tweaks`            | Theme tweaks (theme, accent, density, showGrid)                    | JSON       | No         |
| `architect:claude_api_key`    | Anthropic API key                                                  | String     | **Yes**    |
| `architect:github_pat`        | GitHub personal access token                                       | String     | **Yes**    |
| `architect:history:snapshots` | All projects' snapshot history                                     | JSON (Map) | No         |
| `architect:__version`         | Storage schema version                                             | Integer    | No         |

## Looking at your data

In Chrome / Edge / Safari devtools:

```
DevTools → Application → Storage → Local Storage → http://localhost:5173
```

You'll see all keys above with their JSON values. Safe to inspect, edit, delete (Architect handles missing keys gracefully and re-seeds the demo project on next reload).

## How much space does it use?

| Asset                                         | Typical size |
| --------------------------------------------- | ------------ |
| Empty project                                 | ~1 KB        |
| Pulse demo (full spec)                        | ~6 KB        |
| Project with 50 features, 30 models, 80 nodes | ~30–50 KB    |
| 25 history snapshots for one project          | ~150–500 KB  |
| Settings + tweaks + keys                      | < 2 KB       |

Browsers grant `localStorage` 5–10 MB per origin (varies by browser). Architect can comfortably hold ~50 medium-sized projects with full snapshot histories before getting close.

When you do hit the quota, Architect catches the `QuotaExceededError` and surfaces it as a toast: _"Browser storage is full. Export and delete old projects from the dashboard to free space."_

## Backups & portability

Local storage is **not a backup**. To preserve a project across machines, browser changes, or accidental data clears:

- **Export per project** — Dashboard → project menu → **Export as JSON** → save the `.architect.json` file
- **Import to restore** — Dashboard → **Import** → pick the file. The project gets a new ID so importing the same file twice creates two copies (deliberate — no overwrite).

## Clearing everything

- Single project: Dashboard → menu → **Delete**
- All projects: DevTools console → `localStorage.clear()` then reload
- Just the welcome wizard state (re-trigger the intro):

```js
const s = JSON.parse(localStorage.getItem("architect:settings") || "{}");
s.hasSeenWelcome = false;
localStorage.setItem("architect:settings", JSON.stringify(s));
location.reload();
```

## Snapshot history

[History modal](../docs/keyboard-shortcuts.md) — accessible from the editor tool rail.

- Snapshots auto-capture 8 seconds after the last edit
- Capped at 25 per project (oldest evicted as new ones are pushed)
- Identical back-to-back states are skipped (no spam)
- Restoring a snapshot first captures the current state as a "before-restore" snapshot, so you can step back

Snapshots persist to `localStorage` (key `architect:history:snapshots`) so they survive reloads — but they're per-project and capped, not a full version history. Use JSON export for permanent backups.

## The `StorageAdapter` pattern

All persistent operations go through a single interface:

```js
class StorageAdapter {
  async get(key)
  async set(key, value)
  async remove(key)
  async list(prefix)
}
```

Default implementation: `LocalStorageAdapter` (`src/lib/storage/local-storage.js`). To swap in another backend (Supabase, IndexedDB, custom HTTP), implement the interface and replace the singleton in `src/lib/storage/index.js`:

```js
import { SupabaseAdapter } from "./supabase.js"; // your fork
export const storage = new SupabaseAdapter(supabaseClient);
```

The stores and components don't need to change — they only know about the adapter interface, not the underlying mechanism. See [extending.md](extending.md) for a worked example.

## See also

- [Extending Architect](extending.md) — implementing a custom storage adapter
- [SECURITY.md](../SECURITY.md) — threat model around API keys in localStorage
- [ARCHITECTURE.md](../ARCHITECTURE.md) — the full data flow
