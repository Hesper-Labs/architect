import { create } from "zustand";

let nextId = 0;

/**
 * Toast queue with stacking + levels. Renderer is `<ToastStack />` (mounted
 * once in App.jsx). Imperative API:
 *
 *   import { toast } from "src/store/toasts.js";
 *   toast.success("Saved");
 *   toast.error("Could not save", { duration: 5000 });
 *   const id = toast.info("Working…", { duration: 0 });  // sticky until dismissed
 *   toast.dismiss(id);
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  push(input) {
    const id = ++nextId;
    const t = {
      id,
      level: "info", // info | success | error | warning
      duration: 2200,
      ...(typeof input === "string" ? { message: input } : input),
    };
    set((s) => ({ toasts: [...s.toasts, t] }));
    if (t.duration > 0) {
      setTimeout(() => get().dismiss(id), t.duration);
    }
    return id;
  },

  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear() {
    set({ toasts: [] });
  },
}));

export const toast = {
  info: (message, opts) => useToastStore.getState().push({ ...opts, level: "info", message }),
  success: (message, opts) => useToastStore.getState().push({ ...opts, level: "success", message }),
  error: (message, opts) =>
    useToastStore.getState().push({ duration: 4000, ...opts, level: "error", message }),
  warning: (message, opts) =>
    useToastStore.getState().push({ duration: 3500, ...opts, level: "warning", message }),
  dismiss: (id) => useToastStore.getState().dismiss(id),
};
