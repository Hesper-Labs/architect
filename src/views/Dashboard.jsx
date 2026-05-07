import { useRef, useState } from "react";
import { Icon } from "../data/icons.jsx";
import { useProjectsStore } from "../store/projects.js";
import { dialogs } from "../store/dialogs.js";
import { toast } from "../store/toasts.js";

// ============== Helpers ==============
function formatRelative(ts) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============== Schematic project thumbs (decorative) ==============
const ProjThumb = ({ seed = 0 }) => {
  const variants = [
    <svg viewBox="0 0 320 180" key="0">
      <rect width="320" height="180" fill="var(--bg-1)" />
      <rect
        x="32"
        y="64"
        width="64"
        height="40"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="128"
        y="48"
        width="64"
        height="32"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="128"
        y="92"
        width="64"
        height="32"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="224"
        y="64"
        width="64"
        height="40"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--accent-line)"
      />
      <path
        d="M96 76 L128 64 M96 92 L128 108 M192 64 L224 76 M192 108 L224 92"
        stroke="var(--ink-3)"
        strokeWidth="1"
        fill="none"
      />
    </svg>,
    <svg viewBox="0 0 320 180" key="1">
      <rect width="320" height="180" fill="var(--bg-1)" />
      <circle
        cx="160"
        cy="90"
        r="26"
        fill="var(--bg-2)"
        stroke="var(--accent-line)"
        strokeWidth="1.5"
      />
      {[
        [60, 40],
        [60, 140],
        [260, 40],
        [260, 140],
        [160, 30],
        [160, 150],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill="var(--bg-2)" stroke="var(--line-strong)" />
          <line x1={x} y1={y} x2="160" y2="90" stroke="var(--ink-4)" strokeWidth="1" />
        </g>
      ))}
    </svg>,
    <svg viewBox="0 0 320 180" key="2">
      <rect width="320" height="180" fill="var(--bg-1)" />
      {[20, 56, 92, 128].map((y, i) => (
        <g key={i}>
          <rect
            x="32"
            y={y}
            width="256"
            height="22"
            rx="2"
            fill="var(--bg-2)"
            stroke={i === 0 ? "var(--accent-line)" : "var(--line-strong)"}
          />
        </g>
      ))}
    </svg>,
    <svg viewBox="0 0 320 180" key="3">
      <rect width="320" height="180" fill="var(--bg-1)" />
      <path
        d="M20 140 L70 100 L120 120 L170 70 L220 90 L270 50 L300 70"
        stroke="var(--accent)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M20 140 L70 100 L120 120 L170 70 L220 90 L270 50 L300 70 L300 160 L20 160 Z"
        fill="var(--accent-soft)"
      />
    </svg>,
    <svg viewBox="0 0 320 180" key="4">
      <rect width="320" height="180" fill="var(--bg-1)" />
      <rect
        x="20"
        y="30"
        width="40"
        height="120"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="80"
        y="30"
        width="160"
        height="22"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--accent-line)"
      />
      <rect
        x="80"
        y="60"
        width="160"
        height="90"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
      <rect
        x="260"
        y="30"
        width="40"
        height="120"
        rx="2"
        fill="var(--bg-2)"
        stroke="var(--line-strong)"
      />
    </svg>,
  ];
  return variants[seed % variants.length];
};

