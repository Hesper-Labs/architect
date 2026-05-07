import { useState, useRef, useEffect } from "react";
import { Icon } from "../../data/icons.jsx";
import { callClaude, isConfigured } from "../../lib/claude.js";
import { useSettingsStore } from "../../store/settings.js";

// Claude Code — full-context editor chat. Knows the entire project state.
// Can suggest spec edits, generate components, draft architecture, run tools.

const TOOL_DEFS = [
  { id: "edit_spec", icon: "edit", label: "Edit spec", hint: "Modify project spec sections" },
  { id: "add_node", icon: "box", label: "Add canvas node", hint: "Place a new architecture node" },
  {
    id: "add_endpoint",
    icon: "api",
    label: "Add API endpoint",
    hint: "Generate REST/GraphQL endpoint",
  },
  { id: "add_model", icon: "er", label: "Add data model", hint: "Define a new entity" },
  { id: "design_token", icon: "sparkles", label: "Design tokens", hint: "Color, type, spacing" },
  {
    id: "component_spec",
    icon: "tree",
    label: "Component spec",
    hint: "Generate UI component definition",
  },
  { id: "validate", icon: "check", label: "Validate spec", hint: "Find gaps and inconsistencies" },
];

const STARTERS = [
  {
    icon: "sparkles",
    title: "Design my architecture",
    prompt:
      "Look at my project description and goals, then design a clean system architecture. Add the necessary nodes (clients, services, databases, queues) to my canvas, connect them, and explain your reasoning.",
  },
  {
    icon: "tree",
    title: "Generate component library",
    prompt:
      "Based on my features and stack, propose a component inventory I'll need. List components with variants, states, and a rough props sketch. Format as a table.",
  },
  {
    icon: "edit",
    title: "Audit & improve spec",
    prompt:
      "Audit my entire spec end-to-end. Find gaps, inconsistencies, missing context. Suggest specific edits I should make, ranked by impact.",
  },
  {
    icon: "er",
    title: "Design data schema",
    prompt:
      "Design the complete relational schema for this project. Include indexes, foreign keys, and constraints. Output as a markdown table per table.",
  },
  {
    icon: "api",
    title: "Design API surface",
    prompt:
      "Design the full RESTful API surface. List endpoints with method, path, auth, request/response shape. Group by resource.",
  },
  {
    icon: "flow",
    title: "Map user journey",
    prompt:
      "Map the primary user journey for the most important user story. Output as a step-by-step flow with screens, decisions, and edge cases.",
  },
];

