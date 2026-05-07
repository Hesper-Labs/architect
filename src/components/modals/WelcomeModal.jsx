import { useRef, useState } from "react";
import { Icon } from "../../data/icons.jsx";
import { isConfigured } from "../../lib/claude.js";
import { useFocusTrap } from "../../utils/use-focus-trap.js";

// ============== Per-feature accent colors ==============
const FEATURES = [
  {
    icon: "edit",
    title: "Spec editor",
    desc: "Overview, features, data models, endpoints, user stories — every section an AI agent needs to ship code that matches your intent.",
    color: "var(--blue, #38bdf8)",
  },
  {
    icon: "canvas",
    title: "Architecture canvas",
    desc: "Drag-and-drop nodes and edges. Switch between system, flow, sequence, ER, state, and component-tree diagrams.",
    color: "var(--violet, #a78bfa)",
  },
  {
    icon: "sparkles",
    title: "AI co-architect",
    desc: "Bring your own Claude key and let an AI review your spec, find gaps, draft components, and apply edits to the canvas in one click.",
    color: "var(--accent-ink, #f59e0b)",
  },
  {
    icon: "download",
    title: "Export anywhere",
    desc: "Markdown (CLAUDE.md), JSON, XML, Mermaid, or ASCII fallback. Drop the result into Claude Code, Cursor, or any agent of your choice.",
    color: "var(--green, #22c55e)",
  },
];

// Local CSS — keyframes + welcome-specific tweaks. Kept inline so the component
// is fully self-contained and doesn't bleed into main.css.
const WELCOME_STYLES = `
  @keyframes architect-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50% { opacity: 0.95; transform: scale(1.04); }
  }
  @keyframes architect-spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes architect-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .arc-welcome-step { animation: architect-fade-in 0.35s cubic-bezier(.3,.7,.4,1); }
  .arc-feature-card {
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .arc-feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -10px rgba(0,0,0,0.5);
  }
`;

// ============== Hero step ==============
function HeroStep() {
  return (
    <div
      className="arc-welcome-step"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "12px 24px 28px",
        minHeight: 360,
      }}
    >
      {/* Decorative radial gradient backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -20,
          background: "radial-gradient(circle at 50% 35%, var(--accent-soft) 0%, transparent 55%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Faint dotted grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, var(--ink-3, #6b6b6b) 0.6px, transparent 0.6px)",
          backgroundSize: "16px 16px",
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Logo with multi-layer glow halo */}
      <div
        style={{
          position: "relative",
          width: 180,
          height: 180,
          marginTop: 8,
          marginBottom: 22,
          zIndex: 1,
        }}
      >
        {/* Outer pulsing glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -28,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
            animation: "architect-pulse 4.5s ease-in-out infinite",
            filter: "blur(8px)",
          }}
        />
        {/* Inner soft halo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: 36,
            background: "var(--accent-soft)",
            filter: "blur(2px)",
            opacity: 0.7,
          }}
        />
        {/* Slow-spinning accent ring */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: 32,
            border: "1px dashed var(--accent-line)",
            animation: "architect-spin-slow 32s linear infinite",
            opacity: 0.55,
          }}
        />
        {/* Logo plate */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 30,
            background: "var(--bg-1)",
            border: "1px solid var(--accent-line)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 22px 60px -20px rgba(0,0,0,0.6)",
          }}
        >
          <img
            src="/logo.png"
            alt="Architect logo"
            width={138}
            height={138}
            style={{ borderRadius: 22, objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 12px",
          borderRadius: 999,
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          fontSize: 11,
          color: "var(--ink-2)",
          textTransform: "uppercase",
          letterSpacing: 0.18,
          marginBottom: 18,
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--accent)",
          }}
        />
        a Hesper Labs product
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: 36,
          fontFamily: "var(--font-serif)",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          zIndex: 1,
        }}
      >
        Welcome to <span style={{ color: "var(--accent-ink)" }}>Architect</span>
      </h2>

      <p
        style={{
          marginTop: 16,
          fontSize: 14.5,
          lineHeight: 1.65,
          color: "var(--ink-2)",
          maxWidth: 480,
          zIndex: 1,
        }}
      >
        An open-source studio for designing the structured project specifications that AI coding
        agents like <strong style={{ color: "var(--ink-1)" }}>Claude Code</strong> consume before
        implementation. Local-first, no servers, your data stays on your machine.
      </p>
    </div>
  );
}

