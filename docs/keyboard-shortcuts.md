# Keyboard shortcuts

All shortcuts use ⌘ (Mac) or Ctrl (Windows / Linux). Architect honors the platform default automatically.

## Global

| Shortcut        | Action                                                               |
| --------------- | -------------------------------------------------------------------- |
| `⌘K` / `Ctrl K` | Open / close the [command palette](#command-palette)                 |
| `⌘E` / `Ctrl E` | Open the Export modal                                                |
| `⌘S` / `Ctrl S` | Manual save flush + "Saved" toast (auto-save runs constantly anyway) |
| `⌘/` / `Ctrl /` | Jump to Dashboard                                                    |
| `Esc`           | Close the topmost modal / cancel current tool / clear selection      |

The command palette has its own shortcuts inside (see below).

## Editor — diagram canvas

| Shortcut                       | Action                       |
| ------------------------------ | ---------------------------- |
| `V`                            | Select tool                  |
| `H` (or `Space`)               | Pan tool                     |
| `N`                            | Add node tool                |
| `T`                            | Sticky note tool             |
| `E`                            | Connect tool (click → click) |
| `⌘ + scroll`                   | Zoom in / out                |
| `Alt + drag` (background)      | Pan                          |
| `Middle-click + drag`          | Pan                          |
| Drag (background, no modifier) | Marquee select               |

## Editor — selection

| Shortcut                     | Action                                      |
| ---------------------------- | ------------------------------------------- |
| `Click`                      | Select node                                 |
| `Shift / Cmd / Ctrl + Click` | Toggle in multi-selection                   |
| `⌘A` / `Ctrl A`              | Select all nodes + edges                    |
| `⌘D` / `Ctrl D`              | Duplicate selection (offset +24, +24)       |
| `⌘C` / `Ctrl C`              | Copy selection (nodes + edges between them) |
| `⌘V` / `Ctrl V`              | Paste at offset +32, +32 (IDs remapped)     |
| `⌫` / `Delete`               | Delete selection                            |
| `Esc`                        | Clear selection                             |

## Editor — node label

| Shortcut              | Action            |
| --------------------- | ----------------- |
| `Double-click` (node) | Edit label inline |
| `Enter` (in label)    | Commit label      |
| `Esc` (in label)      | Commit label      |

## Modals

| Shortcut                    | Action                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `Esc`                       | Close any modal                                                              |
| `Tab` / `Shift + Tab`       | Cycle focus inside the modal (focus is trapped — won't escape to background) |
| `Enter` (in confirm dialog) | Confirm                                                                      |
| `Enter` (in prompt dialog)  | Save value                                                                   |

## Command palette

`⌘K` opens it.

| Shortcut  | Action                                                   |
| --------- | -------------------------------------------------------- |
| `↑` / `↓` | Navigate items                                           |
| `Enter`   | Run highlighted command                                  |
| `Esc`     | Close                                                    |
| Type      | Fuzzy-search across actions, navigation, recent projects |

## Welcome / new-project wizard

| Shortcut              | Action                                             |
| --------------------- | -------------------------------------------------- |
| `Tab` / `Shift + Tab` | Cycle focus inside the wizard                      |
| `Esc`                 | Close (skips intro)                                |
| `Enter` (in input)    | Default action depends on step (Continue / Create) |

## Editor right-side panel

| Shortcut                            | Action             |
| ----------------------------------- | ------------------ |
| Click the panel chevron (top-right) | Collapse the panel |
| Click the right-edge "Spec" handle  | Expand the panel   |

The collapse state persists across sessions (`settings.specPanelCollapsed`).

## Notes

- All shortcuts respect text inputs — typing inside a `<input>` or `<textarea>` won't trigger global shortcuts (e.g. typing `n` inside a label won't switch tools).
- The canvas tools (`V H N T E`) only fire when the canvas has focus — clicking on a sidebar item first then pressing `n` won't drop a node.
- Reduced motion (`prefers-reduced-motion`) is honored — animations are 0.01ms when set.
