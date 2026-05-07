import { useMemo, useRef, useState } from "react";
import { Icon } from "../../data/icons.jsx";
import { TEMPLATE_PRESETS } from "../../data/template-presets.js";
import { useFocusTrap } from "../../utils/use-focus-trap.js";

// ============== Architecture presets (used when starting blank) ==============
const ARCH_PRESETS = [
  {
    id: "blank",
    name: "Blank canvas",
    desc: "Start with an empty diagram. Add nodes one by one.",
    nodes: [],
    edges: [],
  },
  {
    id: "monolith",
    name: "Web app — monolithic",
    desc: "Single client, single API, single database.",
    nodes: [
      { id: "n1", type: "user", x: 60, y: 100, label: "Web client", sub: "" },
      { id: "n2", type: "api", x: 320, y: 100, label: "App server", sub: "" },
      { id: "n3", type: "db", x: 580, y: 100, label: "Database", sub: "" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
    ],
  },
  {
    id: "microservices",
    name: "Microservices",
    desc: "API gateway, three domain services, shared data layer.",
    nodes: [
      { id: "n1", type: "user", x: 60, y: 200, label: "Client", sub: "" },
      { id: "n2", type: "api", x: 320, y: 200, label: "API Gateway", sub: "" },
      { id: "n3", type: "fn", x: 580, y: 80, label: "Auth service", sub: "" },
      { id: "n4", type: "fn", x: 580, y: 200, label: "Domain service", sub: "" },
      { id: "n5", type: "fn", x: 580, y: 320, label: "Sync service", sub: "" },
      { id: "n6", type: "db", x: 840, y: 140, label: "Postgres", sub: "" },
      { id: "n7", type: "cloud", x: 840, y: 260, label: "Redis", sub: "cache + queue" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n2", to: "n4" },
      { id: "e4", from: "n2", to: "n5" },
      { id: "e5", from: "n4", to: "n6" },
      { id: "e6", from: "n5", to: "n6" },
      { id: "e7", from: "n3", to: "n7" },
    ],
  },
  {
    id: "serverless",
    name: "Serverless / edge",
    desc: "Edge functions, managed database, object storage.",
    nodes: [
      { id: "n1", type: "user", x: 60, y: 140, label: "Browser", sub: "" },
      { id: "n2", type: "cloud", x: 320, y: 140, label: "CDN / edge", sub: "" },
      { id: "n3", type: "fn", x: 580, y: 60, label: "Edge function", sub: "" },
      { id: "n4", type: "fn", x: 580, y: 220, label: "Background job", sub: "" },
      { id: "n5", type: "db", x: 840, y: 140, label: "Managed DB", sub: "" },
      { id: "n6", type: "cloud", x: 840, y: 260, label: "Object storage", sub: "" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n5" },
      { id: "e4", from: "n3", to: "n4" },
      { id: "e5", from: "n4", to: "n6" },
    ],
  },
  {
    id: "mobile",
    name: "Mobile-first",
    desc: "iOS + Android clients, single API, push notifications.",
    nodes: [
      { id: "n1", type: "user", x: 60, y: 80, label: "iOS app", sub: "" },
      { id: "n2", type: "user", x: 60, y: 220, label: "Android app", sub: "" },
      { id: "n3", type: "api", x: 320, y: 150, label: "API", sub: "" },
      { id: "n4", type: "db", x: 580, y: 80, label: "Database", sub: "" },
      { id: "n5", type: "cloud", x: 580, y: 220, label: "Push service", sub: "APNs / FCM" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n3" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
      { id: "e4", from: "n3", to: "n5" },
    ],
  },
  {
    id: "ai",
    name: "AI agent app",
    desc: "Streaming chat, tool calling, vector store.",
    nodes: [
      { id: "n1", type: "user", x: 60, y: 140, label: "Web client", sub: "streaming UI" },
      { id: "n2", type: "api", x: 320, y: 140, label: "Chat API", sub: "" },
      { id: "n3", type: "fn", x: 580, y: 60, label: "Agent loop", sub: "tool calling" },
      { id: "n4", type: "cloud", x: 840, y: 60, label: "LLM provider", sub: "" },
      { id: "n5", type: "fn", x: 580, y: 200, label: "RAG retrieval", sub: "" },
      { id: "n6", type: "db", x: 840, y: 200, label: "Vector DB", sub: "" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
      { id: "e4", from: "n3", to: "n5" },
      { id: "e5", from: "n5", to: "n6" },
    ],
  },
];

// ============== Empty spec generator ==============
function blankSpec(name, description) {
  return {
    overview: {
      name: name || "Untitled",
      tagline: description || "",
      description: description || "",
      goals: "",
    },
    stack: { frontend: [], backend: [], data: [], infra: [] },
    features: [],
    models: [],
    endpoints: [],
    stories: [],
    constraints: { musts: [], nonGoals: [] },
    conventions: { style: "", naming: "", testing: "" },
    deploy: { envs: ["dev", "production"], notes: "" },
    handoff: { adrs: [], risks: [] },
  };
}

// ============== Step 1: Source picker ==============
function StepSource({ source, setSource }) {
  const options = [
    {
      id: "blank",
      icon: "plus",
      title: "Blank project",
      desc: "Start from scratch and build your spec piece by piece.",
    },
    {
      id: "template",
      icon: "template",
      title: "From a template",
      desc: "Start with a pre-built spec for a SaaS, mobile app, or AI agent.",
    },
    {
      id: "import",
      icon: "folder",
      title: "Import a project",
      desc: "Restore from an Architect JSON export file.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt) => {
        const on = source === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSource(opt.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              borderRadius: 10,
              border: on ? "1.5px solid var(--accent)" : "1px solid var(--line)",
              background: on ? "var(--accent-soft)" : "var(--bg-1)",
              color: "var(--ink-0)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all .15s ease",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: on ? "var(--accent)" : "var(--bg-2)",
                color: on ? "#fff" : "var(--ink-2)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={opt.icon} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{opt.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
                {opt.desc}
              </div>
            </div>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                border: "1.5px solid " + (on ? "var(--accent)" : "var(--line-strong)"),
                background: on ? "var(--accent)" : "transparent",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {on && <Icon name="check" size={11} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============== Step 2: Template gallery ==============
function StepTemplate({ templateId, setTemplateId }) {
  const templates = useMemo(() => Object.entries(TEMPLATE_PRESETS), []);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {templates.map(([id, t]) => {
        const on = templateId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTemplateId(id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: 8,
              padding: 14,
              borderRadius: 10,
              border: on ? "1.5px solid var(--accent)" : "1px solid var(--line)",
              background: on ? "var(--accent-soft)" : "var(--bg-1)",
              color: "var(--ink-0)",
              textAlign: "left",
              cursor: "pointer",
              minHeight: 120,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.spec.overview.name}</div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              {t.spec.overview.tagline}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              {t.spec.stack.frontend.slice(0, 2).map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 10.5,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "var(--bg-2)",
                    color: "var(--ink-2)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============== Step 3: Architecture preset (blank only) ==============
function StepArch({ archId, setArchId }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 10,
      }}
    >
      {ARCH_PRESETS.map((a) => {
        const on = archId === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => setArchId(a.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: 6,
              padding: 14,
              borderRadius: 10,
              border: on ? "1.5px solid var(--accent)" : "1px solid var(--line)",
              background: on ? "var(--accent-soft)" : "var(--bg-1)",
              color: "var(--ink-0)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{a.desc}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 4 }}>
              {a.nodes.length} nodes · {a.edges.length} connections
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============== Step 4: Details (name + description) ==============
function StepDetails({ name, setName, description, setDescription, suggestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
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
          Project name
        </label>
        <input
          className="field-input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={suggestion?.name || "My new project"}
          style={{ width: "100%" }}
        />
      </div>
      <div>
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
          Tagline / short description
          <span style={{ color: "var(--ink-3)", fontWeight: 400, textTransform: "none" }}>
            {" "}
            · optional
          </span>
        </label>
        <textarea
          className="field-area"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={suggestion?.description || "A one-sentence summary of what you're building."}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

// ============== Step: Import (file picker) ==============
function StepImport({ onFile, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 30 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "var(--accent-soft)",
          color: "var(--accent-ink)",
          display: "grid",
          placeItems: "center",
          marginBottom: 14,
        }}
      >
        <Icon name="folder" size={26} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        Pick an Architect JSON file
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink-3)",
          marginBottom: 16,
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        Files exported from Architect end with <code>.architect.json</code>.
      </div>
      <label className="btn btn-primary" style={{ cursor: "pointer" }}>
        <Icon name="download" size={13} />
        <span>Choose file</span>
        <input
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {error && <div style={{ color: "var(--rose)", fontSize: 12.5, marginTop: 14 }}>{error}</div>}
    </div>
  );
}

// ============== Stepper indicator ==============
function StepperDots({ steps, current }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {steps.map((s, i) => (
        <div
          key={s}
          style={{
            width: i === current ? 22 : 6,
            height: 6,
            borderRadius: 999,
            background: i <= current ? "var(--accent)" : "var(--bg-2)",
            transition: "width .2s ease, background .2s ease",
          }}
        />
      ))}
    </div>
  );
}

// ============== Main wizard ==============
function NewProjectWizard({ onClose, onCreate, onImport, initialTemplateId }) {
  const [source, setSource] = useState(initialTemplateId ? "template" : "blank");
  const [step, setStep] = useState(initialTemplateId ? 1 : 0);
  const [templateId, setTemplateId] = useState(initialTemplateId ?? null);
  const [archId, setArchId] = useState("blank");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [importError, setImportError] = useState(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);

  const flow =
    source === "template"
      ? ["source", "template", "details"]
      : source === "import"
        ? ["source", "import"]
        : ["source", "arch", "details"];

  const stepKey = flow[step];

  const canAdvance = (() => {
    if (stepKey === "source") return Boolean(source);
    if (stepKey === "template") return Boolean(templateId);
    if (stepKey === "arch") return Boolean(archId);
    if (stepKey === "details") return name.trim().length > 0;
    return false;
  })();

  const isFinal = step === flow.length - 1 && stepKey !== "import";

  const suggestion = useMemo(() => {
    if (source === "template" && templateId && TEMPLATE_PRESETS[templateId]) {
      const t = TEMPLATE_PRESETS[templateId].spec.overview;
      return { name: t.name, description: t.tagline };
    }
    if (source === "blank" && archId !== "blank") {
      const a = ARCH_PRESETS.find((x) => x.id === archId);
      if (a) return { name: a.name + " project", description: a.desc };
    }
    return { name: "", description: "" };
  }, [source, templateId, archId]);

  const handleNext = () => {
    if (step < flow.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleCreate = () => {
    const finalName = name.trim() || suggestion.name || "Untitled project";
    const finalDesc = description.trim() || suggestion.description || "";

    if (source === "template" && templateId && TEMPLATE_PRESETS[templateId]) {
      const preset = TEMPLATE_PRESETS[templateId];
      const spec = { ...preset.spec };
      spec.overview = {
        ...spec.overview,
        name: finalName,
        tagline: finalDesc || spec.overview.tagline,
      };
      onCreate({
        name: finalName,
        description: finalDesc || preset.spec.overview.tagline,
        content: {
          spec,
          nodes: preset.nodes,
          edges: preset.edges,
          diagramType: "system",
        },
      });
    } else {
      const arch = ARCH_PRESETS.find((a) => a.id === archId) ?? ARCH_PRESETS[0];
      onCreate({
        name: finalName,
        description: finalDesc,
        content: {
          spec: blankSpec(finalName, finalDesc),
          nodes: arch.nodes,
          edges: arch.edges,
          diagramType: "system",
        },
      });
    }
  };

  const handleImportFile = async (file) => {
    setImportError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await onImport(data);
    } catch (err) {
      setImportError(err.message || "Failed to read file.");
    }
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        style={{
          width: "min(720px, 96vw)",
          maxHeight: "min(720px, 92vh)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-head">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="sparkles" size={15} />
          </div>
          <div>
            <h2 id="new-project-title" style={{ margin: 0, fontSize: 17 }}>
              New project
            </h2>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              {stepKey === "source" && "How would you like to start?"}
              {stepKey === "template" && "Pick a starting template"}
              {stepKey === "arch" && "Pick an architecture"}
              {stepKey === "details" && "Name your project"}
              {stepKey === "import" && "Import an existing project"}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <StepperDots steps={flow} current={step} />
          <button className="icon-btn" onClick={onClose} style={{ marginLeft: 12 }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
            minHeight: 280,
          }}
        >
          {stepKey === "source" && <StepSource source={source} setSource={setSource} />}
          {stepKey === "template" && (
            <StepTemplate templateId={templateId} setTemplateId={setTemplateId} />
          )}
          {stepKey === "arch" && <StepArch archId={archId} setArchId={setArchId} />}
          {stepKey === "details" && (
            <StepDetails
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              suggestion={suggestion}
            />
          )}
          {stepKey === "import" && <StepImport onFile={handleImportFile} error={importError} />}
        </div>

        <div
          className="modal-foot"
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 24px",
            borderTop: "1px solid var(--line)",
          }}
        >
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={handleBack}>
              <Icon name="chevL" size={12} /> Back
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          )}
          <div style={{ flex: 1 }} />
          {stepKey === "import" ? (
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", alignSelf: "center" }}>
              Files imported automatically
            </span>
          ) : isFinal ? (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleCreate}
              disabled={!canAdvance}
            >
              <Icon name="check" size={13} />
              <span>Create project</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canAdvance}
            >
              <span>Continue</span>
              <Icon name="arrow" size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { NewProjectWizard };
