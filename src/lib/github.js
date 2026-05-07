/**
 * GitHub REST client (BYOT — bring your own token).
 *
 * Uses a personal access token (classic or fine-grained) supplied by the user
 * in Settings. The token is stored only in `localStorage` and only sent to
 * `api.github.com`. No server proxy.
 *
 * Token scopes required:
 *   - Classic PAT: `repo`
 *   - Fine-grained PAT: `Contents: read+write` (and `Pull requests: read+write`
 *     if you want PRs created automatically)
 */

const API_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";

export class GitHubError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.code = code;
    if (cause) this.cause = cause;
  }
}

export function isConfigured(token) {
  if (typeof token !== "string") return false;
  const t = token.trim();
  return (
    t.startsWith("ghp_") || // classic PAT
    t.startsWith("github_pat_") || // fine-grained PAT
    t.startsWith("gho_") || // OAuth token
    t.startsWith("ghs_") // app installation
  );
}

async function request({ token, path, method = "GET", body, signal }) {
  if (!token) {
    throw new GitHubError("No GitHub token configured.", { code: "NO_TOKEN" });
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new GitHubError(`Network error reaching api.github.com: ${err.message}`, { cause: err });
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody?.message || JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 401) {
      throw new GitHubError("Invalid GitHub token. Check Settings → GitHub.", { status: 401 });
    }
    if (res.status === 403) {
      throw new GitHubError(
        `GitHub denied access: ${detail || "rate limit or insufficient scope"}`,
        {
          status: 403,
        },
      );
    }
    if (res.status === 404) {
      throw new GitHubError(`Not found: ${detail || "repo or path missing"}`, { status: 404 });
    }
    throw new GitHubError(`GitHub API error (${res.status}): ${detail || "unknown"}`, {
      status: res.status,
    });
  }
  if (res.status === 204) return null;
  return await res.json();
}

// ============== Low-level ==============
export async function getViewer({ token, signal }) {
  return request({ token, path: "/user", signal });
}

export async function getRepo({ token, owner, repo, signal }) {
  return request({ token, path: `/repos/${owner}/${repo}`, signal });
}

export async function getBranchSha({ token, owner, repo, branch, signal }) {
  const data = await request({
    token,
    path: `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    signal,
  });
  return data?.object?.sha;
}

export async function createBranch({ token, owner, repo, branch, sha, signal }) {
  return request({
    token,
    path: `/repos/${owner}/${repo}/git/refs`,
    method: "POST",
    body: { ref: `refs/heads/${branch}`, sha },
    signal,
  });
}

export async function getFileSha({ token, owner, repo, path, ref, signal }) {
  try {
    const data = await request({
      token,
      path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`,
      signal,
    });
    return data?.sha;
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) return null;
    throw err;
  }
}

export async function putFile({ token, owner, repo, path, content, message, branch, sha, signal }) {
  // GitHub Contents API requires base64-encoded content. `btoa` only handles
  // Latin-1, so we round-trip through encode/decode to survive Unicode.
  const utf8 = unescape(encodeURIComponent(content));
  const encoded = btoa(utf8);
  return request({
    token,
    path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    method: "PUT",
    body: { message, content: encoded, branch, sha: sha || undefined },
    signal,
  });
}

export async function createPullRequest({ token, owner, repo, title, body, head, base, signal }) {
  return request({
    token,
    path: `/repos/${owner}/${repo}/pulls`,
    method: "POST",
    body: { title, body, head, base },
    signal,
  });
}

// ============== High-level: push CLAUDE.md ==============
/**
 * Push the spec markdown as `CLAUDE.md` to a new branch and optionally open
 * a pull request against the repo's default branch.
 *
 * @param {object} options
 * @param {string} options.token
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {string} options.branch              new branch name to push to
 * @param {string} options.content             markdown to write to CLAUDE.md
 * @param {string} options.commitMessage
 * @param {boolean} [options.createPr]
 * @param {string}  [options.prTitle]
 * @param {string}  [options.prBody]
 * @param {string}  [options.path="CLAUDE.md"] override target path
 * @returns {Promise<{ branch: string, defaultBranch: string, prUrl: string|null, fileUrl: string|null, commitUrl: string|null }>}
 */
export async function pushClaudeMd({
  token,
  owner,
  repo,
  branch,
  content,
  commitMessage,
  createPr = true,
  prTitle,
  prBody,
  path = "CLAUDE.md",
}) {
  if (!owner || !repo) throw new GitHubError("Repository must be in `owner/repo` format.");
  if (!branch) throw new GitHubError("A branch name is required.");
  if (!content) throw new GitHubError("Empty spec — nothing to push.");

  // 1. Repo info → default branch
  const repoInfo = await getRepo({ token, owner, repo });
  const defaultBranch = repoInfo.default_branch;

  // 2. SHA of default branch tip
  const baseSha = await getBranchSha({ token, owner, repo, branch: defaultBranch });
  if (!baseSha) {
    throw new GitHubError(`Couldn't resolve default branch (${defaultBranch}) of ${owner}/${repo}`);
  }

  // 3. Create branch from base (idempotent — ignore "already exists")
  try {
    await createBranch({ token, owner, repo, branch, sha: baseSha });
  } catch (err) {
    if (!(err instanceof GitHubError) || err.status !== 422) throw err;
    // 422 → ref already exists, continue
  }

  // 4. Existing file SHA on this branch (if any) — needed to update vs create
  const existingSha = await getFileSha({ token, owner, repo, path, ref: branch });

  // 5. Write the file
  const result = await putFile({
    token,
    owner,
    repo,
    path,
    content,
    message: commitMessage,
    branch,
    sha: existingSha,
  });

  // 6. Optionally open a PR (failures are non-fatal — file is already pushed)
  let prUrl = null;
  if (createPr) {
    try {
      const pr = await createPullRequest({
        token,
        owner,
        repo,
        title: prTitle ?? commitMessage,
        body: prBody ?? "Spec updated from Architect.",
        head: branch,
        base: defaultBranch,
      });
      prUrl = pr.html_url;
    } catch (err) {
      // PR creation failed but file was pushed. Partial success. Caller can
      // surface this differently if they care.
      console.warn("[github] PR creation failed:", err);
    }
  }

  return {
    branch,
    defaultBranch,
    prUrl,
    fileUrl: result?.content?.html_url ?? null,
    commitUrl: result?.commit?.html_url ?? null,
  };
}
