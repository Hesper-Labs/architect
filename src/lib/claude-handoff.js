/**
 * Helpers for sending an Architect spec to Claude when the user does NOT have
 * an Anthropic API key — i.e. they're a claude.ai (web) or Claude Code (CLI)
 * user who only has a chat / subscription account.
 *
 * The browser can't talk to Claude Code CLI directly, so these helpers prepare
 * the spec on the user's behalf:
 *
 *  - openInClaudeAi(): copies the spec to clipboard + opens claude.ai/new in
 *    a new tab. The user pastes (⌘V) once the new chat opens.
 *  - downloadAsClaudeMd(): downloads the spec as `CLAUDE.md` so the user can
 *    drop it into their project root and run `claude` from a terminal — Claude
 *    Code reads CLAUDE.md as project context automatically.
 *  - claudeCodeSnippet(): returns a shell snippet the user can paste into a
 *    terminal: it writes CLAUDE.md and runs `claude`.
 */

const CLAUDE_AI_NEW_CHAT = "https://claude.ai/new";

/**
 * Copy `text` to the clipboard. Resolves true on success.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy approach
    }
  }
  // Legacy fallback — works inside browser contexts that don't have
  // navigator.clipboard (older Safari, sandboxed iframes).
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy the markdown spec to clipboard and open a new claude.ai chat in a fresh
 * tab. The user pastes the spec once the chat loads.
 * @param {string} markdown
 * @returns {Promise<boolean>} true if clipboard write succeeded
 */
export async function openInClaudeAi(markdown) {
  const ok = await copyToClipboard(markdown);
  if (typeof window !== "undefined") {
    window.open(CLAUDE_AI_NEW_CHAT, "_blank", "noopener,noreferrer");
  }
  return ok;
}

/**
 * Trigger a `CLAUDE.md` download so the user can drop the file into their
 * project root and run `claude` from a terminal.
 * @param {string} markdown
 */
export function downloadAsClaudeMd(markdown) {
  if (typeof window === "undefined") return;
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CLAUDE.md";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Build a shell snippet that, when pasted into a terminal, writes the spec to
 * CLAUDE.md in the current directory and starts a Claude Code session.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function claudeCodeSnippet(markdown) {
  // Use a heredoc with a quoted delimiter so $ and \ inside the markdown stay
  // literal. The delimiter is chosen to be unlikely to appear in any spec.
  const delimiter = "ARCHITECT_SPEC_EOF";
  return [`cat > CLAUDE.md <<'${delimiter}'`, markdown, delimiter, `claude`].join("\n");
}

/**
 * Copy the Claude Code CLI snippet to clipboard.
 * @param {string} markdown
 * @returns {Promise<boolean>}
 */
export async function copyClaudeCodeSnippet(markdown) {
  return copyToClipboard(claudeCodeSnippet(markdown));
}
