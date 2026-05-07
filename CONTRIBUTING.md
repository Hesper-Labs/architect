# Contributing to Architect

Thanks for your interest in improving Architect! This document covers everything you need to know to contribute.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Development setup

```bash
git clone https://github.com/Hesper-Labs/architect.git
cd architect
npm install
npm run dev
```

The app runs at `http://localhost:5173` with hot-module reload.

### Available scripts

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the Vite dev server              |
| `npm run build`   | Produce a production bundle in `dist/` |
| `npm run preview` | Serve the production build locally     |
| `npm run lint`    | ESLint check                           |
| `npm run format`  | Prettier format                        |
| `npm test`        | Run Vitest unit tests                  |

## Project structure

```
src/
  components/   Reusable UI components (chat, canvas, modals, tweaks…)
  views/        Top-level screens (Dashboard, Editor, Templates, Settings)
  lib/          Pure logic (export engine, validation, Claude API client, storage)
  store/        Zustand stores (projects, editor, settings)
  data/         Demo project + template presets + icon registry
  styles/       Global CSS
public/         Static assets (logo, favicon)
tests/          Vitest unit tests
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a deeper walkthrough.

## Branching

- `main` — always deployable
- Feature branches off `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`

## Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CRDT sync support
fix(canvas): clear edge selection on background click
docs: clarify BYOK setup
chore: bump dependencies
test(export-engine): cover Mermaid edge labels
```

This is not enforced by hooks, but PRs that follow the convention are easier to review and changelog.

## Pull requests

1. Fork the repo and create your branch from `main`.
2. Add tests for new behavior in `tests/` if practical.
3. Run `npm run lint` and `npm test` — both must pass.
4. Update [CHANGELOG.md](CHANGELOG.md) under `## [Unreleased]`.
5. Open a PR with a clear description of _what_ and _why_.

Small, focused PRs are easier to review and ship faster than mega-PRs. If your idea is large, open a Discussion first to align on scope.

## Reporting bugs

Open an issue using the **Bug report** template. Include browser + version, steps to reproduce, expected vs. actual behavior, and any console errors.

## Suggesting features

Open an issue using the **Feature request** template. Explain the problem you are trying to solve, why existing features fall short, and a rough sketch of the solution if you have one.

## Adding new exporters or storage adapters

Architect is designed for extension:

- **Exporters** live in `src/lib/export-engine.js`. Add a new function (e.g. `toToml`) and register it in the export modal.
- **Storage adapters** implement the interface in `src/lib/storage/adapter.js`. Drop a new adapter (e.g. `SupabaseAdapter`) into `src/lib/storage/` and wire it via Settings.

## Questions?

Open a Discussion on the repo, or comment on a related issue.
