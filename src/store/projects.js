import { create } from "zustand";
import { storage } from "../lib/storage/index.js";
import { INITIAL_SPEC, INITIAL_NODES, INITIAL_EDGES } from "../data/demo-project.js";

const PROJECTS_META_KEY = "projects";
const CURRENT_KEY = "currentProjectId";
const PROJECT_CONTENT_KEY = (id) => `project:${id}`;

const EXPORT_FORMAT = "architect-project";
const EXPORT_VERSION = 1;

function uid(prefix = "proj") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function emptyContent() {
  return {
    spec: {
      overview: { name: "Untitled", tagline: "", description: "", goals: "" },
      stack: { frontend: [], backend: [], data: [], infra: [] },
      features: [],
      models: [],
      endpoints: [],
      stories: [],
      constraints: { musts: [], nonGoals: [] },
      conventions: { style: "", naming: "", testing: "" },
      deploy: { envs: ["dev", "production"], notes: "" },
    },
    nodes: [],
    edges: [],
    diagramType: "system",
  };
}

function demoMetadata() {
  return {
    id: "demo",
    name: "Pulse — habit tracker (demo)",
    description: "Example project showing how to spec a full-stack habit tracker. Safe to delete.",
    isDemo: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function demoContent() {
  return {
    spec: INITIAL_SPEC,
    nodes: INITIAL_NODES,
    edges: INITIAL_EDGES,
    diagramType: "system",
  };
}

/**
 * Project list + active project + content CRUD. Metadata is kept in a single
 * `projects` array (cheap to read) while each project's full content lives at
 * its own key (lazy-loaded when opened).
 */
export const useProjectsStore = create((set, get) => ({
  projects: [],
  currentProjectId: null,
  loaded: false,

  async load() {
    let projects = await storage.get(PROJECTS_META_KEY);
    let currentProjectId = await storage.get(CURRENT_KEY);

    // First-run: seed with the demo project so the editor has something to show.
    if (projects == null) {
      const meta = demoMetadata();
      projects = [meta];
      currentProjectId = meta.id;
      await storage.set(PROJECTS_META_KEY, projects);
      await storage.set(CURRENT_KEY, currentProjectId);
      await storage.set(PROJECT_CONTENT_KEY(meta.id), demoContent());
    } else if (currentProjectId && !projects.some((p) => p.id === currentProjectId)) {
      // Stored current id no longer exists — fall back to first project, or null.
      currentProjectId = projects[0]?.id ?? null;
      await storage.set(CURRENT_KEY, currentProjectId);
    }

    set({ projects, currentProjectId, loaded: true });
  },

  async create(initial = {}) {
    const meta = {
      id: uid(),
      name: initial.name || "Untitled project",
      description: initial.description || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const content = initial.content || emptyContent();
    const projects = [meta, ...get().projects];
    set({ projects, currentProjectId: meta.id });
    await storage.set(PROJECTS_META_KEY, projects);
    await storage.set(CURRENT_KEY, meta.id);
    await storage.set(PROJECT_CONTENT_KEY(meta.id), content);
    return meta;
  },

  async open(id) {
    set({ currentProjectId: id });
    await storage.set(CURRENT_KEY, id);
  },

  async rename(id, name) {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
    );
    set({ projects });
    await storage.set(PROJECTS_META_KEY, projects);
  },

  async touch(id) {
    const projects = get().projects.map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p));
    set({ projects });
    await storage.set(PROJECTS_META_KEY, projects);
  },

  async delete(id) {
    const projects = get().projects.filter((p) => p.id !== id);
    let currentProjectId = get().currentProjectId;
    if (currentProjectId === id) currentProjectId = projects[0]?.id ?? null;
    set({ projects, currentProjectId });
    await storage.set(PROJECTS_META_KEY, projects);
    await storage.set(CURRENT_KEY, currentProjectId);
    await storage.remove(PROJECT_CONTENT_KEY(id));
  },

  async getContent(id) {
    return await storage.get(PROJECT_CONTENT_KEY(id));
  },

  async setContent(id, content) {
    await storage.set(PROJECT_CONTENT_KEY(id), content);
    await get().touch(id);
  },

  async exportProject(id) {
    const meta = get().projects.find((p) => p.id === id);
    const content = await get().getContent(id);
    if (!meta || !content) return null;
    return {
      __format: EXPORT_FORMAT,
      __version: EXPORT_VERSION,
      exportedAt: Date.now(),
      project: { ...meta, content },
    };
  },

  async importProject(data) {
    if (!data || data.__format !== EXPORT_FORMAT) {
      throw new Error("Not a valid Architect project file.");
    }
    if (!data.project || !data.project.content) {
      throw new Error("Project file is missing content.");
    }
    const meta = {
      id: uid(),
      name: data.project.name || "Imported project",
      description: data.project.description || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const projects = [meta, ...get().projects];
    set({ projects, currentProjectId: meta.id });
    await storage.set(PROJECTS_META_KEY, projects);
    await storage.set(CURRENT_KEY, meta.id);
    await storage.set(PROJECT_CONTENT_KEY(meta.id), data.project.content);
    return meta;
  },

  current() {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId) ?? null;
  },
}));

export { EXPORT_FORMAT, EXPORT_VERSION };
