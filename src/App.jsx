import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Sidebar, Topbar } from "./components/shell/Shell.jsx";
import { Dashboard } from "./views/Dashboard.jsx";
import { Editor } from "./views/Editor.jsx";
import { Templates } from "./views/Templates.jsx";
import { Settings } from "./views/Settings.jsx";

// Modals are lazy-loaded — they only matter once the user opens them.
const PreviewModal = lazy(() =>
  import("./components/modals/PreviewModal.jsx").then((m) => ({ default: m.PreviewModal })),
);
const HistoryView = lazy(() =>
  import("./components/modals/HistoryView.jsx").then((m) => ({ default: m.HistoryView })),
);
const DesignLayer = lazy(() =>
  import("./components/modals/DesignLayer.jsx").then((m) => ({ default: m.DesignLayer })),
);
const HandoffView = lazy(() =>
  import("./components/modals/HandoffView.jsx").then((m) => ({ default: m.HandoffView })),
);
const WelcomeModal = lazy(() =>
  import("./components/modals/WelcomeModal.jsx").then((m) => ({ default: m.WelcomeModal })),
);
const NewProjectWizard = lazy(() =>
  import("./components/modals/NewProjectWizard.jsx").then((m) => ({ default: m.NewProjectWizard })),
);
const ClaudeCodeChat = lazy(() =>
  import("./components/chat/ClaudeCodeChat.jsx").then((m) => ({ default: m.ClaudeCodeChat })),
);
import { ToastStack } from "./components/ToastStack.jsx";
import { ConfirmDialog } from "./components/ConfirmDialog.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { toast } from "./store/toasts.js";
import { useHistoryStore } from "./store/history.js";
import { Icon } from "./data/icons.jsx";
import { TEMPLATE_PRESETS } from "./data/template-presets.js";
import {
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakToggle,
} from "./components/tweaks/TweaksPanel.jsx";
import { useProjectsStore } from "./store/projects.js";
import { useSettingsStore } from "./store/settings.js";
import { debounce } from "./utils/debounce.js";

