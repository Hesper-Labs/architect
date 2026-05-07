import { create } from "zustand";
import { storage } from "../lib/storage/index.js";

const SETTINGS_KEY = "settings";
const TWEAKS_KEY = "tweaks";
const API_KEY_KEY = "claude_api_key";
const GITHUB_PAT_KEY = "github_pat";

const DEFAULT_SETTINGS = {
  // Export defaults
  includeMermaid: true,
  includeAscii: false,
  // First-run experience
  hasSeenWelcome: false,
  // Editor UI state
  specPanelCollapsed: false,
};

const DEFAULT_TWEAKS = {
  theme: "warm-dark",
  accent: "#2680eb",
  density: "comfortable",
  showGrid: true,
};

/**
 * Global app settings — persists to localStorage. Distinct from per-project
 * editor state. The Anthropic API key lives at its own storage key for clarity.
 */
export const useSettingsStore = create((set, get) => ({
  ...DEFAULT_SETTINGS,
  tweaks: DEFAULT_TWEAKS,
  apiKey: "",
  githubPat: "",
  loaded: false,

  async load() {
    const stored = (await storage.get(SETTINGS_KEY)) ?? {};
    const tweaks = (await storage.get(TWEAKS_KEY)) ?? DEFAULT_TWEAKS;
    const apiKey = (await storage.get(API_KEY_KEY)) ?? "";
    const githubPat = (await storage.get(GITHUB_PAT_KEY)) ?? "";
    set({
      ...DEFAULT_SETTINGS,
      ...stored,
      tweaks: { ...DEFAULT_TWEAKS, ...tweaks },
      apiKey,
      githubPat,
      loaded: true,
    });
  },

  async update(patch) {
    const current = get();
    const next = { ...current, ...patch };
    set(next);
    const persistable = Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((k) => [k, next[k]]));
    await storage.set(SETTINGS_KEY, persistable);
  },

  async setTweak(keyOrEdits, val) {
    const edits =
      typeof keyOrEdits === "object" && keyOrEdits !== null ? keyOrEdits : { [keyOrEdits]: val };
    const tweaks = { ...get().tweaks, ...edits };
    set({ tweaks });
    await storage.set(TWEAKS_KEY, tweaks);
  },

  async setApiKey(key) {
    set({ apiKey: key });
    if (key) {
      await storage.set(API_KEY_KEY, key);
    } else {
      await storage.remove(API_KEY_KEY);
    }
  },

  async setGithubPat(pat) {
    set({ githubPat: pat });
    if (pat) {
      await storage.set(GITHUB_PAT_KEY, pat);
    } else {
      await storage.remove(GITHUB_PAT_KEY);
    }
  },
}));
