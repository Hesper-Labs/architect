# Troubleshooting

Common problems and how to fix them.

## The page is blank / nothing renders

Open DevTools Console (F12). If you see a red error:

- **`Failed to fetch dynamically imported module`** — your dev server isn't running. Run `npm run dev` and refresh.
- **`Cannot read properties of null (reading '...')`** — likely a corrupted `localStorage` entry. In DevTools console: `localStorage.clear(); location.reload()`. You'll lose projects (export anything important first).
- **CSP violation** — a build is misconfigured. Open `index.html` and verify the `Content-Security-Policy` meta tag is present. Re-run `npm run build`.

## The welcome wizard doesn't show / appeared once and won't return

Welcome is a first-run-only flow by design. To re-trigger for testing:

```js
// DevTools console
const s = JSON.parse(localStorage.getItem("architect:settings") || "{}");
s.hasSeenWelcome = false;
localStorage.setItem("architect:settings", JSON.stringify(s));
location.reload();
```

## My edits aren't saving

Auto-save flushes 600 ms after the last edit. If `localStorage` is full, the save silently drops and a quota toast appears.

- Check `localStorage` size: DevTools → Application → Storage. If it's near 5 MB, you've hit Chrome's quota.
- Free space: Dashboard → delete or export old projects.
- Manual flush: `⌘S` (or `Ctrl S`) — useful for verifying the save path is healthy.

## Claude API isn't working

Settings → Claude API → check the connection status pill.

- **"Not configured"** — paste an `sk-ant-…` key and Save.
- **"Connected" but AI panels still show sample responses** — refresh the page. Some panels read the key once at mount.
- API responses 401: the key is invalid or revoked. Generate a new one at [console.anthropic.com](https://console.anthropic.com/).
- API responses 429: rate limit. Wait a minute, retry.
- Network errors: check that `api.anthropic.com` isn't blocked by your network / extension.

## Push to GitHub fails

See [github-push.md → Troubleshooting](github-push.md#troubleshooting) for the full table of common errors.

Quick sanity check:

- Can you `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user` and get back your username? If yes, the token works; the issue is permissions on the specific repo. If no, regenerate the token.

## "Open in Claude.ai" doesn't paste my spec

The handoff copies the spec to your clipboard before opening the new tab. If your browser blocked the clipboard write (e.g. focus issues), the new tab opens but nothing's in the clipboard.

Workaround: Click **Copy** in the Export modal first, then open Claude.ai manually and paste.

To debug: open the export modal, hit "Open in Claude.ai", then in the new tab try `⌘V`. If nothing appears, your clipboard didn't get written. Browser security around `navigator.clipboard.writeText` requires the page to have focus and a recent user interaction — Architect handles both, but some browser extensions block it.

## Dev server starts but localhost:5173 won't open

- Try `http://127.0.0.1:5173` (some hosts files block localhost)
- Check if another process is on 5173: `lsof -i :5173`. Kill it or change Vite's port: edit `vite.config.js` → `server.port`

## Tests fail locally but pass on CI

CI runs tests in clean Linux containers. Locally, you might have:

- A stale `node_modules` — `rm -rf node_modules && npm install`
- A stale Vitest cache — `rm -rf node_modules/.vitest`
- The wrong Node version — `node --version` should be ≥ 20. If you use nvm: `nvm use` (the `.nvmrc` pins 20).

## Light theme looks broken in some places

Architect's light theme overrides CSS variables but doesn't yet override every hand-tuned hex value in the 75 KB stylesheet. If you spot a specific element that looks wrong (e.g. white text on a white background):

1. Open an issue with a screenshot
2. Or fix it yourself — find the rule in `src/styles/main.css` and add a `[data-theme="light"]` override

## "Spec panel auto-opens but I don't want it to"

The panel auto-opens when you select a node so the customization UI is one click away. If you'd prefer it stayed collapsed, that's currently not configurable. Selecting a node and immediately collapsing again does work (the chevron at the panel's top-right).

## A specific keyboard shortcut isn't working

- Make sure the page (not a sidebar item / button) has focus — click somewhere on the canvas, then try again.
- Some shortcuts only fire in specific views: `N`, `T`, `E` only work in the editor; `⌘E` only does anything when there's a project loaded.
- macOS sometimes intercepts `⌘E` for global file emoji — disable that in System Preferences if needed.

## Still stuck?

Open an issue at [the project repo](https://github.com/Hesper-Labs/architect/issues) with:

- What you tried
- Browser + version (DevTools → Console → `navigator.userAgent`)
- Console errors (red text in the DevTools console)
- A reduced reproduction if possible

Bug reports follow the [bug template](../.github/ISSUE_TEMPLATE/bug_report.md).
