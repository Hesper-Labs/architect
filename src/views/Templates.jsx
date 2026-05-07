import { useState } from "react";
import { Icon } from "../data/icons.jsx";
import { SAMPLE_TEMPLATES } from "../data/demo-project.js";

const TplThumb = ({ seed }) => {
  const variants = [
    <svg viewBox="0 0 280 150" key="0">
      <rect
        x="20"
        y="20"
        width="240"
        height="36"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="20"
        y="66"
        width="115"
        height="64"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--accent-line)"
      />
      <rect
        x="145"
        y="66"
        width="115"
        height="64"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <circle cx="40" cy="38" r="4" fill="var(--accent)" />
      <rect x="55" y="35" width="100" height="6" rx="2" fill="var(--ink-3)" opacity="0.4" />
    </svg>,
    <svg viewBox="0 0 280 150" key="1">
      <rect
        x="20"
        y="30"
        width="60"
        height="90"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--accent-line)"
      />
      <rect
        x="100"
        y="30"
        width="160"
        height="40"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="100"
        y="80"
        width="75"
        height="40"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="185"
        y="80"
        width="75"
        height="40"
        rx="6"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
    </svg>,
    <svg viewBox="0 0 280 150" key="2">
      <circle cx="140" cy="75" r="32" fill="var(--bg-2)" stroke="var(--accent)" />
      <circle cx="50" cy="40" r="14" fill="var(--bg-2)" stroke="var(--line-strong)" />
      <circle cx="50" cy="110" r="14" fill="var(--bg-2)" stroke="var(--line-strong)" />
      <circle cx="230" cy="40" r="14" fill="var(--bg-2)" stroke="var(--line-strong)" />
      <circle cx="230" cy="110" r="14" fill="var(--bg-2)" stroke="var(--line-strong)" />
      <path
        d="M64 40 L108 70 M64 110 L108 80 M216 40 L172 70 M216 110 L172 80"
        stroke="var(--ink-3)"
        strokeWidth="1"
        fill="none"
      />
    </svg>,
    <svg viewBox="0 0 280 150" key="3">
      <rect
        x="20"
        y="20"
        width="240"
        height="22"
        rx="4"
        fill="var(--bg-2)"
        stroke="var(--accent-line)"
      />
      <rect
        x="20"
        y="50"
        width="240"
        height="22"
        rx="4"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="20"
        y="80"
        width="240"
        height="22"
        rx="4"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="20"
        y="110"
        width="240"
        height="22"
        rx="4"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
    </svg>,
  ];
  return variants[seed % variants.length];
};

function Templates({ onUse }) {
  const [filter, setFilter] = useState("All");
  const cats = ["All", "Web", "Mobile", "AI", "Backend", "Tools"];
  const items =
    filter === "All" ? SAMPLE_TEMPLATES : SAMPLE_TEMPLATES.filter((t) => t.category === filter);

  return (
    <div className="scroll">
      <div className="tpl-page">
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 32,
              fontWeight: 400,
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
            }}
          >
            Templates
          </h1>
          <p style={{ color: "var(--ink-2)", margin: 0, fontSize: 14.5 }}>
            Pre-built architectures with diagrams + spec scaffolding. Fork and customize.
          </p>
        </div>

        <div className="tpl-filters">
          {cats.map((c) => (
            <button
              key={c}
              className={"chip" + (filter === c ? " on" : "")}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm btn-ghost">
            <Icon name="plus" size={12} /> Submit template
          </button>
        </div>

        <div className="tpl-grid">
          {items.map((t, i) => (
            <div key={t.id} className="tpl-card" onClick={() => onUse(t.id)}>
              <div className="tpl-thumb">
                <TplThumb seed={i} />
              </div>
              <div className="tpl-meta">
                <div className="tpl-name">{t.name}</div>
                <div className="tpl-desc">{t.desc}</div>
                <div className="tpl-tags">
                  {t.tags.map((tag) => (
                    <span key={tag} className="tpl-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Templates };
