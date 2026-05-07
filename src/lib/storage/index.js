import { LocalStorageAdapter } from "./local-storage.js";

export { StorageAdapter } from "./adapter.js";
export { LocalStorageAdapter } from "./local-storage.js";

/**
 * Default storage singleton. All stores in `src/store/` use this.
 *
 * Self-hosters who want sync (e.g. Supabase, IndexedDB) should swap this
 * out by replacing the export with their own adapter instance, or by
 * monkey-patching the methods at startup before stores are initialized.
 */
export const storage = new LocalStorageAdapter("architect");
