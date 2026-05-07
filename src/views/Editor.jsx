import { useEffect, useState } from "react";
import { Icon } from "../data/icons.jsx";
import { CanvasArea, NODE_TYPES } from "../components/canvas/Canvas.jsx";
import { AIAssistant } from "../components/AiAssistant.jsx";
import { useSettingsStore } from "../store/settings.js";

const TOOL_DEFS = [
  { id: "select", icon: "select", label: "Select", shortcut: "V" },
  { id: "pan", icon: "pan", label: "Pan", shortcut: "H" },
  { id: "node", icon: "box", label: "Add node", shortcut: "N" },
  { id: "note", icon: "text", label: "Sticky note", shortcut: "T" },
  {
    id: "edge",
    icon: "arrow",
    label: "Connect",
    shortcut: "E",
    hint: "Drag from a node's right port to a target's left port to connect.",
  },
];

const DIAGRAM_TYPES = [
  { id: "system", icon: "network", label: "System" },
  { id: "flow", icon: "flow", label: "User flow" },
  { id: "sequence", icon: "sequence", label: "Sequence" },
  { id: "er", icon: "er", label: "Data / ER" },
  { id: "tree", icon: "tree", label: "Components" },
  { id: "state", icon: "state", label: "State" },
];

function ToolRail({
  tool,
  setTool,
  diagramType,
  setDiagramType,
  openHistory,
  openDesign,
  openHandoff,
  openCodeChat,
}) {
  return (
    <div className="tool-rail">
      {TOOL_DEFS.map((t) => (
        <button
          key={t.id}
          className={"tool" + (tool === t.id ? " active" : "")}
          onClick={() => setTool(t.id)}
          title={t.label + (t.shortcut ? " (" + t.shortcut + ")" : "")}
        >
          <Icon name={t.icon} size={16} />
          <span className="tool-label">
            {t.label}
            {t.shortcut && <kbd className="tool-kbd">{t.shortcut}</kbd>}
          </span>
        </button>
      ))}
      <div className="tool-divider"></div>
      {DIAGRAM_TYPES.map((d) => (
        <button
          key={d.id}
          className={"tool" + (diagramType === d.id ? " active" : "")}
          onClick={() => setDiagramType(d.id)}
          title={d.label}
        >
          <Icon name={d.icon} size={16} />
          <span className="tool-label">{d.label}</span>
        </button>
      ))}
      <div className="tool-divider"></div>
      <button className="tool" title="History" onClick={openHistory}>
        <Icon name="git" size={16} />
        <span className="tool-label">History</span>
      </button>
      <button className="tool" title="Design layer" onClick={openDesign}>
        <Icon name="palette" size={16} />
        <span className="tool-label">Design</span>
      </button>
      <button className="tool" title="Handoff package" onClick={openHandoff}>
        <Icon name="extLink" size={16} />
        <span className="tool-label">Handoff</span>
      </button>
      <button className="tool" title="Claude Code chat" onClick={openCodeChat}>
        <Icon name="terminal" size={16} />
        <span className="tool-label">Chat</span>
      </button>
    </div>
  );
}

// Collapsible section
function SpecSection({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"spec-section" + (open ? "" : " collapsed")}>
      <div
        className={"spec-section-head" + (open ? "" : " collapsed")}
        onClick={() => setOpen(!open)}
      >
        <span className="chev">
          <Icon name="chevD" size={12} />
        </span>
        <span>{title}</span>
        {count != null && <span className="pill">{count}</span>}
      </div>
      {open && <div className="spec-section-body">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function ListEditor({ items, onChange, renderItem, addLabel = "Add" }) {
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => (
        <div key={item.id} className="list-item">
          <span className="grip">
            <Icon name="grip" size={14} />
          </span>
          {renderItem(item, (patch) =>
            onChange(items.map((i) => (i.id === item.id ? { ...i, ...patch } : i))),
          )}
          <button
            className="icon-btn"
            style={{ width: 22, height: 22 }}
            onClick={() => remove(item.id)}
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      ))}
      <button className="chip add" style={{ alignSelf: "flex-start" }}>
        <Icon name="plus" size={12} />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}

