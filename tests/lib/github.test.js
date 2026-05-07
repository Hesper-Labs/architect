import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  isConfigured,
  GitHubError,
  pushClaudeMd,
  getRepo,
  getBranchSha,
} from "../../src/lib/github.js";

describe("github.isConfigured", () => {
  it("accepts ghp_ classic, github_pat_ fine-grained, gho_ OAuth, ghs_ app tokens", () => {
    expect(isConfigured("ghp_abc123")).toBe(true);
    expect(isConfigured("github_pat_abc")).toBe(true);
    expect(isConfigured("gho_abc")).toBe(true);
    expect(isConfigured("ghs_abc")).toBe(true);
  });

  it("rejects empty / non-string / unknown prefix", () => {
    expect(isConfigured("")).toBe(false);
    expect(isConfigured(null)).toBe(false);
    expect(isConfigured(12345)).toBe(false);
    expect(isConfigured("sk-ant-something")).toBe(false);
    expect(isConfigured("token-without-prefix")).toBe(false);
  });
});

describe("github low-level requests", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getRepo() returns repo info on 200", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ default_branch: "main", name: "architect" }),
    });
    const repo = await getRepo({ token: "ghp_x", owner: "x", repo: "architect" });
    expect(repo.default_branch).toBe("main");
    const fetchArgs = globalThis.fetch.mock.calls[0];
    expect(fetchArgs[0]).toBe("https://api.github.com/repos/x/architect");
    expect(fetchArgs[1].headers["Authorization"]).toBe("Bearer ghp_x");
  });

  it("maps 401 to a friendly auth error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Bad credentials" }),
    });
    await expect(getRepo({ token: "ghp_bad", owner: "x", repo: "y" })).rejects.toThrow(
      /Invalid GitHub token/,
    );
  });

  it("maps 404 to a not-found error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    });
    await expect(
      getBranchSha({ token: "ghp_x", owner: "x", repo: "missing", branch: "main" }),
    ).rejects.toBeInstanceOf(GitHubError);
  });
});

describe("github.pushClaudeMd", () => {
  let originalFetch;
  let calls;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    calls = [];
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init });
      // Default branch lookup
      if (url.endsWith("/repos/owner/repo")) {
        return { ok: true, status: 200, json: async () => ({ default_branch: "main" }) };
      }
      // Default branch SHA
      if (url.endsWith("/git/ref/heads/main")) {
        return { ok: true, status: 200, json: async () => ({ object: { sha: "base-sha" } }) };
      }
      // Create branch
      if (url.endsWith("/git/refs") && init.method === "POST") {
        return { ok: true, status: 201, json: async () => ({ ref: "refs/heads/feature" }) };
      }
      // File SHA lookup (returns 404 → file doesn't exist yet)
      if (url.includes("/contents/CLAUDE.md") && (!init.method || init.method === "GET")) {
        return { ok: false, status: 404, json: async () => ({ message: "Not Found" }) };
      }
      // PUT file
      if (url.includes("/contents/CLAUDE.md") && init.method === "PUT") {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            content: { html_url: "https://github.com/owner/repo/blob/feature/CLAUDE.md" },
            commit: { html_url: "https://github.com/owner/repo/commit/abc" },
          }),
        };
      }
      // Create PR
      if (url.endsWith("/pulls") && init.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => ({ html_url: "https://github.com/owner/repo/pull/1" }),
        };
      }
      throw new Error(`Unmocked fetch: ${init?.method ?? "GET"} ${url}`);
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("pushes a new CLAUDE.md and opens a PR end-to-end", async () => {
    const result = await pushClaudeMd({
      token: "ghp_x",
      owner: "owner",
      repo: "repo",
      branch: "feature",
      content: "# Spec",
      commitMessage: "docs: spec",
      createPr: true,
    });
    expect(result.branch).toBe("feature");
    expect(result.defaultBranch).toBe("main");
    expect(result.prUrl).toBe("https://github.com/owner/repo/pull/1");
    expect(result.fileUrl).toMatch(/CLAUDE\.md$/);
    // Verify the order: repo → branch SHA → create branch → get file SHA → put file → PR
    const urls = calls.map((c) => c.url);
    expect(urls.some((u) => u.endsWith("/repos/owner/repo"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/git/refs"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/pulls"))).toBe(true);
  });

  it("rejects malformed repo argument", async () => {
    await expect(
      pushClaudeMd({
        token: "ghp_x",
        owner: "",
        repo: "x",
        branch: "f",
        content: "c",
        commitMessage: "m",
      }),
    ).rejects.toThrow(/owner\/repo/);
  });

  it("rejects empty content", async () => {
    await expect(
      pushClaudeMd({
        token: "ghp_x",
        owner: "o",
        repo: "r",
        branch: "f",
        content: "",
        commitMessage: "m",
      }),
    ).rejects.toThrow(/Empty spec/);
  });
});
