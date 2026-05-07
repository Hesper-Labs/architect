# Changelog

All notable changes to Architect will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (enterprise pass)

- **Real GitHub push** — replaces the previous setTimeout simulator with a full REST flow against `api.github.com` using the user's personal access token: resolves the default branch, creates a feature branch, commits `CLAUDE.md`, and (optionally) opens a pull request. PR / commit / file URLs surfaced on success.
- **GitHub PAT field in Settings** — fine-grained or classic tokens, stored in `localStorage` only, redacted by default. Help links to GitHub's fine-grained token page.
- **Spec-derived Handoff package** — Architecture Decision Records and Risk Register are now real, editable, and persisted in `spec.handoff`. Inline ADR cards (status, context, decision, consequences, alternatives, deciders) and a risk table (likelihood × impact severity, owner, mitigation, status) replace the hardcoded Pulse-only sample.
- **History snapshots persist to localStorage** — snapshots survive page reloads (capped at 25 per project).
- **Light theme** — full set of color-variable overrides under `[data-theme="light"]` plus theme picker restored to the Tweaks panel.
- **Demo project seeded with handoff examples** — first-run users see a real ADR + Risk pair in the Pulse demo, demonstrating the Handoff feature without manual setup.

### Removed (enterprise pass)

- **`ImportView` modal** — codebase reverse-engineering was a layout-only simulation. Real Architect-project JSON import lives on the Dashboard.
- **`ReviewDrawer`** — comment threads were demo-only with no persistence. Removed pending a real collaboration backend.
- **`ScreensView`** — wireframe / journey / transitions module was demo-only. Removed pending a real screens authoring flow.
- **Fake "Push to GitHub" simulator** — replaced with the real PAT-based flow above.
- **Settings: `tokenBudget` selector** — was unused.
- **Settings: `Auto-save` toggle** — autosave is always-on and not user-controlled.
- **Settings: `AI suggestions in editor` toggle** — was a no-op; AI panels read availability from the API key directly.
- **`DemoBanner` from removed modals** — banners only persist on the Import flow (kept for future codebase-reverse-engineering work).

### Added (earlier in this release)

