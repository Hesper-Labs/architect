import { useState } from "react";
import { Icon } from "../../data/icons.jsx";
import { useHistoryStore } from "../../store/history.js";
import { dialogs } from "../../store/dialogs.js";

function formatRelative(ts) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleString();
}

function summarize(content) {
  if (!content) return { summary: "—", counts: { features: 0, models: 0, endpoints: 0, nodes: 0 } };
  const spec = content.spec ?? {};
  return {
    summary: spec.overview?.name ?? "Untitled",
    counts: {
      features: spec.features?.length ?? 0,
      models: spec.models?.length ?? 0,
      endpoints: spec.endpoints?.length ?? 0,
      nodes: content.nodes?.length ?? 0,
    },
  };
}

function diffCounts(a, b) {
  if (!a || !b) return null;
  const ax = summarize(a).counts;
  const bx = summarize(b).counts;
  const diff = (k) => bx[k] - ax[k];
  return {
    features: diff("features"),
    models: diff("models"),
    endpoints: diff("endpoints"),
    nodes: diff("nodes"),
  };
}

function EmptyHistory() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 24px",
        color: "var(--ink-3)",
        flex: 1,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "var(--bg-2)",
          color: "var(--ink-2)",
          display: "grid",
          placeItems: "center",
          marginBottom: 14,
        }}
      >
        <Icon name="git" size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-1)", marginBottom: 6 }}>
        No snapshots yet
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, maxWidth: 360 }}>
        Snapshots are captured automatically a few seconds after each edit. Make a change to your
        spec or canvas and one will appear here.
      </div>
    </div>
  );
}

function HistoryView({ onClose, projectId, projectName, onRestore }) {
  const snapshots = useHistoryStore((s) => s.get(projectId));
  const clearProject = useHistoryStore((s) => s.clear);
  const [selectedId, setSelectedId] = useState(snapshots[snapshots.length - 1]?.id ?? null);

  const ordered = [...snapshots].reverse(); // newest first
  const selected = ordered.find((s) => s.id === selectedId) ?? ordered[0] ?? null;

  const handleRestore = async (snap) => {
    const ok = await dialogs.confirm({
      title: "Restore this snapshot?",
      message:
        "Your current spec, canvas, and diagram type will be replaced. The current state stays in history so you can step back if needed.",
      confirmLabel: "Restore",
      cancelLabel: "Cancel",
    });
    if (ok && onRestore) {
      onRestore(snap.content);
      onClose();
    }
  };

  const handleClear = async () => {
    const ok = await dialogs.confirm({
      title: "Clear all snapshots?",
      message: "This removes the in-memory history for this project.",
      confirmLabel: "Clear",
      danger: true,
    });
    if (ok) clearProject(projectId);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        <div className="modal-head">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--bg-2)",
              display: "grid",
              placeItems: "center",
              color: "var(--ink-1)",
            }}
          >
            <Icon name="git" size={14} />
          </div>
          <div>
            <h2 id="history-modal-title">History — {projectName || "this project"}</h2>
            <div className="sub">
              {snapshots.length} {snapshots.length === 1 ? "snapshot" : "snapshots"} · session-only
              · capped at 25
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {snapshots.length > 0 && (
            <button className="btn btn-sm btn-ghost" onClick={handleClear}>
              <Icon name="trash" size={11} /> Clear
            </button>
          )}
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        {snapshots.length === 0 ? (
          <EmptyHistory />
        ) : (
          <div className="hist-body">
            <aside className="hist-list">
              {ordered.map((snap, i) => {
                const next = ordered[i - 1] ?? null; // newer one above
                const counts = summarize(snap.content).counts;
                const delta = next ? diffCounts(snap.content, next.content) : null;
                const isCurrent = i === 0;
                return (
                  <div
                    key={snap.id}
                    className={
                      "hist-item" +
                      (selectedId === snap.id ? " active" : "") +
                      (isCurrent ? "" : "")
                    }
                    onClick={() => setSelectedId(snap.id)}
                  >
                    <div className="hist-graph">
                      <div className={"hist-dot " + (isCurrent ? "current" : "")}></div>
                      {i < ordered.length - 1 && <div className="hist-line"></div>}
                    </div>
                    <div className="hist-meta">
                      <div className="hist-row">
                        <span className="hist-label">{formatRelative(snap.ts)}</span>
                        {isCurrent && <span className="hist-tag current">latest</span>}
                      </div>
                      <div className="hist-msg">
                        {counts.features}f · {counts.models}m · {counts.endpoints}ep ·{" "}
                        {counts.nodes}n
                      </div>
                      <div className="hist-foot">
                        <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                          {new Date(snap.ts).toLocaleTimeString()}
                        </span>
                        {delta && (
                          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                            {delta.features !== 0 && (
                              <span className={delta.features > 0 ? "diff-add" : "diff-rem"}>
                                {delta.features > 0 ? `+${delta.features}` : delta.features}f
                              </span>
                            )}
                            {delta.nodes !== 0 && (
                              <span className={delta.nodes > 0 ? "diff-add" : "diff-rem"}>
                                {delta.nodes > 0 ? `+${delta.nodes}` : delta.nodes}n
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </aside>

            <div className="hist-diff">
              <div className="diff-head">
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {selected ? `Snapshot from ${formatRelative(selected.ts)}` : "Pick a snapshot"}
                  </div>
                  {selected && (
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                      {new Date(selected.ts).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                {selected && ordered[0]?.id !== selected.id && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleRestore(selected)}
                  >
                    <Icon name="refresh" size={11} /> Restore this version
                  </button>
                )}
              </div>
              <div className="diff-body" style={{ padding: 16, fontSize: 12.5 }}>
                {selected ? (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {selected.content?.spec?.overview?.name ?? "Untitled"}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      {[
                        ["Features", selected.content?.spec?.features?.length ?? 0],
                        ["Data models", selected.content?.spec?.models?.length ?? 0],
                        ["Endpoints", selected.content?.spec?.endpoints?.length ?? 0],
                        ["Stories", selected.content?.spec?.stories?.length ?? 0],
                        ["Canvas nodes", selected.content?.nodes?.length ?? 0],
                        ["Canvas edges", selected.content?.edges?.length ?? 0],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: 6,
                            background: "var(--bg-1)",
                            border: "1px solid var(--line)",
                          }}
                        >
                          <span style={{ color: "var(--ink-3)" }}>{label}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-3)",
                        padding: 12,
                        borderRadius: 6,
                        border: "1px dashed var(--line)",
                        lineHeight: 1.55,
                      }}
                    >
                      Restoring this snapshot replaces your current spec, canvas, and diagram type.
                      The current state is added to history first so you can step back.
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--ink-3)" }}>No snapshot selected.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { HistoryView };
