/**
 * Anthropic API client (BYOK).
 *
 * Calls the Messages API directly from the browser. Each user supplies their
 * own API key via Settings; the key is stored only in `localStorage` and never
 * leaves the user's machine except in the Authorization header sent to
 * api.anthropic.com.
 *
 * The required `anthropic-dangerous-direct-browser-access` header is set so
 * the request bypasses Anthropic's default browser CORS block. This is safe
 * for self-hosted, BYOK deployments where the user is the key owner; it is
 * NOT safe for multi-tenant SaaS where keys live on a server.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export const MODELS = {
  "claude-opus-4-7": "Opus 4.7 — highest quality",
  "claude-sonnet-4-6": "Sonnet 4.6 — balanced",
  "claude-haiku-4-5-20251001": "Haiku 4.5 — fast & affordable",
};

export class ClaudeError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = "ClaudeError";
    this.status = status;
    this.code = code;
    if (cause) this.cause = cause;
  }
}

export function isConfigured(apiKey) {
  return typeof apiKey === "string" && apiKey.trim().startsWith("sk-ant-");
}

/**
 * Send a single user-message request and return the assistant's text reply.
 *
 * @param {object} options
 * @param {string} options.apiKey
 * @param {string} options.prompt - User message
 * @param {string} [options.system] - Optional system prompt
 * @param {string} [options.model]
 * @param {number} [options.maxTokens]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<string>}
 */
export async function callClaude({
  apiKey,
  prompt,
  system,
  model = DEFAULT_MODEL,
  maxTokens = 1024,
  signal,
}) {
  if (!isConfigured(apiKey)) {
    throw new ClaudeError(
      "No Anthropic API key configured. Add your key in Settings → Claude API.",
      { code: "NO_KEY" },
    );
  }
  if (!prompt || !prompt.trim()) {
    throw new ClaudeError("Empty prompt.", { code: "EMPTY_PROMPT" });
  }

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (system) body.system = system;

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ClaudeError(`Network error reaching api.anthropic.com: ${err.message}`, {
      cause: err,
    });
  }

  if (!response.ok) {
    let detail = "";
    let code;
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || JSON.stringify(errBody);
      code = errBody?.error?.type;
    } catch {
      detail = await response.text().catch(() => "");
    }
    if (response.status === 401) {
      throw new ClaudeError("Invalid API key. Double-check it in Settings.", {
        status: 401,
        code: "AUTH",
      });
    }
    if (response.status === 429) {
      throw new ClaudeError("Rate limited by Anthropic. Wait a moment and retry.", {
        status: 429,
        code: "RATE_LIMIT",
      });
    }
    throw new ClaudeError(`Claude API error (${response.status}): ${detail || "unknown"}`, {
      status: response.status,
      code,
    });
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new ClaudeError("Failed to parse response from Claude.", { cause: err });
  }

  const text = data?.content?.[0]?.text;
  if (typeof text !== "string") {
    throw new ClaudeError("Unexpected response shape from Claude API.");
  }
  return text;
}
