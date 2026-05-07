import { describe, it, expect, beforeEach } from "vitest";
import { useProjectsStore, EXPORT_FORMAT } from "../../src/store/projects.js";

describe("useProjectsStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useProjectsStore.setState({
      projects: [],
      currentProjectId: null,
      loaded: false,
    });
  });

  it("seeds the demo project on first load", async () => {
    await useProjectsStore.getState().load();
    const { projects, currentProjectId, loaded } = useProjectsStore.getState();
    expect(loaded).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    expect(currentProjectId).toBe(projects[0].id);
    expect(projects[0].isDemo).toBe(true);
  });

  it("creates a new project and makes it current", async () => {
    await useProjectsStore.getState().load();
    const meta = await useProjectsStore.getState().create({ name: "Hello" });
    expect(meta.name).toBe("Hello");
    expect(useProjectsStore.getState().currentProjectId).toBe(meta.id);
    expect(useProjectsStore.getState().projects.find((p) => p.id === meta.id)).toBeDefined();
  });

  it("renames a project and bumps updatedAt", async () => {
    await useProjectsStore.getState().load();
    const meta = await useProjectsStore.getState().create({ name: "Old" });
    const before = meta.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    await useProjectsStore.getState().rename(meta.id, "New");
    const after = useProjectsStore.getState().projects.find((p) => p.id === meta.id);
    expect(after.name).toBe("New");
    expect(after.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("deletes a project and falls back to first remaining", async () => {
    await useProjectsStore.getState().load();
    const a = await useProjectsStore.getState().create({ name: "A" });
    await useProjectsStore.getState().create({ name: "B" });
    await useProjectsStore.getState().delete(a.id);
    const { projects, currentProjectId } = useProjectsStore.getState();
    expect(projects.find((p) => p.id === a.id)).toBeUndefined();
    expect(currentProjectId).toBeDefined();
    expect(currentProjectId).not.toBe(a.id);
  });

  it("exports a project with format envelope", async () => {
    await useProjectsStore.getState().load();
    const meta = await useProjectsStore.getState().create({ name: "Export me" });
    await useProjectsStore.getState().setContent(meta.id, {
      spec: { overview: { name: "Export me" } },
      nodes: [],
      edges: [],
      diagramType: "system",
    });
    const data = await useProjectsStore.getState().exportProject(meta.id);
    expect(data.__format).toBe(EXPORT_FORMAT);
    expect(data.project.name).toBe("Export me");
    expect(data.project.content).toBeDefined();
  });

  it("rejects malformed import files", async () => {
    await useProjectsStore.getState().load();
    await expect(useProjectsStore.getState().importProject(null)).rejects.toThrow();
    await expect(
      useProjectsStore.getState().importProject({ __format: "wrong" }),
    ).rejects.toThrow();
    await expect(
      useProjectsStore.getState().importProject({ __format: EXPORT_FORMAT }),
    ).rejects.toThrow();
  });

  it("imports a valid project envelope", async () => {
    await useProjectsStore.getState().load();
    const envelope = {
      __format: EXPORT_FORMAT,
      __version: 1,
      project: {
        name: "Imported",
        description: "from JSON",
        content: { spec: {}, nodes: [], edges: [], diagramType: "system" },
      },
    };
    const meta = await useProjectsStore.getState().importProject(envelope);
    expect(meta.name).toBe("Imported");
    expect(useProjectsStore.getState().currentProjectId).toBe(meta.id);
  });
});
