/**
 * Pluggable storage interface. Implementations handle key/value persistence.
 *
 * The default implementation is {@link LocalStorageAdapter}. Self-hosters who
 * want multi-device sync can drop in a custom adapter (Supabase, IndexedDB,
 * a remote HTTP API, etc.) by extending this class and replacing the singleton
 * exported from `./index.js`.
 *
 * All methods are async to keep the surface compatible with networked backends.
 */
export class StorageAdapter {
  /**
   * Read a value by key. Returns null if missing.
   * @param {string} _key
   * @returns {Promise<unknown|null>}
   */
  async get(_key) {
    throw new Error("StorageAdapter.get not implemented");
  }

  /**
   * Write a value at key. Returns true on success.
   * @param {string} _key
   * @param {unknown} _value
   * @returns {Promise<boolean>}
   */
  async set(_key, _value) {
    throw new Error("StorageAdapter.set not implemented");
  }

  /**
   * Remove the value at key.
   * @param {string} _key
   * @returns {Promise<boolean>}
   */
  async remove(_key) {
    throw new Error("StorageAdapter.remove not implemented");
  }

  /**
   * List keys whose names start with `prefix` (after the namespace). Useful for
   * iterating projects, e.g. `list("project:")`.
   * @param {string} [_prefix]
   * @returns {Promise<string[]>}
   */
  async list(_prefix = "") {
    throw new Error("StorageAdapter.list not implemented");
  }
}
