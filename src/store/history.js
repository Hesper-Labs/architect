import { create } from "zustand";
import { storage } from "../lib/storage/index.js";

const MAX_SNAPSHOTS_PER_PROJECT = 25;
const SNAPSHOTS_KEY = "history:snapshots";

/**
 * Project history with localStorage persistence. Snapshots are captured
 * periodically by App.jsx (debounced ~8 s after the last edit) and survive
 * page reloads. Each project gets its own ring buffer capped at
 * {@link MAX_SNAPSHOTS_PER_PROJECT}.
 *
 * For permanent backups, users export projects as JSON via the Dashboard.
 */
export const useHistoryStore = create((set, get) => ({
  snapshots: {}, // { [projectId]: Snapshot[] }
  loaded: false,

  async load() {
    const stored = (await storage.get(SNAPSHOTS_KEY)) ?? {};
    set({ snapshots: stored, loaded: true });
  },

  async _persist() {
    await storage.set(SNAPSHOTS_KEY, get().snapshots);
  },

  push(projectId, content, label) {
    if (!projectId || !content) return null;
    const list = get().snapshots[projectId] ?? [];
    const last = list[list.length - 1];
    // Skip if content didn't change since last snapshot
    if (last) {
      try {
        if (JSON.stringify(last.content) === JSON.stringify(content)) return null;
      } catch {
        // fall through and snapshot anyway
      }
    }
    const snap = {
      id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      ts: Date.now(),
      label: label ?? "auto",
      content: structuredClone(content),
    };
    const next = [...list, snap].slice(-MAX_SNAPSHOTS_PER_PROJECT);
    set((s) => ({ snapshots: { ...s.snapshots, [projectId]: next } }));
    // Fire-and-forget persist; failures are logged by the adapter.
    get()._persist();
    return snap;
  },

  get(projectId) {
    return (projectId && get().snapshots[projectId]) || [];
  },

  clear(projectId) {
    set((s) => {
      const next = { ...s.snapshots };
      delete next[projectId];
      return { snapshots: next };
    });
    get()._persist();
  },

  clearAll() {
    set({ snapshots: {} });
    get()._persist();
  },
}));