const SAVE_DEBOUNCE_MS = 600;

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function App() {
  // UI state (transient — lives only for the session)
  const [active, setActive] = useState("dashboard");
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [codeChatOpen, setCodeChatOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [wizardTemplateId, setWizardTemplateId] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Project metadata + active id from the persistent store
  const projects = useProjectsStore((s) => s.projects);
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const projectsLoaded = useProjectsStore((s) => s.loaded);
  const loadProjects = useProjectsStore((s) => s.load);
  const openProjectInStore = useProjectsStore((s) => s.open);
  const createProject = useProjectsStore((s) => s.create);
  const getProjectContent = useProjectsStore((s) => s.getContent);
  const setProjectContent = useProjectsStore((s) => s.setContent);
  const importProject = useProjectsStore((s) => s.importProject);

  // Settings + tweaks from the persistent store
  const tweaks = useSettingsStore((s) => s.tweaks);
  const setTweak = useSettingsStore((s) => s.setTweak);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);
  const hasSeenWelcome = useSettingsStore((s) => s.hasSeenWelcome);
  const updateSettings = useSettingsStore((s) => s.update);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const pushSnapshot = useHistoryStore((s) => s.push);
  const loadHistory = useHistoryStore((s) => s.load);

  // Editor content for the active project. Loaded from storage when the
  // active id changes; auto-saved (debounced) when any of these change.
  const [spec, setSpec] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [diagramType, setDiagramType] = useState("system");
  const [contentLoaded, setContentLoaded] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;

  // Bootstrap stores once.
  useEffect(() => {
    loadProjects();
    loadSettings();
    loadHistory();
  }, [loadProjects, loadSettings, loadHistory]);

  // First-run welcome — opens once after settings hydrate, and only if the user
  // hasn't dismissed it before.
  useEffect(() => {
    if (settingsLoaded && !hasSeenWelcome) {
      setWelcomeOpen(true);
    }
  }, [settingsLoaded, hasSeenWelcome]);

  // Surface storage quota errors as a toast so users know to free space.
  useEffect(() => {
    const onQuota = () => {
      toast.error(
        "Browser storage is full. Export and delete old projects from the dashboard to free space.",
        { duration: 8000 },
      );
    };
    window.addEventListener("architect:quota-exceeded", onQuota);
    return () => window.removeEventListener("architect:quota-exceeded", onQuota);
  }, []);

  // When the active project changes, swap in its content.
  useEffect(() => {
    if (!projectsLoaded || !currentProjectId) return;
    let cancelled = false;
    setContentLoaded(false);
    getProjectContent(currentProjectId).then((content) => {
      if (cancelled) return;
      if (content) {
        setSpec(content.spec ?? null);
        setNodes(content.nodes ?? []);
        setEdges(content.edges ?? []);
        setDiagramType(content.diagramType ?? "system");
      }
      setContentLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [projectsLoaded, currentProjectId, getProjectContent]);

  // Debounced auto-save. Only triggers once content has finished loading.
  const debouncedSaveRef = useRef(null);
  useEffect(() => {
    debouncedSaveRef.current = debounce((id, content) => {
      setProjectContent(id, content);
    }, SAVE_DEBOUNCE_MS);
    return () => debouncedSaveRef.current?.cancel();
  }, [setProjectContent]);

  useEffect(() => {
    if (!contentLoaded || !currentProjectId || !spec) return;
    debouncedSaveRef.current?.(currentProjectId, { spec, nodes, edges, diagramType });
  }, [spec, nodes, edges, diagramType, currentProjectId, contentLoaded]);

  // Capture history snapshots ~8s after the last edit. Skips identical
  // back-to-back captures (same JSON shape).
  useEffect(() => {
    if (!contentLoaded || !currentProjectId || !spec) return;
    const t = setTimeout(() => {
      pushSnapshot(currentProjectId, { spec, nodes, edges, diagramType });
    }, 8000);
    return () => clearTimeout(t);
  }, [spec, nodes, edges, diagramType, currentProjectId, contentLoaded, pushSnapshot]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in inputs/textareas
      const tag = e.target?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
      if (isInput) return;

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (meta && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setExportOpen(true);
      } else if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (debouncedSaveRef.current?.flush) {
          debouncedSaveRef.current.flush();
        }
        toast.success("Saved");
      } else if (meta && e.key === "/") {
        e.preventDefault();
        setActive("dashboard");
      } else if (e.key === "Escape") {
        setExportOpen(false);
        setHistoryOpen(false);
        setDesignOpen(false);
        setHandoffOpen(false);
        setCodeChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Apply theme tokens to :root.
  useEffect(() => {
    if (!settingsLoaded) return;
    document.documentElement.setAttribute(
      "data-theme",
      tweaks.theme === "light" ? "light" : "dark",
    );
    document.documentElement.style.setProperty("--accent", tweaks.accent);
    const a = tweaks.accent;
    document.documentElement.style.setProperty("--accent-ink", a);
    document.documentElement.style.setProperty("--accent-soft", hexA(a, 0.14));
    document.documentElement.style.setProperty("--accent-line", hexA(a, 0.32));
  }, [tweaks.theme, tweaks.accent, settingsLoaded]);

  const handleExport = () => setExportOpen(true);
  const onCopy = () => toast.success("Copied to clipboard");

  const handleRestoreSnapshot = (content) => {
    if (!content) return;
    // Capture the current state first so the user can undo the restore.
    pushSnapshot(currentProjectId, { spec, nodes, edges, diagramType }, "before-restore");
    setSpec(content.spec ?? null);
    setNodes(content.nodes ?? []);
    setEdges(content.edges ?? []);
    setDiagramType(content.diagramType ?? "system");
    toast.success("Restored from snapshot");
  };

  const applyEdit = (tool) => {
    if (!tool || !tool.fields) return;
    switch (tool.name) {
      case "edit_spec": {
        const section = tool.fields.section;
        try {
          const patch = JSON.parse(tool.fields.patch || "{}");
          if (section && spec && spec[section]) {
            setSpec((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
            toast.success(`Updated ${section}`);
          } else {
            toast.warning(`Unknown spec section: ${section}`);
          }
        } catch (err) {
          toast.error(`Couldn't parse edit: ${err.message}`);
        }
        break;
      }
      case "add_node": {
        const id = `n_${Date.now().toString(36)}`;
        const newNode = {
          id,
          type: tool.fields.type || "fn",
          x: 240 + Math.random() * 280,
          y: 120 + Math.random() * 180,
          label: tool.fields.label || "New node",
          sub: tool.fields.sub || "",
        };
        setNodes((prev) => [...prev, newNode]);
        toast.success(`Added node: ${newNode.label}`);
        break;
      }
      case "add_endpoint": {
        const ep = {
          id: `a_${Date.now().toString(36)}`,
          method: (tool.fields.method || "GET").toUpperCase(),
          path: tool.fields.path || "/v1/...",
          note: tool.fields.note || "",
        };
        setSpec((prev) => ({ ...prev, endpoints: [...(prev.endpoints || []), ep] }));
        toast.success(`Added ${ep.method} ${ep.path}`);
        break;
      }
      case "add_model": {
        const m = {
          id: `m_${Date.now().toString(36)}`,
          name: tool.fields.name || "NewModel",
          fields: tool.fields.fields || "id, name",
        };
        setSpec((prev) => ({ ...prev, models: [...(prev.models || []), m] }));
        toast.success(`Added model: ${m.name}`);
        break;
      }
      default:
        toast.warning(`Tool "${tool.name}" not yet supported`);
    }
  };

  const openNewProjectWizard = (templateId = null) => {
    setWizardTemplateId(templateId);
    setNewProjectOpen(true);
  };

  const handleOpenProject = async (id) => {
    if (id === "new") {
      openNewProjectWizard();
    } else if (id) {
      await openProjectInStore(id);
    }
  };

  const applyTemplate = (templateId) => {
    if (!TEMPLATE_PRESETS || !TEMPLATE_PRESETS[templateId]) {
      setActive("editor");
      return;
    }
    openNewProjectWizard(templateId);
  };

  const handleWizardCreate = async (initial) => {
    const created = await createProject(initial);
    setNewProjectOpen(false);
    setWizardTemplateId(null);
    setActive("editor");
    toast.success(`Created "${created.name}"`);
  };

  const handleWizardImport = async (data) => {
    const meta = await importProject(data);
    setNewProjectOpen(false);
    setWizardTemplateId(null);
    setActive("editor");
    toast.success(`Imported "${meta.name}"`);
  };

  const dismissWelcome = async () => {
    setWelcomeOpen(false);
    await updateSettings({ hasSeenWelcome: true });
  };

  const finishWelcomeAndCreate = async () => {
    await updateSettings({ hasSeenWelcome: true });
    setWelcomeOpen(false);
    openNewProjectWizard();
  };

  // Render a placeholder while we hydrate from storage on first paint.
  if (!projectsLoaded || !settingsLoaded || !contentLoaded || !spec) {
    return (
      <div
        className="app-loading"
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "var(--bg-0, #0c0a09)",
          color: "var(--ink-2, #a8a29e)",
          fontFamily: "var(--font-sans, system-ui)",
          fontSize: 13,
        }}
      >
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        active={active}
        setActive={(id) => {
          setActive(id);
          setMobileSidebarOpen(false);
        }}
        openProject={(id) => {
          handleOpenProject(id);
          setMobileSidebarOpen(false);
        }}
        mobileOpen={mobileSidebarOpen}
      />
      {mobileSidebarOpen && (
        <div
          className="sidebar-scrim"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="main">
        <Topbar
          active={active}
          projectName={currentProject?.name || "Untitled"}
          openExport={handleExport}
          openPalette={() => setPaletteOpen(true)}
          openMobileNav={() => setMobileSidebarOpen(true)}
        />
        <div className="content">
          {active === "dashboard" && (
            <Dashboard
              openProject={handleOpenProject}
              goEditor={() => setActive("editor")}
              goTemplates={() => setActive("templates")}
            />
          )}
          {active === "editor" && (
            <Editor
              openExport={handleExport}
              openHistory={() => setHistoryOpen(true)}
              openDesign={() => setDesignOpen(true)}
              openHandoff={() => setHandoffOpen(true)}
              openCodeChat={() => setCodeChatOpen(true)}
              spec={spec}
              setSpec={setSpec}
              nodes={nodes}
              setNodes={setNodes}
              edges={edges}
              setEdges={setEdges}
              diagramType={diagramType}
              setDiagramType={setDiagramType}
              showGrid={tweaks.showGrid}
            />
          )}
          {active === "templates" && <Templates onUse={applyTemplate} />}
          {active === "preview" && <PreviewLanding spec={spec} onOpen={handleExport} />}
          {active === "settings" && <Settings />}
        </div>
      </div>

      <Suspense fallback={null}>
        {exportOpen && (
          <PreviewModal
            spec={spec}
            nodes={nodes}
            edges={edges}
            diagramType={diagramType}
            onClose={() => setExportOpen(false)}
            onCopy={onCopy}
          />
        )}
        {historyOpen && (
          <HistoryView
            onClose={() => setHistoryOpen(false)}
            projectId={currentProjectId}
            projectName={currentProject?.name}
            onRestore={handleRestoreSnapshot}
          />
        )}
        {designOpen && <DesignLayer onClose={() => setDesignOpen(false)} />}
        {handoffOpen && (
          <HandoffView onClose={() => setHandoffOpen(false)} spec={spec} setSpec={setSpec} />
        )}
        {codeChatOpen && (
          <ClaudeCodeChat
            open={codeChatOpen}
            onClose={() => setCodeChatOpen(false)}
            ctx={{ spec, nodes, edges, diagramType }}
            applyEdit={applyEdit}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {welcomeOpen && (
          <WelcomeModal
            onClose={dismissWelcome}
            onCreateProject={finishWelcomeAndCreate}
            onSaveApiKey={setApiKey}
            currentApiKey={apiKey}
          />
        )}

        {newProjectOpen && (
          <NewProjectWizard
            onClose={() => {
              setNewProjectOpen(false);
              setWizardTemplateId(null);
            }}
            onCreate={handleWizardCreate}
            onImport={handleWizardImport}
            initialTemplateId={wizardTemplateId}
          />
        )}
      </Suspense>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={[
          {
            id: "nav-dashboard",
            section: "Navigate",
            title: "Go to Dashboard",
            icon: "home",
            shortcut: "⌘ /",
            run: () => setActive("dashboard"),
          },
          {
            id: "nav-editor",
            section: "Navigate",
            title: "Open Editor",
            icon: "canvas",
            run: () => setActive("editor"),
          },
          {
            id: "nav-templates",
            section: "Navigate",
            title: "Browse Templates",
            icon: "template",
            run: () => setActive("templates"),
          },
          {
            id: "nav-settings",
            section: "Navigate",
            title: "Open Settings",
            icon: "settings",
            run: () => setActive("settings"),
          },
          {
            id: "act-new",
            section: "Actions",
            title: "Create new project",
            icon: "plus",
            keywords: "create blank",
            run: () => openNewProjectWizard(),
          },
          {
            id: "act-export",
            section: "Actions",
            title: "Export current project",
            icon: "download",
            shortcut: "⌘ E",
            run: () => setExportOpen(true),
          },
          {
            id: "act-chat",
            section: "Actions",
            title: "Open Claude Code chat",
            icon: "terminal",
            run: () => setCodeChatOpen(true),
          },
          {
            id: "act-handoff",
            section: "Actions",
            title: "Open handoff package",
            icon: "extLink",
            run: () => setHandoffOpen(true),
          },
          {
            id: "act-design",
            section: "Actions",
            title: "Open design tokens",
            icon: "palette",
            run: () => setDesignOpen(true),
          },
          ...projects
            .filter((p) => p.id !== currentProjectId)
            .slice(0, 8)
            .map((p) => ({
              id: `proj-${p.id}`,
              section: "Switch project",
              title: p.name,
              icon: "folder",
              keywords: p.description ?? "",
              run: () => {
                openProjectInStore(p.id);
                setActive("editor");
              },
            })),
        ]}
      />

      <ToastStack />
      <ConfirmDialog />

      <TweaksPanel>
        <TweakSection label="Appearance">
          <TweakRadio
            label="Theme"
            value={tweaks.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "warm-dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
          <TweakColor
            label="Accent"
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={["#2680eb", "#f59e0b", "#fb7185", "#22d3ee", "#a78bfa", "#22c55e"]}
          />
        </TweakSection>
        <TweakSection label="Canvas">
          <TweakToggle
            label="Show grid"
            value={tweaks.showGrid}
            onChange={(v) => setTweak("showGrid", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function PreviewLanding({ spec, onOpen }) {
  const sectionCount = spec
    ? [
        spec.overview,
        spec.stack,
        spec.features?.length,
        spec.models?.length,
        spec.endpoints?.length,
        spec.stories?.length,
        spec.constraints,
        spec.conventions,
        spec.deploy,
      ].filter(Boolean).length
    : 0;

  return (
    <div className="scroll">
      <div className="settings">
        <h1>Preview & Export</h1>
        <p className="lede">
          Review the structured prompt your spec produces, then ship it to your AI agent.
        </p>

        <div className="set-group">
          <div className="set-group-head">
            <div className="ico">
              <Icon name="sparkles" size={14} />
            </div>
            <h3>Ready to export</h3>
          </div>
          <div style={{ padding: 24, textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "var(--accent-soft)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 14px",
                color: "var(--accent-ink)",
              }}
            >
              <Icon name="download" size={26} />
            </div>
            <div style={{ fontSize: 18, fontFamily: "var(--font-serif)", marginBottom: 6 }}>
              {spec?.overview?.name || "Untitled project"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 18 }}>
              {sectionCount} spec sections · {spec?.features?.length ?? 0} features ·{" "}
              {spec?.endpoints?.length ?? 0} endpoints
            </div>
            <button className="btn btn-primary btn-lg" onClick={onOpen}>
              <Icon name="sparkles" size={14} />
              <span>Open export panel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { App };
