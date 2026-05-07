import { create } from "zustand";

/**
 * Imperative confirm() / prompt() replacements for the native browser dialogs.
 * Renderer is `<ConfirmDialog />` (mounted once in App.jsx).
 *
 * Usage:
 *
 *   import { dialogs } from "src/store/dialogs.js";
 *
 *   const ok = await dialogs.confirm({
 *     title: "Delete project?",
 *     message: "This can't be undone.",
 *     confirmLabel: "Delete",
 *     danger: true,
 *   });
 *   if (ok) { ... }
 *
 *   const next = await dialogs.prompt({
 *     title: "Rename project",
 *     defaultValue: "Untitled",
 *     placeholder: "New name",
 *   });
 *   if (next) { ... }
 */
export const useDialogStore = create((set, get) => ({
  current: null,

  open(input) {
    return new Promise((resolve) => {
      set({ current: { ...input, resolve } });
    });
  },

  resolve(value) {
    const { current } = get();
    if (current?.resolve) current.resolve(value);
    set({ current: null });
  },
}));

export const dialogs = {
  confirm(opts) {
    return useDialogStore.getState().open({
      type: "confirm",
      title: "Are you sure?",
      message: "",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      danger: false,
      ...opts,
    });
  },
  prompt(opts) {
    return useDialogStore.getState().open({
      type: "prompt",
      title: "Enter a value",
      message: "",
      confirmLabel: "Save",
      cancelLabel: "Cancel",
      defaultValue: "",
      placeholder: "",
      ...opts,
    });
  },
};