function SpecPanel({
  spec,
  setSpec,
  diagramType,
  setDiagramType,
  selected,
  nodes,
  setNodes,
  edges,
  collapsed,
  onToggle,
  tab,
  setTab,
}) {
  const selectedNode =
    selected?.nodes?.length === 1 ? nodes.find((n) => n.id === selected.nodes[0]) : null;

  // Collapsed state is rendered by Editor as a floating toggle on the canvas;
  // this returns null so the panel takes zero layout space.
  if (collapsed) return null;

  const updateNode = (patch) => {
    if (!selectedNode) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)));
  };

  const update = (section, patch) =>
    setSpec((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const featureCount = spec.features.length;
  const endpointCount = spec.endpoints.length;
  const modelCount = spec.models.length;
  const storyCount = spec.stories.length;

  return (
    <aside className="spec-panel" style={{ position: "relative", transition: "width 0.25s ease" }}>
      <button
        type="button"
        onClick={onToggle}
        title="Collapse panel"
        aria-label="Collapse spec panel"
        className="icon-btn"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          width: 24,
          height: 24,
        }}
      >
        <Icon name="chevR" size={12} />
      </button>

      <div className="spec-tabs">
        <button
          className={"spec-tab" + (tab === "spec" ? " active" : "")}
          onClick={() => setTab("spec")}
        >
          <Icon name="edit" size={13} /> Spec
        </button>
        <button
          className={"spec-tab" + (tab === "diagram" ? " active" : "")}
          onClick={() => setTab("diagram")}
        >
          <Icon name="network" size={13} /> Diagram
        </button>
        <button
          className={"spec-tab" + (tab === "ai" ? " active" : "")}
          onClick={() => setTab("ai")}
        >
          <Icon name="sparkles" size={13} /> AI
        </button>
      </div>

      <div className="spec-body scroll">
        {tab === "spec" && (
          <>
            <SpecSection title="Overview">
              <Field label="Project name">
                <input
                  className="field-input"
                  value={spec.overview.name}
                  onChange={(e) => update("overview", { name: e.target.value })}
                />
              </Field>
              <Field label="Tagline">
                <input
                  className="field-input"
                  value={spec.overview.tagline}
                  onChange={(e) => update("overview", { tagline: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="field-area"
                  rows={4}
                  value={spec.overview.description}
                  onChange={(e) => update("overview", { description: e.target.value })}
                />
              </Field>
              <Field label="Goals & success">
                <textarea
                  className="field-area"
                  rows={2}
                  value={spec.overview.goals}
                  onChange={(e) => update("overview", { goals: e.target.value })}
                />
              </Field>
            </SpecSection>

            <SpecSection title="Tech stack">
              <Field label="Frontend">
                <div className="chip-group">
                  {spec.stack.frontend.map((t) => (
                    <span key={t} className="chip on">
                      {t}
                      <Icon name="x" size={10} />
                    </span>
                  ))}
                  <span className="chip add">
                    <Icon name="plus" size={10} /> Add
                  </span>
                </div>
              </Field>
              <Field label="Backend">
                <div className="chip-group">
                  {spec.stack.backend.map((t) => (
                    <span key={t} className="chip on">
                      {t}
                      <Icon name="x" size={10} />
                    </span>
                  ))}
                  <span className="chip add">
                    <Icon name="plus" size={10} /> Add
                  </span>
                </div>
              </Field>
              <Field label="Data">
                <div className="chip-group">
                  {spec.stack.data.map((t) => (
                    <span key={t} className="chip on">
                      {t}
                      <Icon name="x" size={10} />
                    </span>
                  ))}
                  <span className="chip add">
                    <Icon name="plus" size={10} /> Add
                  </span>
                </div>
              </Field>
              <Field label="Infra">
                <div className="chip-group">
                  {spec.stack.infra.map((t) => (
                    <span key={t} className="chip on">
                      {t}
                      <Icon name="x" size={10} />
                    </span>
                  ))}
                  <span className="chip add">
                    <Icon name="plus" size={10} /> Add
                  </span>
                </div>
              </Field>
            </SpecSection>

            <SpecSection title="Features" count={featureCount}>
              <ListEditor
                items={spec.features}
                onChange={(items) => setSpec((p) => ({ ...p, features: items }))}
                renderItem={(it, set) => (
                  <>
                    <input value={it.title} onChange={(e) => set({ title: e.target.value })} />
                    <span className="meta" style={{ marginLeft: 0 }}>
                      {it.priority}
                    </span>
                  </>
                )}
                addLabel="Add feature"
              />
            </SpecSection>

            <SpecSection title="Data models" count={modelCount}>
              <ListEditor
                items={spec.models}
                onChange={(items) => setSpec((p) => ({ ...p, models: items }))}
                renderItem={(it, set) => (
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
                    <input
                      value={it.name}
                      onChange={(e) => set({ name: e.target.value })}
                      style={{ fontWeight: 500 }}
                    />
                    <input
                      value={it.fields}
                      onChange={(e) => set({ fields: e.target.value })}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--ink-2)",
                      }}
                    />
                  </div>
                )}
                addLabel="Add model"
              />
            </SpecSection>

            <SpecSection title="API endpoints" count={endpointCount}>
              <ListEditor
                items={spec.endpoints}
                onChange={(items) => setSpec((p) => ({ ...p, endpoints: items }))}
                renderItem={(it, set) => (
                  <>
                    <span className={"method " + it.method.toLowerCase()}>{it.method}</span>
                    <input
                      value={it.path}
                      onChange={(e) => set({ path: e.target.value })}
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                    />
                  </>
                )}
                addLabel="Add endpoint"
              />
            </SpecSection>

            <SpecSection title="User stories" count={storyCount} defaultOpen={false}>
              <ListEditor
                items={spec.stories}
                onChange={(items) => setSpec((p) => ({ ...p, stories: items }))}
                renderItem={(it, set) => (
                  <input value={it.text} onChange={(e) => set({ text: e.target.value })} />
                )}
                addLabel="Add story"
              />
            </SpecSection>

            <SpecSection title="Constraints & non-goals" defaultOpen={false}>
              <Field label="Must-haves">
                <div className="chip-group">
                  {spec.constraints.musts.map((t) => (
                    <span key={t} className="chip on">
                      {t}
                    </span>
                  ))}
                  <span className="chip add">
                    <Icon name="plus" size={10} /> Add
                  </span>
                </div>
              </Field>
              <Field label="Non-goals">
                <div className="chip-group">
                  {spec.constraints.nonGoals.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                  <span className="chip add">
                    <Icon name="plus" size={10} /> Add
                  </span>
                </div>
              </Field>
            </SpecSection>

            <SpecSection title="Conventions" defaultOpen={false}>
              <Field label="Code style">
                <textarea
                  className="field-area"
                  rows={2}
                  value={spec.conventions.style}
                  onChange={(e) => update("conventions", { style: e.target.value })}
                />
              </Field>
              <Field label="Naming">
                <textarea
                  className="field-area"
                  rows={2}
                  value={spec.conventions.naming}
                  onChange={(e) => update("conventions", { naming: e.target.value })}
                />
              </Field>
              <Field label="Testing">
                <textarea
                  className="field-area"
                  rows={2}
                  value={spec.conventions.testing}
                  onChange={(e) => update("conventions", { testing: e.target.value })}
                />
              </Field>
            </SpecSection>

            <SpecSection title="Deployment" defaultOpen={false}>
              <Field label="Environments">
                <div className="chip-group">
                  {spec.deploy.envs.map((t) => (
                    <span key={t} className="chip on">
                      {t}
                    </span>
                  ))}
                </div>
              </Field>
              <Field label="Notes">
                <textarea
                  className="field-area"
                  rows={2}
                  value={spec.deploy.notes}
                  onChange={(e) => update("deploy", { notes: e.target.value })}
                />
              </Field>
            </SpecSection>
          </>
        )}

        {tab === "diagram" && (
          <>
            <SpecSection title="Diagram type">
              <div className="chip-group">
                {DIAGRAM_TYPES.map((d) => (
                  <span
                    key={d.id}
                    className={"chip" + (diagramType === d.id ? " on" : "")}
                    onClick={() => setDiagramType(d.id)}
                  >
                    <Icon name={d.icon} size={12} />
                    {d.label}
                  </span>
                ))}
              </div>
            </SpecSection>

            <SpecSection title={selectedNode ? "Node properties" : "Selection"}>
              {selectedNode ? (
                <>
                  <Field label="Label">
                    <input
                      className="field-input"
                      value={selectedNode.label}
                      onChange={(e) => updateNode({ label: e.target.value })}
                    />
                  </Field>
                  <Field label="Subtitle / detail">
                    <input
                      className="field-input"
                      value={selectedNode.sub || ""}
                      onChange={(e) => updateNode({ sub: e.target.value })}
                      placeholder="e.g. Postgres · users, logs"
                    />
                  </Field>
                  <Field label="Type, shape & color">
                    <div className="chip-group" style={{ flexWrap: "wrap", gap: 6 }}>
                      {Object.keys(NODE_TYPES).map((t) => {
                        const meta = NODE_TYPES[t];
                        const on = selectedNode.type === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            className={"chip" + (on ? " on" : "")}
                            onClick={() => updateNode({ type: t })}
                            title={`Style as ${t}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 8px",
                              borderRadius: 6,
                              cursor: "pointer",
                              border: on ? `1.5px solid ${meta.color}` : "1px solid var(--line)",
                              background: on ? "var(--bg-2)" : "transparent",
                              color: "var(--ink-1)",
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 3,
                                background: meta.color,
                                flexShrink: 0,
                              }}
                            />
                            <Icon name={meta.icon} size={11} />
                            <span style={{ fontSize: 11.5 }}>{t}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Position">
                    <div className="row" style={{ gap: 6 }}>
                      <input
                        className="field-input field-mono"
                        style={{ flex: 1 }}
                        type="number"
                        value={Math.round(selectedNode.x)}
                        onChange={(e) => updateNode({ x: parseFloat(e.target.value) || 0 })}
                      />
                      <input
                        className="field-input field-mono"
                        style={{ flex: 1 }}
                        type="number"
                        value={Math.round(selectedNode.y)}
                        onChange={(e) => updateNode({ y: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </Field>
                </>
              ) : (
                <div
                  style={{
                    background: "var(--bg-0)",
                    border: "1px dashed var(--line)",
                    borderRadius: 6,
                    padding: 14,
                    fontSize: 12.5,
                    color: "var(--ink-3)",
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                >
                  Select a node on the canvas to edit its properties.
                  <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    <kbd className="kbd-inline">N</kbd> add &nbsp;
                    <kbd className="kbd-inline">⌫</kbd> delete &nbsp;
                    <kbd className="kbd-inline">⌘D</kbd> duplicate
                  </div>
                </div>
              )}
            </SpecSection>

            <SpecSection title="Layout">
              <Field label="Auto layout">
                <div className="row">
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      const evt = new CustomEvent("__architect:autolayout");
                      window.dispatchEvent(evt);
                    }}
                  >
                    <Icon name="refresh" size={12} /> Re-arrange
                  </button>
                  <button className="btn btn-sm btn-ghost">
                    <Icon name="grid" size={12} /> Snap to grid
                  </button>
                </div>
              </Field>
            </SpecSection>

            <SpecSection title="Keyboard shortcuts" defaultOpen={false}>
              <div className="kbd-list">
                {[
                  ["V", "Select tool"],
                  ["H / Space", "Pan tool"],
                  ["N", "Add node"],
                  ["⌘ + click", "Multi-select"],
                  ["Drag bg", "Marquee select"],
                  ["⌘ A", "Select all"],
                  ["⌘ D", "Duplicate"],
                  ["⌫", "Delete selection"],
                  ["⌘ + scroll", "Zoom"],
                  ["Double-click", "Edit label"],
                ].map(([k, v]) => (
                  <div key={k} className="kbd-row">
                    <kbd className="kbd-inline">{k}</kbd>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </SpecSection>
          </>
        )}

        {tab === "ai" && (
          <AIAssistant
            spec={spec}
            nodes={nodes}
            edges={edges || []}
            diagramType={diagramType}
            onPatchSpec={(patch) => setSpec((p) => ({ ...p, ...patch }))}
          />
        )}
      </div>
    </aside>
  );
}

function Editor({
  openExport: _openExport,
  openHistory,
  openDesign,
  openHandoff,
  openCodeChat,
  showGrid = true,
  spec,
  setSpec,
  nodes,
  setNodes,
  edges,
  setEdges,
  diagramType,
  setDiagramType,
}) {
  const [tool, setTool] = useState("select");
  const [selected, setSelected] = useState({ nodes: [], edges: [] });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tab, setTab] = useState("spec"); // spec | diagram | ai — lifted from SpecPanel

  const specPanelCollapsed = useSettingsStore((s) => s.specPanelCollapsed);
  const updateSettings = useSettingsStore((s) => s.update);
  const toggleSpecPanel = () => updateSettings({ specPanelCollapsed: !specPanelCollapsed });

  // When the user selects a node (or edge), automatically open the spec panel
  // and switch to the Diagram tab so the customization UI is right there.
  useEffect(() => {
    const hasSelection = selected.nodes.length >= 1 || selected.edges.length >= 1;
    if (!hasSelection) return;
    if (specPanelCollapsed) {
      updateSettings({ specPanelCollapsed: false });
    }
    if (tab !== "diagram") setTab("diagram");
    // Intentionally not depending on tab/specPanelCollapsed/updateSettings — we
    // only want the auto-open behavior when the selection itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.nodes.join(","), selected.edges.join(",")]);

  return (
    <div
      className="editor"
      style={{
        position: "relative",
        // Collapse the third grid column when the spec panel is hidden so the
        // canvas takes the full remaining width.
        gridTemplateColumns: specPanelCollapsed ? "56px 1fr" : undefined,
      }}
    >
      <ToolRail
        tool={tool}
        setTool={setTool}
        diagramType={diagramType}
        setDiagramType={setDiagramType}
        openHistory={openHistory}
        openDesign={openDesign}
        openHandoff={openHandoff}
        openCodeChat={openCodeChat}
      />

      {/* Right-edge handle — visible only when the panel is collapsed.
          Vertically centered so it doesn't collide with canvas-info (top-right)
          or canvas-mini (bottom-right). */}
      {specPanelCollapsed && (
        <button
          type="button"
          onClick={toggleSpecPanel}
          title="Open Spec / Diagram / AI panel"
          aria-label="Open spec panel"
          style={{
            position: "absolute",
            top: "50%",
            right: 0,
            transform: "translateY(-50%)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: 22,
            height: 96,
            padding: 0,
            borderRadius: "8px 0 0 8px",
            border: "1px solid var(--line)",
            borderRight: "none",
            background: "var(--bg-1)",
            color: "var(--ink-2)",
            cursor: "pointer",
            boxShadow: "0 8px 22px -10px rgba(0,0,0,0.55)",
          }}
        >
          <Icon name="chevL" size={11} />
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 9.5,
              letterSpacing: 0.06,
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            Spec
          </span>
        </button>
      )}
      <CanvasArea
        diagramType={diagramType}
        nodes={nodes}
        setNodes={setNodes}
        edges={edges}
        setEdges={setEdges}
        selected={selected}
        setSelected={setSelected}
        showGrid={showGrid}
        tool={tool}
        setTool={setTool}
        zoom={zoom}
        setZoom={setZoom}
        pan={pan}
        setPan={setPan}
      />
      <SpecPanel
        spec={spec}
        setSpec={setSpec}
        diagramType={diagramType}
        setDiagramType={setDiagramType}
        selected={selected}
        nodes={nodes}
        setNodes={setNodes}
        edges={edges}
        collapsed={specPanelCollapsed}
        onToggle={toggleSpecPanel}
        tab={tab}
        setTab={setTab}
      />
    </div>
  );
}

export { Editor };
