import { StorageAdapter } from "./adapter.js";

const STORAGE_VERSION = 1;
const VERSION_KEY = "__version";

/**
 * Browser localStorage-backed adapter. Namespaces all keys to avoid collisions
 * with other apps on the same origin. Falls through to no-ops if localStorage
 * is unavailable (Safari private mode, embedded contexts).
 */
export class LocalStorageAdapter extends StorageAdapter {
  /**
   * @param {string} [namespace="architect"]
   */
  constructor(namespace = "architect") {
    super();
    this.ns = namespace;
    this._migrate();
  }

  _key(k) {
    return `${this.ns}:${k}`;
  }

  _migrate() {
    if (typeof localStorage === "undefined") return;
    try {
      const stored = parseInt(localStorage.getItem(this._key(VERSION_KEY)) ?? "0", 10);
      if (stored < STORAGE_VERSION) {
        // Reserved for future schema migrations between storage versions.
        localStorage.setItem(this._key(VERSION_KEY), String(STORAGE_VERSION));
      }
    } catch {
      // localStorage may be disabled; treat as ephemeral
    }
  }

  async get(key) {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(this._key(key));
      if (raw == null) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[storage] read failed for "${key}":`, err);
      return null;
    }
  }

  async set(key, value) {
    if (typeof localStorage === "undefined") return false;
    try {
      localStorage.setItem(this._key(key), JSON.stringify(value));
      return true;
    } catch (err) {
      if (err && (err.name === "QuotaExceededError" || err.code === 22)) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("architect:quota-exceeded", { detail: { key, error: err } }),
          );
        }
      } else {
        console.warn(`[storage] write failed for "${key}":`, err);
      }
      return false;
    }
  }

  async remove(key) {
    if (typeof localStorage === "undefined") return false;
    try {
      localStorage.removeItem(this._key(key));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix = "") {
    if (typeof localStorage === "undefined") return [];
    try {
      const fullPrefix = this._key(prefix);
      const versionKey = this._key(VERSION_KEY);
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(fullPrefix) && k !== versionKey) {
          out.push(k.slice(this.ns.length + 1));
        }
      }
      return out;
    } catch {
      return [];
    }
  }
}
