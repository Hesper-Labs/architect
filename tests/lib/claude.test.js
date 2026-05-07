import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { callClaude, isConfigured, ClaudeError, DEFAULT_MODEL } from "../../src/lib/claude.js";

describe("isConfigured", () => {
  it("returns true for sk-ant- keys", () => {
    expect(isConfigured("sk-ant-something")).toBe(true);
    expect(isConfigured("  sk-ant-with-leading-space  ")).toBe(true);
  });

  it("returns false for empty / wrong-prefix / non-string", () => {
    expect(isConfigured("")).toBe(false);
    expect(isConfigured(null)).toBe(false);
    expect(isConfigured(undefined)).toBe(false);
    expect(isConfigured("sk-not-anthropic")).toBe(false);
    expect(isConfigured(12345)).toBe(false);
  });
});

describe("callClaude", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws when no key is configured", async () => {
    await expect(callClaude({ apiKey: "", prompt: "hi" })).rejects.toThrow(/No Anthropic API key/);
  });

  it("throws on empty prompt", async () => {
    await expect(callClaude({ apiKey: "sk-ant-x", prompt: "  " })).rejects.toThrow(/Empty prompt/);
  });

  it("returns the assistant text on a 200 response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "hello world" }] }),
    });
    const out = await callClaude({ apiKey: "sk-ant-real", prompt: "hi" });
    expect(out).toBe("hello world");
    const fetchCall = globalThis.fetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.model).toBe(DEFAULT_MODEL);
    expect(body.messages[0]).toEqual({ role: "user", content: "hi" });
    expect(fetchCall[1].headers["x-api-key"]).toBe("sk-ant-real");
    expect(fetchCall[1].headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
  });

  it("forwards an optional system prompt", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: "ok" }] }),
    });
    await callClaude({ apiKey: "sk-ant-real", prompt: "hi", system: "you are precise" });
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.system).toBe("you are precise");
  });

  it("maps 401 to a friendly auth error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { type: "authentication_error", message: "bad" } }),
    });
    await expect(callClaude({ apiKey: "sk-ant-bad", prompt: "hi" })).rejects.toThrow(
      /Invalid API key/,
    );
  });

  it("maps 429 to a rate-limit error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { type: "rate_limit_error" } }),
    });
    await expect(callClaude({ apiKey: "sk-ant-x", prompt: "hi" })).rejects.toThrow(/Rate limited/);
  });

  it("wraps unknown errors as ClaudeError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "oops" } }),
    });
    await expect(callClaude({ apiKey: "sk-ant-x", prompt: "hi" })).rejects.toBeInstanceOf(
      ClaudeError,
    );
  });
});
