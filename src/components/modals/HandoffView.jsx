import React, { useState } from "react";
import { Icon } from "../../data/icons.jsx";
import { dialogs } from "../../store/dialogs.js";

// ============== Helpers ==============
function ensureHandoff(spec) {
  return spec?.handoff ?? { adrs: [], risks: [] };
}

const ADR_STATUSES = ["proposed", "accepted", "rejected", "deprecated"];
const RISK_STATUSES = ["mitigating", "monitoring", "accepted", "closed"];

// ============== ADR card ==============
function ADRCard({ adr, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="adr-card">
      <div
        className="adr-head"
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: "pointer" }}
      >
        <span className="adr-id">{adr.id}</span>
        <span className={"adr-status status-" + adr.status}>{adr.status}</span>
        <div className="adr-title">{adr.title || "(untitled decision)"}</div>
        <span className="adr-meta">{new Date(adr.date).toLocaleDateString()}</span>
        <Icon name={expanded ? "chevD" : "chevR"} size={12} />
      </div>
      {expanded && (
        <div className="adr-body" onClick={(e) => e.stopPropagation()}>
          <div className="adr-block">
            <div className="adr-label">Title</div>
            <input
              className="field-input"
              value={adr.title}
              onChange={(e) => onUpdate({ ...adr, title: e.target.value })}
            />
          </div>
          <div className="adr-block">
            <div className="adr-label">Status</div>
            <div className="chip-group">
              {ADR_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={"chip" + (adr.status === s ? " on" : "")}
                  onClick={() => onUpdate({ ...adr, status: s })}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="adr-block">
            <div className="adr-label">Context</div>
            <textarea
              className="field-area"
              rows={3}
              value={adr.context}
              onChange={(e) => onUpdate({ ...adr, context: e.target.value })}
              placeholder="What problem are we solving? What constraints apply?"
            />
          </div>
          <div className="adr-block">
            <div className="adr-label">Decision</div>
            <textarea
              className="field-area"
              rows={3}
              value={adr.decision}
              onChange={(e) => onUpdate({ ...adr, decision: e.target.value })}
              placeholder="What did we decide to do?"
            />
          </div>
          <div className="adr-block">
            <div className="adr-label">Consequences</div>
            <textarea
              className="field-area"
              rows={3}
              value={adr.consequences}
              onChange={(e) => onUpdate({ ...adr, consequences: e.target.value })}
              placeholder="What are the trade-offs? Positives, negatives, follow-ups."
            />
          </div>
          <div className="adr-block">
            <div className="adr-label">Alternatives considered</div>
            <textarea
              className="field-area"
              rows={2}
              value={adr.alternatives}
              onChange={(e) => onUpdate({ ...adr, alternatives: e.target.value })}
              placeholder="What else did we evaluate? Why did we reject those?"
            />
          </div>
          <div className="adr-foot" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Deciders:</span>
            <input
              className="field-input"
              style={{ flex: 1, maxWidth: 280 }}
              value={adr.deciders}
              onChange={(e) => onUpdate({ ...adr, deciders: e.target.value })}
              placeholder="Who approved this?"
            />
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onDelete(adr.id)}>
              <Icon name="trash" size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== Risk row ==============
function RiskRow({ risk, onUpdate, onDelete }) {
  const severity = risk.likelihood * risk.impact;
  const tier = severity >= 15 ? "high" : severity >= 8 ? "med" : "low";
  return (
    <div className="risk-row">
      <div className="risk-id">{risk.id}</div>
      <div className="risk-title">
        <input
          className="field-input"
          value={risk.title}
          onChange={(e) => onUpdate({ ...risk, title: e.target.value })}
          placeholder="What could go wrong?"
        />
      </div>
      <div className="risk-num">
        <select
          className="field-select"
          value={risk.likelihood}
          onChange={(e) => onUpdate({ ...risk, likelihood: parseInt(e.target.value, 10) })}
          style={{ width: 60 }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="risk-num">
        <select
          className="field-select"
          value={risk.impact}
          onChange={(e) => onUpdate({ ...risk, impact: parseInt(e.target.value, 10) })}
          style={{ width: 60 }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className={"risk-sev tier-" + tier}>{severity}</span>
      </div>
      <div className="risk-owner">
        <input
          className="field-input"
          value={risk.owner}
          onChange={(e) => onUpdate({ ...risk, owner: e.target.value })}
          placeholder="Owner"
        />
      </div>
      <div>
        <select
          className="field-select"
          value={risk.status}
          onChange={(e) => onUpdate({ ...risk, status: e.target.value })}
          style={{ width: 130 }}
        >
          {RISK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="risk-mit">
        <input
          className="field-input"
          value={risk.mit}
          onChange={(e) => onUpdate({ ...risk, mit: e.target.value })}
          placeholder="Mitigation"
        />
      </div>
      <button
        type="button"
        className="icon-btn-xs"
        onClick={() => onDelete(risk.id)}
        title="Delete risk"
      >
        <Icon name="trash" size={11} />
      </button>
    </div>
  );
}

// ============== Empty state ==============
function EmptyState({ icon, title, body, ctaLabel, onCta }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "var(--bg-1)",
        border: "1px dashed var(--line)",
        borderRadius: 12,
        margin: "20px 0",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "var(--accent-soft)",
          color: "var(--accent-ink)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 14px",
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <div style={{ fontSize: 16, fontFamily: "var(--font-serif)", marginBottom: 6 }}>{title}</div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink-3)",
          marginBottom: 14,
          maxWidth: 460,
          margin: "0 auto 18px",
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>
      {onCta && (
        <button type="button" className="btn btn-primary" onClick={onCta}>
          <Icon name="plus" size={13} /> {ctaLabel}
        </button>
      )}
    </div>
  );
}

// ============== Main ==============
function HandoffView({ onClose, spec, setSpec }) {
  const [tab, setTab] = useState("adr");

  const handoff = ensureHandoff(spec);
  const adrs = handoff.adrs ?? [];
  const risks = handoff.risks ?? [];

  const updateHandoff = (patch) => {
    setSpec((prev) => ({
      ...prev,
      handoff: { adrs: [], risks: [], ...(prev?.handoff ?? {}), ...patch },
    }));
  };

  const addAdr = () => {
    const id = `ADR-${String(adrs.length + 1).padStart(3, "0")}`;
    const newAdr = {
      id,
      title: "New decision",
      status: "proposed",
      date: Date.now(),
      deciders: "",
      context: "",
      decision: "",
      consequences: "",
      alternatives: "",
    };
    updateHandoff({ adrs: [...adrs, newAdr] });
  };

  const updateAdr = (next) => {
    updateHandoff({ adrs: adrs.map((a) => (a.id === next.id ? next : a)) });
  };

  const deleteAdr = async (id) => {
    const ok = await dialogs.confirm({
      title: "Delete this ADR?",
      message: "Architecture decision records are typically kept for history. Delete anyway?",
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) updateHandoff({ adrs: adrs.filter((a) => a.id !== id) });
  };

  const addRisk = () => {
    const id = `R-${String(risks.length + 1).padStart(2, "0")}`;
    const newRisk = {
      id,
      title: "New risk",
      likelihood: 3,
      impact: 3,
      owner: "",
      status: "monitoring",
      mit: "",
    };
    updateHandoff({ risks: [...risks, newRisk] });
  };

  const updateRisk = (next) => {
    updateHandoff({ risks: risks.map((r) => (r.id === next.id ? next : r)) });
  };

  const deleteRisk = (id) => {
    updateHandoff({ risks: risks.filter((r) => r.id !== id) });
  };

  const adrCounts = {
    accepted: adrs.filter((a) => a.status === "accepted").length,
    proposed: adrs.filter((a) => a.status === "proposed").length,
    rejected: adrs.filter((a) => a.status === "rejected").length,
    deprecated: adrs.filter((a) => a.status === "deprecated").length,
  };

  const riskCounts = {
    high: risks.filter((r) => r.likelihood * r.impact >= 15).length,
    med: risks.filter((r) => {
      const s = r.likelihood * r.impact;
      return s >= 8 && s < 15;
    }).length,
    low: risks.filter((r) => r.likelihood * r.impact < 8).length,
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-fs"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Handoff package"
      >
        <div className="modal-head">
          <div>
            <div className="modal-title">Handoff package</div>
            <div className="modal-sub">
              Architecture decision records and risk register stored alongside your spec
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="dl-tabs">
          <button
            className={"dl-tab" + (tab === "adr" ? " active" : "")}
            onClick={() => setTab("adr")}
          >
            <Icon name="edit" size={13} />
            <span>Decision records</span>
            <span className="tab-count">{adrs.length}</span>
          </button>
          <button
            className={"dl-tab" + (tab === "risk" ? " active" : "")}
            onClick={() => setTab("risk")}
          >
            <Icon name="bolt" size={13} />
            <span>Risk register</span>
            <span className="tab-count">{risks.length}</span>
          </button>
        </div>

        <div className="dl-body">
          {tab === "adr" && (
            <div className="dl-content scroll" style={{ padding: 20 }}>
              {adrs.length === 0 ? (
                <EmptyState
                  icon="edit"
                  title="No architecture decisions yet"
                  body="Track meaningful technical decisions and the trade-offs behind them. ADRs help future contributors (and AI agents) understand why your system looks the way it does."
                  ctaLabel="Add first ADR"
                  onCta={addAdr}
                />
              ) : (
                <>
                  <div className="adr-summary">
                    <div className="adr-stat">
                      <span className="adr-stat-num">{adrCounts.accepted}</span>
                      <span>Accepted</span>
                    </div>
                    <div className="adr-stat">
                      <span className="adr-stat-num">{adrCounts.proposed}</span>
                      <span>Proposed</span>
                    </div>
                    <div className="adr-stat">
                      <span className="adr-stat-num">{adrCounts.rejected}</span>
                      <span>Rejected</span>
                    </div>
                    <div className="adr-stat">
                      <span className="adr-stat-num">{adrCounts.deprecated}</span>
                      <span>Deprecated</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-sm btn-primary" onClick={addAdr}>
                      <Icon name="plus" size={12} /> New ADR
                    </button>
                  </div>
                  {adrs.map((a) => (
                    <ADRCard key={a.id} adr={a} onUpdate={updateAdr} onDelete={deleteAdr} />
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "risk" && (
            <div className="dl-content scroll" style={{ padding: 20 }}>
              {risks.length === 0 ? (
                <EmptyState
                  icon="bolt"
                  title="Risk register is empty"
                  body="Surface things that could derail the project. Score by likelihood × impact, name an owner, and pick a mitigation strategy. Reviewers can scan severity at a glance."
                  ctaLabel="Add first risk"
                  onCta={addRisk}
                />
              ) : (
                <>
                  <div
                    className="risk-stats"
                    style={{ display: "flex", gap: 24, marginBottom: 18, alignItems: "center" }}
                  >
                    <div className="risk-stat-row">
                      <span className="rs-dot tier-high"></span>
                      <span>High</span>
                      <span className="rs-num">{riskCounts.high}</span>
                    </div>
                    <div className="risk-stat-row">
                      <span className="rs-dot tier-med"></span>
                      <span>Medium</span>
                      <span className="rs-num">{riskCounts.med}</span>
                    </div>
                    <div className="risk-stat-row">
                      <span className="rs-dot tier-low"></span>
                      <span>Low</span>
                      <span className="rs-num">{riskCounts.low}</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-sm btn-primary" onClick={addRisk}>
                      <Icon name="plus" size={12} /> New risk
                    </button>
                  </div>
                  <div className="risk-table">
                    <div className="risk-thead">
                      <div>ID</div>
                      <div>Risk</div>
                      <div>Lik</div>
                      <div>Imp</div>
                      <div>Sev</div>
                      <div>Owner</div>
                      <div>Status</div>
                      <div>Mitigation</div>
                      <div></div>
                    </div>
                    {risks.map((r) => (
                      <RiskRow key={r.id} risk={r} onUpdate={updateRisk} onDelete={deleteRisk} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { HandoffView };
