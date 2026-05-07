import { useState, useRef, useEffect } from "react";
import { Icon } from "../data/icons.jsx";
import { callClaude, isConfigured } from "../lib/claude.js";
import { useSettingsStore } from "../store/settings.js";

// AI assistant — calls Claude via the BYOK service (lib/claude.js)
function AIAssistant({ spec, nodes, edges, diagramType, onPatchSpec }) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const configured = isConfigured(apiKey);
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: configured
        ? "Hi! I can analyze your spec, find gaps, and suggest improvements. Try one of the quick actions below or ask me anything."
        : "AI is offline — add your Anthropic API key in Settings to enable live responses. Quick actions still work with built-in heuristics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const specSummary = () => {
    return `Project: ${spec.overview.name}
Description: ${spec.overview.description}
Goals: ${spec.overview.goals}
Stack: FE=${spec.stack.frontend.join(",")}; BE=${spec.stack.backend.join(",")}; Data=${spec.stack.data.join(",")}
Features (${spec.features.length}): ${spec.features.map((f) => `[${f.priority}] ${f.title}`).join("; ")}
Models (${spec.models.length}): ${spec.models.map((m) => `${m.name}(${m.fields})`).join("; ")}
Endpoints (${spec.endpoints.length}): ${spec.endpoints.map((e) => `${e.method} ${e.path}`).join("; ")}
Stories: ${spec.stories.map((s) => s.text).join(" | ")}
Diagram type: ${diagramType}, ${nodes.length} nodes, ${edges.length} edges.`;
  };

  const ask = async (prompt, label) => {
    const display = label || prompt;
    const userMsg = { role: "user", content: display };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    const fullPrompt = `You are a senior software architect reviewing a project spec for AI agent handoff (CLAUDE.md style). Be concise, concrete, and actionable. Use markdown bullets.

CURRENT SPEC:
${specSummary()}

USER REQUEST: ${prompt}

Respond in <= 250 words. No fluff.`;

    try {
      let response;
      if (configured) {
        response = await callClaude({ apiKey, prompt: fullPrompt, maxTokens: 800 });
      } else {
        await new Promise((r) => setTimeout(r, 600));
        response = `**Quick analysis (offline):**\n\n- Description is ${
          spec.overview.description.length < 80 ? "too short — expand to 2-3 sentences" : "solid"
        }.\n- ${spec.features.filter((f) => f.priority === "P0").length} P0 features defined.\n- API↔Model coverage looks reasonable.\n- Consider adding rate-limiting and observability sections.\n\n_Add your Anthropic API key in Settings → Claude API to enable real responses._`;
      }
      setMessages((m) => [...m, { role: "assistant", content: response }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setBusy(false);
  };

  const send = () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    ask(text);
  };

  const QUICK = [
    {
      label: "Audit my spec",
      prompt:
        "Analyze the spec for gaps, inconsistencies, and missing context an AI agent would need. List the top 5 issues with priority.",
    },
    {
      label: "Suggest features",
      prompt:
        "Suggest 3-5 features that are likely missing given the project description. Format as: priority · title · note.",
    },
    {
      label: "Review the API",
      prompt:
        "Review the API endpoint design. Flag inconsistencies, RESTful violations, missing CRUD, and suggest additions.",
    },
    {
      label: "Edge cases",
      prompt: "List the top 8 edge cases an AI agent must handle when implementing this spec.",
    },
    {
      label: "Tighten description",
      prompt:
        "Rewrite the project description in 2 sentences: clear, specific, and useful for AI context.",
    },
    {
      label: "Threat model",
      prompt:
        "Quick threat model: top 5 security concerns for this architecture and concrete mitigations.",
    },
  ];

  // Markdown-ish renderer (super light)
  const render = (text) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**"))
        return (
          <div key={i} style={{ fontWeight: 600, marginTop: 6 }}>
            {line.slice(2, -2)}
          </div>
        );
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={i} style={{ paddingLeft: 14, position: "relative", margin: "2px 0" }}>
            <span style={{ position: "absolute", left: 4, color: "var(--accent-ink)" }}>•</span>
            {inlineFmt(line.slice(2))}
          </div>
        );
      }
      if (/^\d+\./.test(line))
        return (
          <div key={i} style={{ paddingLeft: 4, margin: "2px 0" }}>
            {inlineFmt(line)}
          </div>
        );
      if (line.startsWith("### ") || line.startsWith("## "))
        return (
          <div key={i} style={{ fontWeight: 600, marginTop: 8, fontSize: 13 }}>
            {line.replace(/^#+ /, "")}
          </div>
        );
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
      return (
        <div key={i} style={{ margin: "2px 0" }}>
          {inlineFmt(line)}
        </div>
      );
    });
  };
  const inlineFmt = (s) => {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
    return parts.map((p, j) => {
      if (p.startsWith("**")) return <strong key={j}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("`"))
        return (
          <code
            key={j}
            className="mono"
            style={{
              background: "var(--bg-2)",
              padding: "1px 5px",
              borderRadius: 3,
              fontSize: 11.5,
            }}
          >
            {p.slice(1, -1)}
          </code>
        );
      if (p.startsWith("_"))
        return (
          <em key={j} style={{ color: "var(--ink-3)" }}>
            {p.slice(1, -1)}
          </em>
        );
      return <span key={j}>{p}</span>;
    });
  };

  return (
    <div className="ai-assistant">
      <div className="ai-quick">
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.08,
            color: "var(--ink-3)",
            marginBottom: 8,
          }}
        >
          Quick actions
        </div>
        <div className="ai-quick-grid">
          {QUICK.map((q) => (
            <button
              key={q.label}
              className="ai-quick-btn"
              onClick={() => ask(q.prompt, q.label)}
              disabled={busy}
            >
              <Icon name="sparkles" size={11} />
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ai-thread" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={"ai-msg ai-msg-" + m.role}>
            {m.role === "assistant" && (
              <div className="ai-avatar">
                <Icon name="sparkles" size={11} />
              </div>
            )}
            <div className="ai-bubble">{render(m.content)}</div>
          </div>
        ))}
        {busy && (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-avatar">
              <Icon name="sparkles" size={11} />
            </div>
            <div className="ai-bubble ai-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="ai-input-row">
        <input
          className="field-input"
          placeholder="Ask about your spec…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={busy}
        />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={busy || !input.trim()}>
          <Icon name="arrow" size={11} />
        </button>
      </div>
    </div>
  );
}

export { AIAssistant };
