import { describe, it, expect, beforeEach, vi } from "vitest";
import { debounce } from "../../src/utils/debounce.js";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("only fires once when called rapidly", () => {
    const spy = vi.fn();
    const d = debounce(spy, 100);
    d("a");
    d("b");
    d("c");
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("c");
  });

  it("fires again after the wait passes between calls", () => {
    const spy = vi.fn();
    const d = debounce(spy, 100);
    d(1);
    vi.advanceTimersByTime(150);
    d(2);
    vi.advanceTimersByTime(150);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 1);
    expect(spy).toHaveBeenNthCalledWith(2, 2);
  });

  it("cancel() stops a pending call", () => {
    const spy = vi.fn();
    const d = debounce(spy, 100);
    d("x");
    d.cancel();
    vi.advanceTimersByTime(200);
    expect(spy).not.toHaveBeenCalled();
  });

  it("flush() invokes immediately with last args", () => {
    const spy = vi.fn();
    const d = debounce(spy, 1000);
    d(42);
    d.flush();
    expect(spy).toHaveBeenCalledWith(42);
    // And does not double-fire after the original timer
    vi.advanceTimersByTime(2000);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("flush() is a no-op when nothing is pending", () => {
    const spy = vi.fn();
    const d = debounce(spy, 100);
    d.flush();
    expect(spy).not.toHaveBeenCalled();
  });
});
