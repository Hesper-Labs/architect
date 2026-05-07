# Extending Architect

Architect is built for forking. Three places it's most often extended:

1. [Storage adapters](#storage-adapters) — add Supabase / IndexedDB / a custom HTTP backend
2. [Exporters](#exporters) — add a new output format alongside Markdown / JSON / XML / Mermaid / ASCII
3. [Validation rules](#validation-rules) — add domain-specific spec checks
4. [Claude tool handlers](#claude-tool-handlers) — add new `[TOOL]` blocks the AI can apply

Each is a single file, no framework gymnastics.

## Storage adapters

The storage interface is intentionally tiny:

```js
// src/lib/storage/adapter.js
class StorageAdapter {
  async get(key)            // → unknown | null
  async set(key, value)     // → boolean
  async remove(key)         // → boolean
  async list(prefix)        // → string[]
}
```

To plug in a different backend, implement the interface and replace the singleton:

```js
// src/lib/storage/supabase.js
import { StorageAdapter } from "./adapter.js";

export class SupabaseAdapter extends StorageAdapter {
  constructor(client, table = "architect_kv") {
    super();
    this.client = client;
    this.table = table;
  }

  async get(key) {
    const { data, error } = await this.client
      .from(this.table)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return JSON.parse(data.value);
  }

  async set(key, value) {
    const { error } = await this.client
      .from(this.table)
      .upsert({ key, value: JSON.stringify(value) });
    return !error;
  }

  async remove(key) {
    const { error } = await this.client.from(this.table).delete().eq("key", key);
    return !error;
  }

  async list(prefix = "") {
    const { data } = await this.client.from(this.table).select("key").like("key", `${prefix}%`);
    return (data ?? []).map((r) => r.key);
  }
}
```

Then swap the default singleton:

```js
// src/lib/storage/index.js
import { createClient } from "@supabase/supabase-js";
import { SupabaseAdapter } from "./supabase.js";

const sb = createClient(import.meta.env.VITE_SB_URL, import.meta.env.VITE_SB_KEY);

export { StorageAdapter } from "./adapter.js";
export { LocalStorageAdapter } from "./local-storage.js";
export { SupabaseAdapter } from "./supabase.js";

export const storage = new SupabaseAdapter(sb);
```

Stores (`projects`, `settings`, `history`, etc.) consume `storage` — they don't care about the underlying mechanism. Done.

## Exporters

Exporters live in `src/lib/export-engine.js` as pure functions. Add a new one:

```js
// src/lib/export-engine.js
function toToml(spec, nodes, edges) {
  const out = [];
  out.push(`[project]`);
  out.push(`name = ${JSON.stringify(spec.overview.name)}`);
  out.push(`description = ${JSON.stringify(spec.overview.description)}`);
  // ... etc
  return out.join("\n");
}

export {
  toMermaid,
  toAscii,
  toClaudeMd,
  toStructuredJSON,
  toXML,
  toToml,
  validate,
  estimateTokens,
};
```

Then wire it into `PreviewModal.jsx`:

```jsx
// src/components/modals/PreviewModal.jsx
const toml = useMemo(
  () => ArchitectExport.toToml(spec, nodes, edges),
  [spec, nodes, edges],
);

// Add a tab
{ id: "toml", label: "TOML" }

// And a render branch
{tab === "toml" && <pre className="code-pane">{toml}</pre>}
```

Add a unit test in `tests/lib/export-engine.test.js` to lock the format.

## Validation rules

Rules live inside `validate()` in `src/lib/export-engine.js`. Each is a small block that pushes onto `issues`:

```js
// M16: every public endpoint should have at least one user story.
spec.endpoints
  .filter((e) => e.method === "GET" || e.method === "POST")
  .forEach((e) => {
    const path = e.path.toLowerCase();
    const covered = spec.stories.some((s) => s.text.toLowerCase().includes(path));
    if (!covered) {
      issues.push({
        level: "info",
        section: "Stories",
        msg: `Endpoint ${e.method} ${e.path} has no user story.`,
        fix: "Write a story that covers this endpoint, or mark it internal in the path naming.",
      });
    }
  });
```

Add the corresponding test in `tests/lib/export-engine.test.js` so the rule is regression-protected.

## Claude tool handlers

The Claude Code chat parses `[TOOL: name] field: value [/TOOL]` blocks out of model output and renders an "Apply" button per block. The handler lives in `src/App.jsx` → `applyEdit`.

Add a new tool by extending the switch:

```js
case "add_story": {
  const story = {
    id: `s_${Date.now().toString(36)}`,
    text: tool.fields.text || "As a user, I can…",
  };
  setSpec((prev) => ({ ...prev, stories: [...(prev.stories || []), story] }));
  toast.success("Added user story");
  break;
}
```

Then teach Claude about the tool by listing it in the prompt — `src/components/chat/ClaudeCodeChat.jsx` → the `prompt` template includes the available tools section. Append:

```
- add_story: text (the "As a user…" sentence)
```

The model will start emitting `[TOOL: add_story]` blocks when relevant.

## Adding a new node type

Two places:

1. `src/components/canvas/Canvas.jsx` → `NODE_TYPES`:

```js
const NODE_TYPES = {
  // ...existing...
  worker: { icon: "fn", color: "var(--violet)", defaultLabel: "Worker" },
};
```

2. `src/lib/export-engine.js` → `toMermaid`'s `system` branch (if the new type needs a custom Mermaid shape):

```js
if (n.type === "worker") shape = `[/${label(n.label)}/]`;
```

The Spec panel's type picker auto-includes any new entry — no extra wiring.

## Tests

Architect uses Vitest. Add unit tests for pure logic, component tests for UI:

```js
// tests/lib/your-thing.test.js
import { describe, it, expect } from "vitest";
import { yourFunction } from "../../src/lib/your-thing.js";

describe("yourFunction", () => {
  it("does the thing", () => {
    expect(yourFunction("input")).toBe("output");
  });
});
```

```jsx
// tests/components/YourComponent.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YourComponent } from "../../src/components/YourComponent.jsx";

describe("YourComponent", () => {
  it("renders", () => {
    render(<YourComponent />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
```

Run: `npm test` for one-shot, `npm run test:watch` for watch mode.

## Pull requests

If you've extended Architect with something other forks would also want:

1. Branch off `main`
2. Add tests
3. Update [CHANGELOG.md](../CHANGELOG.md) → `[Unreleased]`
4. Open a PR with the [PR template](../.github/PULL_REQUEST_TEMPLATE.md) filled in

PRs that add new optional dependencies need to justify the trade-off in the PR description. Architect's bundle is small on purpose.

## See also

- [ARCHITECTURE.md](../ARCHITECTURE.md) — full codebase map
- [Storage](storage.md) — what's persisted and how
- [CONTRIBUTING.md](../CONTRIBUTING.md) — branching, commits, review process