function ClaudeCodeChat({ open, onClose, ctx, applyEdit }) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const configured = isConfigured(apiKey);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: configured
        ? `Hi — I'm Claude Code, your AI co-architect. I have full context of your **${ctx?.spec?.overview?.name || "project"}** project: spec, canvas (${ctx?.nodes?.length || 0} nodes, ${ctx?.edges?.length || 0} edges), diagrams, history.\n\nI can edit the spec, add nodes to your canvas, generate components, design tokens, ADRs, and more. What would you like to work on?`
        : `Hi — I'm Claude Code. I'm running in **sample mode** because no Anthropic API key is configured.\n\nAdd your key under Settings → Claude API to get real responses. In the meantime, the starter prompts below show what I can do.`,
      tools: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [enabledTools, setEnabledTools] = useState(new Set(["edit_spec", "add_node", "validate"]));
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const buildContext = () => {
    if (!ctx?.spec) return "No project loaded.";
    const s = ctx.spec;
    return `## PROJECT CONTEXT
Name: ${s.overview.name}
Description: ${s.overview.description}
Goals: ${s.overview.goals}

Stack:
- Frontend: ${s.stack.frontend.join(", ")}
- Backend: ${s.stack.backend.join(", ")}
- Data: ${s.stack.data.join(", ")}
- Infra: ${s.stack.infra.join(", ")}

Features (${s.features.length}):
${s.features.map((f) => `- [${f.priority}] ${f.title}: ${f.note}`).join("\n")}

Models (${s.models.length}):
${s.models.map((m) => `- ${m.name}: ${m.fields}`).join("\n")}

Endpoints (${s.endpoints.length}):
${s.endpoints.map((e) => `- ${e.method} ${e.path}`).join("\n")}

Stories:
${s.stories.map((s) => `- ${s.text}`).join("\n")}

Constraints:
- Must: ${s.constraints.musts.join(", ")}
- Non-goals: ${s.constraints.nonGoals.join(", ")}

Architecture canvas (${ctx.diagramType}):
${ctx.nodes.map((n) => `- [${n.type}] ${n.label}${n.sub ? ": " + n.sub : ""}`).join("\n")}

Connections:
${ctx.edges
  .map((e) => {
    const f = ctx.nodes.find((n) => n.id === e.from);
    const t = ctx.nodes.find((n) => n.id === e.to);
    return f && t ? `- ${f.label} → ${t.label}${e.label ? " (" + e.label + ")" : ""}` : "";
  })
  .filter(Boolean)
  .join("\n")}

Available tools: ${[...enabledTools].join(", ")}`;
  };

  const ask = async (text) => {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);

    const prompt = `You are Claude Code, an AI co-architect inside Architect (a spec-builder for AI agent handoffs). You have FULL READ ACCESS to the user's project state and can suggest TOOL_CALLs to modify it.

${buildContext()}

USER REQUEST: ${text}

Respond as a senior staff engineer + designer. Be concrete, specific, and use markdown. If a change to the project would help, format it as a TOOL block at the end like:

[TOOL: tool_name]
field: value
field: value
[/TOOL]

Available tools and their fields:
- edit_spec: section (overview|stack|features|models|endpoints|conventions|deploy), patch (JSON-like text)
- add_node: type (user|api|fn|db|queue|cloud), label, sub
- add_endpoint: method, path, note
- add_model: name, fields
- design_token: category (color|type|spacing|radius), name, value
- component_spec: name, props, states, variants

Keep response under 350 words. Use crisp bullets. Show your reasoning briefly, then if relevant include 1-3 TOOL blocks the user can apply with one click.`;

    try {
      let response;
      if (configured) {
        response = await callClaude({ apiKey, prompt, maxTokens: 1200 });
      } else {
        await new Promise((r) => setTimeout(r, 900));
        response = sampleResponse(text, ctx);
      }

      // Parse tool calls
      const tools = [];
      const cleanText = response
        .replace(/\[TOOL:\s*(\w+)\]([\s\S]*?)\[\/TOOL\]/g, (m, name, body) => {
          const fields = {};
          body
            .trim()
            .split("\n")
            .forEach((line) => {
              const idx = line.indexOf(":");
              if (idx > 0) {
                fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
              }
            });
          tools.push({ name, fields });
          return "";
        })
        .trim();

      setMessages((m) => [...m, { role: "assistant", content: cleanText, tools }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}`, tools: [] }]);
    }
    setBusy(false);
  };

  const send = () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    ask(text);
  };

  const applyTool = (tool) => {
    if (!applyEdit) return;
    applyEdit(tool);
  };

  const toggleTool = (id) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  if (!open) return null;

  return (
    <>
      <div className="drawer-scrim" onClick={onClose}></div>
      <div className="cc-drawer">
        <div className="cc-head">
          <div className="cc-brand">
            <div className="cc-brand-mark">
              <Icon name="sparkles" size={13} />
            </div>
            <div>
              <div className="cc-brand-name">Claude Code</div>
              <div className="cc-brand-sub">
                <span className="cc-status-dot"></span>
                Connected · full project context
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            className="icon-btn"
            title="Tool permissions"
            onClick={() => document.getElementById("cc-tools-panel").classList.toggle("open")}
          >
            <Icon name="grid" size={13} />
          </button>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div id="cc-tools-panel" className="cc-tools-panel">
          <div className="cc-tools-h">
            Tools{" "}
            <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>
              · {enabledTools.size}/{TOOL_DEFS.length} enabled
            </span>
          </div>
          <div className="cc-tools-grid">
            {TOOL_DEFS.map((t) => (
              <button
                key={t.id}
                className={"cc-tool-chip" + (enabledTools.has(t.id) ? " on" : "")}
                onClick={() => toggleTool(t.id)}
                title={t.hint}
              >
                <Icon name={t.icon} size={11} />
                <span>{t.label}</span>
                {enabledTools.has(t.id) && <Icon name="check" size={10} />}
              </button>
            ))}
          </div>
        </div>

        <div className="cc-thread" ref={scrollRef}>
          {messages.length <= 1 && (
            <div className="cc-starters">
              <div className="cc-starters-h">Try asking…</div>
              <div className="cc-starters-grid">
                {STARTERS.map((s) => (
                  <button
                    key={s.title}
                    className="cc-starter"
                    onClick={() => ask(s.prompt)}
                    disabled={busy}
                  >
                    <Icon name={s.icon} size={13} />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={"cc-msg cc-msg-" + m.role}>
              {m.role === "assistant" && (
                <div className="cc-avatar">
                  <Icon name="sparkles" size={11} />
                </div>
              )}
              <div className="cc-bubble">
                {render(m.content)}
                {m.tools && m.tools.length > 0 && (
                  <div className="cc-tool-calls">
                    {m.tools.map((t, j) => (
                      <div key={j} className="cc-tool-call">
                        <div className="cc-tool-call-h">
                          <Icon name="sparkles" size={10} />
                          <span className="cc-tool-name">{t.name}</span>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ marginLeft: "auto" }}
                            onClick={() => applyTool(t)}
                          >
                            <Icon name="check" size={10} /> Apply
                          </button>
                        </div>
                        <div className="cc-tool-fields">
                          {Object.entries(t.fields).map(([k, v]) => (
                            <div key={k} className="cc-tool-field">
                              <span className="cc-tool-field-k">{k}</span>
                              <span className="cc-tool-field-v">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="cc-msg cc-msg-assistant">
              <div className="cc-avatar">
                <Icon name="sparkles" size={11} />
              </div>
              <div className="cc-bubble cc-typing">
                <span></span>
                <span></span>
                <span></span>
                <span style={{ marginLeft: 8, fontSize: 11.5, color: "var(--ink-3)" }}>
                  thinking…
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="cc-input-wrap">
          <div className="cc-input-row">
            <Icon name="sparkles" size={13} />
            <textarea
              className="cc-textarea"
              placeholder="Ask Claude Code anything about your project…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={busy}
              rows={2}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={send}
              disabled={busy || !input.trim()}
            >
              <Icon name="arrow" size={11} />
            </button>
          </div>
          <div className="cc-input-foot">
            <span>
              <kbd className="kbd-inline">Enter</kbd> send
            </span>
            <span>
              <kbd className="kbd-inline">⇧ Enter</kbd> newline
            </span>
            <span style={{ flex: 1 }}></span>
            <span>
              {enabledTools.size} tool{enabledTools.size === 1 ? "" : "s"} enabled ·
              claude-haiku-4.5
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Sample response when claude API is unavailable
function sampleResponse(req, ctx) {
  const lc = req.toLowerCase();
  if (lc.includes("architect") || (lc.includes("design") && lc.includes("system"))) {
    return `Looking at your project, here's the architecture I'd suggest:

**Core flow:**
- **Clients** (web + iOS) talk to a single edge gateway
- **Gateway** routes to focused services (auth, domain, sync)
- **Postgres** as source of truth, **Redis** for sessions and rate-limiting
- **Job queue** for reminders and async work

This isolates each concern, gives you good failure boundaries, and keeps the read path snappy.

[TOOL: add_node]
type: cloud
label: CDN
sub: Cloudflare · static + edge cache
[/TOOL]

[TOOL: add_node]
type: queue
label: Reminders Queue
sub: BullMQ · cron + delayed jobs
[/TOOL]

Want me to draft the data model next?`;
  }
  if (lc.includes("component")) {
    return `Based on your features, here's the component inventory I'd start with:

**Layout**: AppShell, Sidebar, TopBar, ContentArea  
**Forms**: Input, Select, Textarea, Checkbox, Toggle, DatePicker  
**Data**: Card, List, Table, Tabs, Badge, Avatar  
**Feedback**: Toast, Modal, Skeleton, EmptyState, ErrorState  
**Charts**: SparkLine, BarChart (for streaks), Heatmap

Each needs: \`default · hover · focus · disabled · loading · error\` states.

[TOOL: component_spec]
name: HabitCard
props: title, streak, color, status
states: default, checking-in, completed, skipped
variants: compact, detailed
[/TOOL]

Should I add the rest as a component library doc?`;
  }
  if (lc.includes("audit") || lc.includes("improve")) {
    return `Audit results — top 5 gaps:

1. **Description is functional but not opinionated.** Add 1 sentence about *why* this exists vs. competitors.
2. **No error/empty states** in the spec. AI agents will invent inconsistent ones. Define a global pattern.
3. **Sync engine has no conflict policy.** "CRDT" alone is not enough — name the strategy.
4. **No analytics events.** A tracking event taxonomy makes onboarding a UX issue, not a guess.
5. **No accessibility budget.** "WCAG 2.1 AA" is a goal, not a plan.

[TOOL: edit_spec]
section: overview
patch: { description: "...add positioning sentence..." }
[/TOOL]

Want me to draft each?`;
  }
  return `Got it. Based on your **${ctx?.spec?.overview?.name || "project"}** spec:

- I can see ${ctx?.spec?.features?.length || 0} features, ${ctx?.spec?.models?.length || 0} models, ${ctx?.spec?.endpoints?.length || 0} endpoints
- Canvas has ${ctx?.nodes?.length || 0} nodes connected by ${ctx?.edges?.length || 0} edges
- Diagram type: ${ctx?.diagramType}

Tell me what you'd like to do — refine the spec, design a component, draft an ADR, audit for gaps, or generate API endpoints. I can apply changes directly to your canvas and spec.`;
}

export { ClaudeCodeChat };