// ============== Features step ==============
function FeaturesStep() {
  return (
    <div className="arc-welcome-step">
      <div
        style={{
          textAlign: "center",
          marginBottom: 22,
          padding: "0 16px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 24,
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          Everything in one place
        </h3>
        <p style={{ margin: "8px 0 0", color: "var(--ink-3)", fontSize: 13 }}>
          Spec, canvas, AI, exports — built for one job: handing AI agents a project they can
          actually ship.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 14,
          padding: "4px 4px 8px",
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="arc-feature-card"
            style={{
              position: "relative",
              padding: "18px 18px 16px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              background: "var(--bg-1)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: f.color,
                opacity: 0.85,
              }}
            />
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: `color-mix(in oklab, ${f.color} 18%, transparent)`,
                color: f.color,
                display: "grid",
                placeItems: "center",
                border: `1px solid color-mix(in oklab, ${f.color} 30%, transparent)`,
              }}
            >
              <Icon name={f.icon} size={17} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{f.title}</div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-3)",
                lineHeight: 1.55,
              }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== BYOK step ==============
function ByokStep({ apiKey, setApiKey, onSave }) {
  const valid = isConfigured(apiKey);

  return (
    <div className="arc-welcome-step" style={{ padding: "8px 0" }}>
      {/* Visual flow diagram */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 16px",
          marginBottom: 20,
          borderRadius: 14,
          background: "linear-gradient(180deg, var(--accent-soft) 0%, transparent 100%)",
          border: "1px solid var(--line)",
          gap: 12,
        }}
      >
        {[
          { icon: "device", label: "Your browser", note: "stores key" },
          { arrow: true },
          { icon: "lock", label: "Your API key", note: "sk-ant-…" },
          { arrow: true },
          { icon: "cloud", label: "Anthropic API", note: "api.anthropic.com" },
        ].map((node, i) =>
          node.arrow ? (
            <div key={i} aria-hidden style={{ flexShrink: 0, color: "var(--ink-3)", fontSize: 13 }}>
              <Icon name="arrow" size={14} />
            </div>
          ) : (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--bg-1)",
                  border: "1px solid var(--accent-line)",
                  color: "var(--accent-ink)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name={node.icon} size={17} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{node.label}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{node.note}</div>
            </div>
          ),
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            letterSpacing: "-0.015em",
          }}
        >
          Bring your own Claude API key
        </h3>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12.5,
            color: "var(--ink-3)",
            lineHeight: 1.55,
          }}
        >
          Get a key at{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-ink)" }}
          >
            console.anthropic.com
          </a>
          . The key is stored only in your browser and only sent to api.anthropic.com when you use
          the AI features. You can add it now, later in Settings, or skip it entirely — the app
          still works with sample responses.
        </p>
      </div>

      <label
        style={{
          display: "block",
          fontSize: 11.5,
          fontWeight: 500,
          color: "var(--ink-3)",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.05,
        }}
      >
        Anthropic API key{" "}
        <span style={{ color: "var(--ink-3)", fontWeight: 400, textTransform: "none" }}>
          · optional
        </span>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="password"
          className="field-input api"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          autoComplete="off"
          spellCheck="false"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn"
          onClick={onSave}
          disabled={!valid}
          title={valid ? "Save key" : "Key must start with sk-ant-"}
        >
          <Icon name="check" size={12} />
          <span>Save</span>
        </button>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
        Stored at <code>localStorage[architect:claude_api_key]</code>. Never sent to any server but
        Anthropic.
      </div>

      <div
        style={{
          marginTop: 22,
          padding: 14,
          borderRadius: 10,
          background: "var(--bg-1)",
          border: "1px dashed var(--line)",
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
          No API key? You can still ship your spec to Claude.
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6 }}>
          The Export panel has one-click handoff for{" "}
          <strong style={{ color: "var(--ink-1)" }}>claude.ai</strong> (clipboard + new chat) and{" "}
          <strong style={{ color: "var(--ink-1)" }}>Claude Code CLI</strong> (downloads{" "}
          <code>CLAUDE.md</code> and copies a shell snippet). Use whichever your account supports —
          no API key required.
        </div>
      </div>
    </div>
  );
}

