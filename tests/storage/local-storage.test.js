import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageAdapter } from "../../src/lib/storage/local-storage.js";

describe("LocalStorageAdapter", () => {
  let storage;
  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter("test");
  });

  it("round-trips an object", async () => {
    await storage.set("foo", { a: 1, b: [2, 3] });
    expect(await storage.get("foo")).toEqual({ a: 1, b: [2, 3] });
  });

  it("returns null for missing keys", async () => {
    expect(await storage.get("missing")).toBeNull();
  });

  it("namespaces keys under the configured prefix", async () => {
    await storage.set("x", 42);
    expect(localStorage.getItem("test:x")).toBe("42");
  });

  it("removes keys", async () => {
    await storage.set("x", 1);
    await storage.remove("x");
    expect(await storage.get("x")).toBeNull();
  });

  it("lists keys with a prefix", async () => {
    await storage.set("project:a", 1);
    await storage.set("project:b", 2);
    await storage.set("settings", 3);
    const keys = await storage.list("project:");
    expect(keys.sort()).toEqual(["project:a", "project:b"]);
  });

  it("excludes the internal version key from list()", async () => {
    await storage.set("foo", 1);
    const keys = await storage.list("");
    expect(keys).not.toContain("__version");
  });

  it("does not collide across namespaces", async () => {
    const other = new LocalStorageAdapter("other");
    await storage.set("x", "ours");
    await other.set("x", "theirs");
    expect(await storage.get("x")).toBe("ours");
    expect(await other.get("x")).toBe("theirs");
  });
});
