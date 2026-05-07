import { describe, it, expect, beforeEach } from "vitest";
import { useDialogStore, dialogs } from "../../src/store/dialogs.js";

describe("useDialogStore", () => {
  beforeEach(() => {
    useDialogStore.setState({ current: null });
  });

  it("confirm() sets current and resolves true on accept", async () => {
    const promise = dialogs.confirm({ title: "Test?", message: "ok" });
    expect(useDialogStore.getState().current).toBeDefined();
    expect(useDialogStore.getState().current.type).toBe("confirm");
    useDialogStore.getState().resolve(true);
    await expect(promise).resolves.toBe(true);
    expect(useDialogStore.getState().current).toBeNull();
  });

  it("confirm() resolves false on cancel", async () => {
    const promise = dialogs.confirm({ title: "Test?" });
    useDialogStore.getState().resolve(false);
    await expect(promise).resolves.toBe(false);
  });

  it("prompt() returns the entered string", async () => {
    const promise = dialogs.prompt({ title: "Name?", defaultValue: "x" });
    useDialogStore.getState().resolve("hello");
    await expect(promise).resolves.toBe("hello");
  });

  it("prompt() returns null on cancel", async () => {
    const promise = dialogs.prompt({ title: "Name?" });
    useDialogStore.getState().resolve(null);
    await expect(promise).resolves.toBe(null);
  });

  it("applies sensible defaults to confirm()", () => {
    dialogs.confirm({ title: "T" });
    const c = useDialogStore.getState().current;
    expect(c.confirmLabel).toBe("Confirm");
    expect(c.cancelLabel).toBe("Cancel");
    expect(c.danger).toBe(false);
  });

  it("applies sensible defaults to prompt()", () => {
    dialogs.prompt({ title: "T" });
    const c = useDialogStore.getState().current;
    expect(c.confirmLabel).toBe("Save");
    expect(c.defaultValue).toBe("");
  });
});