// ============== Ready step ==============
function ReadyStep() {
  return (
    <div
      className="arc-welcome-step"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "20px 24px 16px",
        minHeight: 320,
      }}
    >
      {/* Concentric pulsing rings */}
      <div
        style={{
          position: "relative",
          width: 140,
          height: 140,
          marginBottom: 22,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              inset: -i * 14,
              borderRadius: "50%",
              border: `1px solid var(--accent-line)`,
              opacity: 0.4 - i * 0.1,
              animation: `architect-pulse ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: "50%",
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 14px 40px -14px var(--accent-line)",
          }}
        >
          <Icon name="sparkles" size={32} />
        </div>
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 24,
          fontFamily: "var(--font-serif)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        Ready to build
      </h3>
      <p
        style={{
          marginTop: 12,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: "var(--ink-2)",
          maxWidth: 440,
        }}
      >
        We&apos;ll start by creating your first project. You can pick a template, start blank with
        an architecture preset, or import an existing Architect file.
      </p>
      <div
        style={{
          marginTop: 18,
          padding: "10px 16px",
          borderRadius: 10,
          background: "var(--bg-2)",
          border: "1px dashed var(--line)",
          fontSize: 12,
          color: "var(--ink-3)",
          maxWidth: 440,
          lineHeight: 1.5,
        }}
      >
        Your <strong style={{ color: "var(--ink-1)" }}>Pulse</strong> demo project is already loaded
        — feel free to delete it from the dashboard once you find your footing.
      </div>
    </div>
  );
}

// ============== Stepper ==============
function StepperDots({ count, current }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 6,
            height: 6,
            borderRadius: 999,
            background: i <= current ? "var(--accent)" : "var(--bg-2)",
            transition: "width .25s ease, background .25s ease",
          }}
        />
      ))}
    </div>
  );
}

// ============== Main welcome modal ==============
function WelcomeModal({ onClose, onCreateProject, onSaveApiKey, currentApiKey }) {
  const STEPS = ["hero", "features", "byok", "ready"];
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);

  const stepKey = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finishAndClose = () => onClose();
  const finishAndCreate = () => onCreateProject();

  const saveKey = async () => {
    if (apiKey && apiKey.trim()) {
      await onSaveApiKey(apiKey.trim());
    }
  };

  return (
    <>
      <style>{WELCOME_STYLES}</style>
      <div
        className="modal-scrim"
        style={{
          background: "rgba(8, 6, 5, 0.88)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div
          ref={dialogRef}
          className="modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-brand"
          style={{
            width: "min(720px, 96vw)",
            maxHeight: "min(760px, 92vh)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--line)",
            background: "var(--bg-0)",
            boxShadow: "0 32px 90px -20px rgba(0,0,0,0.7)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 20px",
              borderBottom: "1px solid var(--line)",
              background: "var(--bg-1)",
            }}
          >
            <div
              id="welcome-modal-brand"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <img
                src="/logo.png"
                alt=""
                width={22}
                height={22}
                style={{
                  borderRadius: 6,
                  objectFit: "cover",
                  border: "1px solid var(--accent-line)",
                }}
              />
              <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em" }}>
                Architect
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  paddingLeft: 8,
                  borderLeft: "1px solid var(--line)",
                  marginLeft: 2,
                }}
              >
                by Hesper Labs
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <StepperDots count={STEPS.length} current={step} />
            <button
              type="button"
              className="icon-btn"
              onClick={finishAndClose}
              style={{ marginLeft: 14 }}
              aria-label="Skip welcome"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              padding: 26,
              overflowY: "auto",
              flex: 1,
              minHeight: 380,
            }}
          >
            {stepKey === "hero" && <HeroStep />}
            {stepKey === "features" && <FeaturesStep />}
            {stepKey === "byok" && (
              <ByokStep apiKey={apiKey} setApiKey={setApiKey} onSave={saveKey} />
            )}
            {stepKey === "ready" && <ReadyStep />}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "14px 24px",
              borderTop: "1px solid var(--line)",
              background: "var(--bg-1)",
            }}
          >
            {!isFirst ? (
              <button type="button" className="btn btn-ghost" onClick={back}>
                <Icon name="chevL" size={12} /> Back
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={finishAndClose}>
                Skip intro
              </button>
            )}
            <div style={{ flex: 1 }} />
            {isLast ? (
              <>
                <button type="button" className="btn" onClick={finishAndClose}>
                  I&apos;ll explore on my own
                </button>
                <button type="button" className="btn btn-primary btn-lg" onClick={finishAndCreate}>
                  <Icon name="sparkles" size={13} />
                  <span>Create my first project</span>
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={next}>
                <span>{isFirst ? "Get started" : "Continue"}</span>
                <Icon name="arrow" size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export { WelcomeModal };
