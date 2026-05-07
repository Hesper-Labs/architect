// Vitest setup file: runs once per test file before imports under test.
//
// jsdom's Storage API has occasional gaps (notably the `clear()` method is
// missing in some builds when accessed via the global). We install a tiny
// in-memory polyfill so storage tests behave consistently.

import { afterEach } from "vitest";

if (
  typeof globalThis.localStorage === "undefined" ||
  typeof globalThis.localStorage.clear !== "function"
) {
  const store = new Map();
  globalThis.localStorage = {
    get length() {
      return store.size;
    },
    key(i) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(String(k), String(v));
    },
    removeItem(k) {
      store.delete(String(k));
    },
    clear() {
      store.clear();
    },
  };
}

afterEach(() => {
  globalThis.localStorage.clear();
});