// ============== Project card (grid) ==============
function ProjectCard({ project, index, onOpen, onMenuOpen, currentId }) {
  const isCurrent = project.id === currentId;
  return (
    <div
      className={"proj-card-pro" + (isCurrent ? " current" : "")}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(project.id);
      }}
    >
      <div className="proj-thumb-pro">
        <ProjThumb seed={index} />
      </div>
      <div className="proj-body">
        <div className="proj-top">
          <span className="proj-status-pill">
            <span
              className="dot-sm"
              style={{ background: project.isDemo ? "var(--ink-3)" : "var(--green)" }}
            />
            {project.isDemo ? "Demo" : "Active"}
          </span>
          <button
            className="icon-btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen(project.id, e.currentTarget);
            }}
            aria-label="Project actions"
          >
            <Icon name="grip" size={12} />
          </button>
        </div>
        <div className="proj-name-pro">{project.name}</div>
        <div className="proj-desc">{project.description || "No description"}</div>
        <div className="proj-foot">
          <div className="proj-tags-pro" />
          <div className="proj-meta-mono">{formatRelative(project.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

// ============== Project row (list) ==============
function ProjectRow({ project, index, onOpen, onMenuOpen, currentId }) {
  const isCurrent = project.id === currentId;
  return (
    <div className={"proj-row" + (isCurrent ? " current" : "")} onClick={() => onOpen(project.id)}>
      <div className="proj-row-thumb">
        <ProjThumb seed={index} />
      </div>
      <div className="proj-row-name">
        <div className="proj-name-pro" style={{ fontSize: 13.5 }}>
          {project.name}
        </div>
        <div className="proj-desc" style={{ fontSize: 11.5 }}>
          {project.description || "No description"}
        </div>
      </div>
      <div className="proj-row-status">
        <span
          className="dot-sm"
          style={{ background: project.isDemo ? "var(--ink-3)" : "var(--green)" }}
        />
        <span>{project.isDemo ? "Demo" : "Active"}</span>
      </div>
      <div className="proj-row-tags" />
      <div className="proj-row-progress" />
      <div className="proj-row-meta">{formatRelative(project.updatedAt)}</div>
      <button
        className="icon-btn-xs"
        onClick={(e) => {
          e.stopPropagation();
          onMenuOpen(project.id, e.currentTarget);
        }}
        aria-label="Project actions"
      >
        <Icon name="grip" size={12} />
      </button>
    </div>
  );
}

// ============== Action menu (rename / export / delete) ==============
function ActionMenu({ projectId, anchor, onClose, onRename, onExport, onDelete }) {
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={onClose} />
      <div
        className="ctx-menu"
        style={{
          position: "fixed",
          top: rect.bottom + 4,
          left: Math.max(8, rect.right - 180),
          zIndex: 51,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          boxShadow: "0 8px 24px -6px rgba(0,0,0,.5)",
          minWidth: 180,
          padding: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button className="ctx-menu-item" onClick={() => onRename(projectId)}>
          <Icon name="edit" size={12} /> <span>Rename</span>
        </button>
        <button className="ctx-menu-item" onClick={() => onExport(projectId)}>
          <Icon name="download" size={12} /> <span>Export as JSON</span>
        </button>
        <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
        <button
          className="ctx-menu-item"
          onClick={() => onDelete(projectId)}
          style={{ color: "var(--rose)" }}
        >
          <Icon name="trash" size={12} /> <span>Delete</span>
        </button>
      </div>
    </>
  );
}

// ============== Toolbar ==============
function Toolbar({
  tab,
  setTab,
  view,
  setView,
  sort,
  setSort,
  query,
  setQuery,
  onNew,
  onImport,
  counts,
}) {
  return (
    <div className="dash-toolbar">
      <div className="dash-tabs">
        {[
          { id: "all", label: "All", count: counts.all },
          { id: "recent", label: "Recent", count: counts.recent },
          { id: "demo", label: "Demo", count: counts.demo },
        ].map((t) => (
          <button
            key={t.id}
            className={"dash-tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="dash-toolbar-spacer" />
      <div className="search-wrap" style={{ width: 220 }}>
        <Icon name="search" size={13} />
        <input
          className="search-input"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="seg-control">
        <button
          className={"seg-btn" + (view === "grid" ? " active" : "")}
          onClick={() => setView("grid")}
          title="Grid"
        >
          <Icon name="grid" size={13} />
        </button>
        <button
          className={"seg-btn" + (view === "list" ? " active" : "")}
          onClick={() => setView("list")}
          title="List"
        >
          <Icon name="queue" size={13} />
        </button>
      </div>
      <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="updated">Modified</option>
        <option value="name">Name</option>
        <option value="created">Created</option>
      </select>
      <button className="btn btn-sm btn-ghost" onClick={onImport}>
        <Icon name="folder" size={12} /> Import
      </button>
      <button className="btn btn-sm btn-primary" onClick={onNew}>
        <Icon name="plus" size={12} /> New
      </button>
    </div>
  );
}

// ============== Empty state ==============
function EmptyState({ onNew, onImport }) {
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
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "var(--accent-soft)",
          color: "var(--accent-ink)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 16px",
        }}
      >
        <Icon name="folder" size={26} />
      </div>
      <div style={{ fontSize: 18, fontFamily: "var(--font-serif)", marginBottom: 6 }}>
        No projects yet
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          marginBottom: 18,
          maxWidth: 380,
          margin: "0 auto 18px",
        }}
      >
        Spin up a fresh spec or import an Architect project file you exported earlier.
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onNew}>
          <Icon name="plus" size={13} /> Create project
        </button>
        <button className="btn" onClick={onImport}>
          <Icon name="folder" size={13} /> Import JSON
        </button>
      </div>
    </div>
  );
}

// ============== Main Dashboard ==============
function Dashboard({ openProject, goEditor }) {
  const projects = useProjectsStore((s) => s.projects);
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const renameProject = useProjectsStore((s) => s.rename);
  const deleteProject = useProjectsStore((s) => s.delete);
  const exportProject = useProjectsStore((s) => s.exportProject);
  const importProject = useProjectsStore((s) => s.importProject);

  const [tab, setTab] = useState("all");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("updated");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState({ id: null, anchor: null });
  const fileInputRef = useRef(null);

  const onOpen = (id) => {
    openProject(id);
    goEditor();
  };

  const onNew = () => openProject("new");

  const onImport = () => fileInputRef.current?.click();

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can re-trigger
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const meta = await importProject(data);
      openProject(meta.id);
      goEditor();
      toast.success(`Imported "${meta.name}"`);
    } catch (err) {
      console.error("Import failed:", err);
      toast.error(`Import failed: ${err.message}`);
    }
  };

  const handleRename = async (id) => {
    setMenu({ id: null, anchor: null });
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const next = await dialogs.prompt({
      title: "Rename project",
      message: `Currently: "${project.name}"`,
      defaultValue: project.name,
      placeholder: "New name",
      confirmLabel: "Rename",
    });
    if (next && next.trim() && next.trim() !== project.name) {
      await renameProject(id, next.trim());
      toast.success(`Renamed to "${next.trim()}"`);
    }
  };

  const handleExport = async (id) => {
    setMenu({ id: null, anchor: null });
    const data = await exportProject(id);
    if (!data) return;
    const slug = data.project.name.toLowerCase().replace(/[^\w]+/g, "-");
    downloadJson(`${slug}.architect.json`, data);
    toast.success("Project exported");
  };

  const handleDelete = async (id) => {
    setMenu({ id: null, anchor: null });
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const ok = await dialogs.confirm({
      title: `Delete "${project.name}"?`,
      message:
        "This will permanently remove the project and all its content. This action can't be undone.",
      confirmLabel: "Delete project",
      cancelLabel: "Keep",
      danger: true,
    });
    if (ok) {
      await deleteProject(id);
      toast.success(`Deleted "${project.name}"`);
    }
  };

  // Filter + sort
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const counts = {
    all: projects.length,
    recent: projects.filter((p) => (p.updatedAt ?? 0) > recentCutoff).length,
    demo: projects.filter((p) => p.isDemo).length,
  };

  let filtered = projects;
  if (tab === "recent") filtered = filtered.filter((p) => (p.updatedAt ?? 0) > recentCutoff);
  if (tab === "demo") filtered = filtered.filter((p) => p.isDemo);
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
    );
  }

  filtered = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "created") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });

  return (
    <div className="dash-pro">
      <Toolbar
        tab={tab}
        setTab={setTab}
        view={view}
        setView={setView}
        sort={sort}
        setSort={setSort}
        query={query}
        setQuery={setQuery}
        onNew={onNew}
        onImport={onImport}
        counts={counts}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleFileImport}
      />

      <div className="dash-pro-body">
        <div className="dash-main scroll" style={{ width: "100%" }}>
          <div className="dash-path">
            <span>Workspace</span>
            <Icon name="chevR" size={11} />
            <span className="dash-path-current">
              {tab === "demo" ? "Demo projects" : tab === "recent" ? "Recent" : "All projects"}
            </span>
            <div className="dash-path-spacer" />
            <span className="dash-path-meta">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </span>
          </div>

          {filtered.length === 0 && projects.length === 0 ? (
            <EmptyState onNew={onNew} onImport={onImport} />
          ) : view === "grid" ? (
            <div className="proj-grid-pro">
              <div
                className="proj-card-pro new"
                role="button"
                tabIndex={0}
                onClick={onNew}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onNew();
                }}
              >
                <div className="proj-thumb-pro new-thumb">
                  <Icon name="plus" size={20} />
                </div>
                <div className="proj-body">
                  <div className="proj-name-pro">New project</div>
                  <div className="proj-desc">Start from a blank canvas.</div>
                </div>
              </div>
              {filtered.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  onOpen={onOpen}
                  onMenuOpen={(id, anchor) => setMenu({ id, anchor })}
                  currentId={currentProjectId}
                />
              ))}
            </div>
          ) : (
            <div className="proj-list">
              <div className="proj-list-head">
                <div />
                <div>Name</div>
                <div>Status</div>
                <div>Tags</div>
                <div>Progress</div>
                <div>Last modified</div>
                <div />
              </div>
              {filtered.map((p, i) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  index={i}
                  onOpen={onOpen}
                  onMenuOpen={(id, anchor) => setMenu({ id, anchor })}
                  currentId={currentProjectId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ActionMenu
        projectId={menu.id}
        anchor={menu.anchor}
        onClose={() => setMenu({ id: null, anchor: null })}
        onRename={handleRename}
        onExport={handleExport}
        onDelete={handleDelete}
      />
    </div>
  );
}

export { Dashboard };
