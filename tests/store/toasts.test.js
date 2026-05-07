import { describe, it, expect, beforeEach, vi } from "vitest";
import { useToastStore, toast } from "../../src/store/toasts.js";

describe("useToastStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  it("push() adds a toast with default level info", () => {
    useToastStore.getState().push("Hello");
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Hello");
    expect(toasts[0].level).toBe("info");
  });

  it("auto-dismisses after duration", () => {
    useToastStore.getState().push({ message: "Bye", duration: 1000 });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1100);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("does not auto-dismiss when duration is 0 (sticky)", () => {
    useToastStore.getState().push({ message: "Sticky", duration: 0 });
    vi.advanceTimersByTime(10000);
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("dismiss() removes by id", () => {
    const id = useToastStore.getState().push({ message: "x", duration: 0 });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("clear() removes all", () => {
    toast.info("a");
    toast.success("b");
    toast.error("c");
    expect(useToastStore.getState().toasts).toHaveLength(3);
    useToastStore.getState().clear();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("convenience helpers tag levels correctly", () => {
    toast.success("ok");
    toast.error("nope");
    toast.warning("hmm");
    toast.info("just so");
    const levels = useToastStore.getState().toasts.map((t) => t.level);
    expect(levels).toEqual(["success", "error", "warning", "info"]);
  });
});
