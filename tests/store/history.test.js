import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "../../src/store/history.js";

const baseContent = (n = 1) => ({
  spec: { overview: { name: "Test " + n } },
  nodes: Array.from({ length: n }, (_, i) => ({ id: `n${i}`, type: "fn", x: 0, y: 0, label: "x" })),
  edges: [],
  diagramType: "system",
});

describe("useHistoryStore", () => {
  beforeEach(() => {
    useHistoryStore.setState({ snapshots: {} });
  });

  it("pushes a snapshot and returns it", () => {
    const snap = useHistoryStore.getState().push("p1", baseContent(1));
    expect(snap).toBeDefined();
    expect(snap.id).toMatch(/^s_/);
    expect(useHistoryStore.getState().get("p1")).toHaveLength(1);
  });

  it("skips identical back-to-back snapshots", () => {
    const c = baseContent(1);
    useHistoryStore.getState().push("p1", c);
    const second = useHistoryStore.getState().push("p1", c);
    expect(second).toBeNull();
    expect(useHistoryStore.getState().get("p1")).toHaveLength(1);
  });

  it("pushes a new snapshot when content differs", () => {
    useHistoryStore.getState().push("p1", baseContent(1));
    useHistoryStore.getState().push("p1", baseContent(2));
    expect(useHistoryStore.getState().get("p1")).toHaveLength(2);
  });

  it("caps snapshots at 25 per project", () => {
    for (let i = 0; i < 30; i++) {
      useHistoryStore.getState().push("p1", baseContent(i + 1));
    }
    expect(useHistoryStore.getState().get("p1")).toHaveLength(25);
    // The earliest 5 should be evicted; latest one matches n=30
    const list = useHistoryStore.getState().get("p1");
    expect(list[list.length - 1].content.nodes).toHaveLength(30);
  });

  it("isolates snapshots per project", () => {
    useHistoryStore.getState().push("p1", baseContent(1));
    useHistoryStore.getState().push("p2", baseContent(1));
    useHistoryStore.getState().push("p2", baseContent(2));
    expect(useHistoryStore.getState().get("p1")).toHaveLength(1);
    expect(useHistoryStore.getState().get("p2")).toHaveLength(2);
  });

  it("clear(projectId) wipes a single project", () => {
    useHistoryStore.getState().push("p1", baseContent(1));
    useHistoryStore.getState().push("p2", baseContent(1));
    useHistoryStore.getState().clear("p1");
    expect(useHistoryStore.getState().get("p1")).toHaveLength(0);
    expect(useHistoryStore.getState().get("p2")).toHaveLength(1);
  });

  it("returns empty array for unknown projects", () => {
    expect(useHistoryStore.getState().get("missing")).toEqual([]);
    expect(useHistoryStore.getState().get(null)).toEqual([]);
  });
});