- **First-run welcome wizard** — multi-step intro (hero / features / BYOK / ready) with logo halo, animated rings, and feature cards.
- **New project wizard** — three flows (blank / template / import) with architecture presets (monolith, microservices, serverless, mobile-first, AI agent) and auto-suggested name + description.
- **Command palette** (`⌘K` / `Ctrl K`) — fuzzy search over navigate, actions, and recent projects with keyboard navigation.
- **Real history snapshots** — debounced 8 s capture per project, capped at 25, with restore confirmation; pre-restore state is captured first so users can step back.
- **Toast notification stack** — info / success / error / warning levels, dismissable, auto-stacking, accessible (`role="region"`, `aria-live="polite"`).
- **Confirm and prompt dialogs** — replace native `window.confirm` / `window.prompt` with imperative `dialogs.confirm()` / `dialogs.prompt()` that return promises; styled, keyboard-friendly, and honor focus trap.
- **Sticky note tool** (`T`) — drop free-form notes anywhere on the canvas with one click.
- **Connect tool** (`E`) — click-then-click flow for creating edges, with on-canvas hints and Esc-to-cancel.
- **Tool hint banners** — clear top-of-canvas pills showing how the active tool works.
- **Spec panel auto-open on selection** — clicking a node automatically opens the panel and switches to the Diagram tab so the customization UI is always one click away.
- **Spec panel collapsible** — collapses to a compact right-edge handle that does not overlap with the canvas toolbar or info pill.
- **Node type picker** — all 16 node types selectable with color swatch + icon + label inline.
- **Logo optimization** — source 1024×1024 PNG (1.3 MB) shipped at 512×512 (36 KB) with separate `favicon-32`, `favicon-180` (Apple touch), and `og-image` (49 KB).
- **Storage quota warning** — `QuotaExceededError` is caught and surfaced as a toast prompting the user to export and prune projects.
- **Code splitting** — heavy modals (Preview, History, Import, Review, Design, Screens, Handoff, ClaudeCodeChat, WelcomeModal, NewProjectWizard) lazy-loaded via `React.lazy`; initial bundle dropped 130 KB.
- **Mobile responsive layout** — sidebar collapses into an overlay drawer with hamburger toggle; editor stacks vertically on small screens.
- **Accessibility pass** — `role="dialog"` + `aria-modal` + `aria-labelledby` on all primary modals, `useFocusTrap` hook, `prefers-reduced-motion` CSS rule.
- **Content Security Policy** — strict CSP meta tag whitelists only `api.anthropic.com` and Google Fonts.
- **DM Sans typography** — replaces Instrument Serif / Inter for a cleaner, more formal voice.
- **Pulse demo project** — first-run users get a deletable demo to explore; previously hardcoded as the only sample.
- **`StorageAdapter` interface** — pluggable persistence layer with `LocalStorageAdapter` as the default; self-hosters can drop in Supabase, IndexedDB, or a custom HTTP backend without touching the rest of the codebase.
- **Zustand stores** — `projects`, `settings`, `toasts`, `dialogs`, `history` for predictable state with localStorage hydration.
- **BYOK Claude integration** — `lib/claude.js` calls `api.anthropic.com` directly with the user's key from Settings; falls back to canned sample responses when no key is configured so the AI panels never look broken.
- **`ErrorBoundary`** — wraps `<App />` to catch render-time errors with a friendly recovery screen.
- **Keyboard shortcuts** — `⌘E` export · `⌘S` save · `⌘/` dashboard · `⌘K` command palette · `Esc` close modals.
- **Test suite** — 71 unit tests across 9 files covering export engine, validation, `LocalStorageAdapter`, Claude API client, debounce, projects/settings/toasts/dialogs/history stores.
- **Pre-commit hooks** — Husky + lint-staged auto-format and lint changed files before commit.
- **GitHub Actions CI** — lint, format check, test, build matrix on Node 20 + 22.
- **Open-source hygiene** — `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `ARCHITECTURE.md`, `FUNDING.yml`, issue / PR templates, Dependabot.
- **Demo banners** — modules that still show sample content (Review, Screens, Handoff, Import) carry an honest "layout preview" banner instead of pretending the data is real.

### Changed

- Migrated build pipeline from Babel-in-browser to Vite + ES modules.
- Reorganized `src/` into `components/` `views/` `lib/` `store/` `data/` `styles/` `utils/`.
- Replaced the `window.X` global namespace with proper `import` / `export` across all 24 source files.
- Sidebar redesigned: removed the "Local workspace" footer, replaced with a large semi-transparent logo watermark; brand mark in the header dropped in favor of clean wordmark.
- Topbar simplified: bell icon removed; `⌘K` pill is now an active button that opens the command palette.
- Tweaks panel: theme radio removed (warm-dark only for now), accent + grid retained.
- Settings: telemetry toggle removed (was a no-op); API key field gained show / hide / clear controls.
- Personal names in samples (Mehmet, Sarah, Ayşe, Berke) replaced with neutral placeholders (Alex, Jamie, Sam).
- `Architect.html` replaced with Vite-managed `index.html` carrying full Open Graph + Twitter card meta and a strict CSP.

### Removed

- CDN script tags for React, ReactDOM, and Babel — now bundled.
- Editor toolrail entries for Import (real import lives on the Dashboard) and Label (replaced by the Sticky note tool).
- Hardcoded `RECENT_PROJECTS` in the Sidebar — now driven by the projects store.

### Security

- Added Content-Security-Policy meta tag.
- Documented threat model and BYOK boundaries in `SECURITY.md`.
- AI-assistant artifacts (`.claude/`, `CLAUDE.md`, `.cursorrules`, `.aider*`, `.continue/`, `.windsurf/`, `.zed/`, `.codeium/`) added to `.gitignore` to prevent personal config from leaking into public forks.

## [0.4.0] - 2026-05-07

### Added

- Initial alpha: visual frontend complete; spec editor, canvas, templates, screens, handoff, history, import, settings UI.
- Mermaid / Markdown / JSON / XML / ASCII export engine.
- Validation engine with score.
- Tweaks panel for live theming.
