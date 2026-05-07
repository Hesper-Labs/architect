import React from "react";
import { Icon } from "../../data/icons.jsx";
import { useProjectsStore } from "../../store/projects.js";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "editor", label: "Editor", icon: "canvas" },
  { id: "templates", label: "Templates", icon: "template" },
  { id: "preview", label: "Preview & Export", icon: "eye" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const RECENT_LIMIT = 4;

function Sidebar({ active, setActive, openProject, mobileOpen }) {
  const projects = useProjectsStore((s) => s.projects);
  const recent = [...projects]
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, RECENT_LIMIT);

  return (
    <aside
      className={"sidebar" + (mobileOpen ? " mobile-open" : "")}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Decorative watermark logo — sits behind everything else */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -34,
          left: -28,
          width: 220,
          height: 220,
          opacity: 0.06,
          pointerEvents: "none",
          objectFit: "cover",
          filter: "saturate(0.6)",
          zIndex: 0,
          userSelect: "none",
        }}
      />

      <div className="sidebar-brand" style={{ position: "relative", zIndex: 1 }}>
        <div>
          <div className="brand-name">Architect</div>
          <div className="brand-meta">by Hesper Labs · v0.5</div>
        </div>
      </div>

      <div className="nav-section" style={{ position: "relative", zIndex: 1 }}>
        Workspace
      </div>
      <div className="nav-list" style={{ position: "relative", zIndex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={"nav-item" + (active === item.id ? " active" : "")}
            onClick={() => setActive(item.id)}
          >
            <span className="nav-ico">
              <Icon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <div className="nav-section" style={{ position: "relative", zIndex: 1 }}>
            Recent
          </div>
          <div className="nav-list" style={{ position: "relative", zIndex: 1 }}>
            {recent.map((p) => (
              <button
                key={p.id}
                className="nav-item"
                onClick={() => {
                  openProject(p.id);
                  setActive("editor");
                }}
              >
                <span className="nav-ico">
                  <Icon name="folder" size={15} />
                </span>
                <span style={{ fontSize: 13 }}>{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

function Topbar({ active, projectName, openExport, openPalette, openMobileNav }) {
  const labels = {
    dashboard: ["Workspace", "Dashboard"],
    editor: ["Workspace", projectName || "Untitled", "Editor"],
    templates: ["Workspace", "Templates"],
    preview: ["Workspace", projectName || "Untitled", "Preview"],
    settings: ["Workspace", "Settings"],
  };
  const crumbs = labels[active] || ["Workspace"];

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-mobile-nav"
        onClick={openMobileNav}
        aria-label="Open navigation"
      >
        <Icon name="grid" size={16} />
      </button>
      <div className="topbar-traffic">
        <span className="tl tl-r"></span>
        <span className="tl tl-y"></span>
        <span className="tl tl-g"></span>
      </div>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="crumb-sep">
                <Icon name="chevR" size={12} />
              </span>
            )}
            <span className={i === crumbs.length - 1 ? "crumb-current" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="topbar-spacer" />

      <button
        className="cmd-pill"
        onClick={openPalette}
        title="Open command palette (⌘K)"
        aria-label="Open command palette"
      >
        <Icon name="search" size={14} />
        <span>Search commands & projects…</span>
        <span className="kbd">⌘K</span>
      </button>

      {active === "editor" && (
        <>
          <span className="sep"></span>
          <button className="btn btn-primary btn-sm" onClick={openExport}>
            <Icon name="sparkles" size={13} />
            <span>Export to AI</span>
          </button>
        </>
      )}
    </header>
  );
}

export { Sidebar, Topbar };
