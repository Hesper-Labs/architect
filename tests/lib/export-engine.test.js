import { describe, it, expect } from "vitest";
import {
  toMermaid,
  toClaudeMd,
  toStructuredJSON,
  toXML,
  validate,
  estimateTokens,
} from "../../src/lib/export-engine.js";

const sampleSpec = {
  overview: {
    name: "Test",
    tagline: "A test",
    description: "A short description for testing the export engine end to end.",
    goals: "Pass tests",
  },
  stack: {
    frontend: ["React"],
    backend: ["Node"],
    data: ["Postgres"],
    infra: ["Vercel"],
  },
  features: [{ id: "f1", title: "Feature", priority: "P0", note: "core flow" }],
  models: [{ id: "m1", name: "Item", fields: "id, name" }],
  endpoints: [{ id: "a1", method: "GET", path: "/v1/items" }],
  stories: [{ id: "s1", text: "As a user, I see items." }],
  constraints: { musts: ["Fast"], nonGoals: ["Slow"] },
  conventions: { style: "Functional", naming: "kebab", testing: "Vitest" },
  deploy: { envs: ["dev", "prod"], notes: "" },
};

const sampleNodes = [
  { id: "n1", type: "user", x: 0, y: 0, label: "Client" },
  { id: "n2", type: "api", x: 100, y: 0, label: "API" },
  { id: "n3", type: "db", x: 200, y: 0, label: "DB" },
];
const sampleEdges = [
  { id: "e1", from: "n1", to: "n2" },
  { id: "e2", from: "n2", to: "n3" },
];

describe("toMermaid", () => {
  it("produces a graph LR for system diagram type", () => {
    const out = toMermaid("system", sampleNodes, sampleEdges);
    expect(out).toMatch(/^graph LR/);
    expect(out).toContain("Client");
    expect(out).toContain("API");
    expect(out).toContain("-->");
  });

  it("produces a flowchart for flow diagram type", () => {
    const out = toMermaid("flow", sampleNodes, sampleEdges);
    expect(out).toMatch(/^flowchart TD/);
  });

  it("produces a sequence diagram with participants", () => {
    const out = toMermaid("sequence", sampleNodes, sampleEdges);
    expect(out).toContain("sequenceDiagram");
    expect(out).toContain("participant");
  });

  it("produces an ER diagram with relations", () => {
    const out = toMermaid("er", sampleNodes, sampleEdges);
    expect(out).toContain("erDiagram");
    expect(out).toContain("||--o{");
  });
});

describe("toClaudeMd", () => {
  it("uses the project name as the h1", () => {
    const md = toClaudeMd(sampleSpec, "graph LR", true, false, "");
    expect(md).toContain("# Test");
  });

  it("embeds Mermaid when requested", () => {
    const md = toClaudeMd(sampleSpec, "graph LR", true, false, "");
    expect(md).toContain("```mermaid");
    expect(md).toContain("graph LR");
  });

  it("can omit Mermaid", () => {
    const md = toClaudeMd(sampleSpec, "graph LR", false, false, "");
    expect(md).not.toContain("```mermaid");
  });

  it("can include ASCII fallback", () => {
    const md = toClaudeMd(sampleSpec, "graph LR", false, true, "ASCII ART HERE");
    expect(md).toContain("ASCII ART HERE");
  });
});

describe("toStructuredJSON", () => {
  it("includes project metadata", () => {
    const json = toStructuredJSON(sampleSpec, sampleNodes, sampleEdges, "system");
    expect(json.project.name).toBe("Test");
    expect(json.diagram.type).toBe("system");
    expect(json.diagram.nodes).toHaveLength(3);
  });

  it("splits model fields into arrays", () => {
    const json = toStructuredJSON(sampleSpec, sampleNodes, sampleEdges, "system");
    expect(json.models[0].fields).toEqual(["id", "name"]);
  });
});

describe("toXML", () => {
  it("produces well-formed XML", () => {
    const xml = toXML(sampleSpec, sampleNodes, sampleEdges);
    expect(xml).toContain('<project name="Test">');
    expect(xml).toContain("</project>");
    expect(xml).toContain('<endpoint method="GET" path="/v1/items" />');
  });

  it("escapes XML special characters", () => {
    const evil = {
      ...sampleSpec,
      overview: { ...sampleSpec.overview, name: "A & B <C>" },
    };
    const xml = toXML(evil, sampleNodes, sampleEdges);
    expect(xml).toContain("A &amp; B &lt;C&gt;");
  });
});

describe("validate", () => {
  it("scores a complete spec high", () => {
    const { score, issues } = validate(sampleSpec, sampleNodes, sampleEdges);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
  });

  it("flags empty descriptions as errors", () => {
    const broken = { ...sampleSpec, overview: { ...sampleSpec.overview, description: "" } };
    const { issues } = validate(broken, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.level === "error" && i.section === "Overview")).toBe(true);
  });

  it("flags P0 features with no note", () => {
    const broken = {
      ...sampleSpec,
      features: [{ id: "f1", title: "X", priority: "P0", note: "" }],
    };
    const { issues } = validate(broken, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.section === "Features")).toBe(true);
  });

  it("flags disconnected nodes", () => {
    const lonely = [...sampleNodes, { id: "n4", type: "fn", x: 300, y: 0, label: "Lonely" }];
    const { issues } = validate(sampleSpec, lonely, sampleEdges);
    expect(issues.some((i) => i.section === "Diagram" && i.msg.includes("Lonely"))).toBe(true);
  });

  it("flags endpoints without backend stack", () => {
    const broken = { ...sampleSpec, stack: { ...sampleSpec.stack, backend: [] } };
    const { issues } = validate(broken, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.level === "error" && i.section === "Stack")).toBe(true);
  });

  it("flags inconsistent /v1/ endpoint versioning", () => {
    const mixed = {
      ...sampleSpec,
      endpoints: [
        { id: "a1", method: "GET", path: "/v1/items" },
        { id: "a2", method: "POST", path: "/items" },
        { id: "a3", method: "DELETE", path: "/v1/items/:id" },
      ],
    };
    const { issues } = validate(mixed, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.section === "API" && i.msg.includes("versioning"))).toBe(true);
  });

  it("flags mixed kebab-case + camelCase paths", () => {
    const mixed = {
      ...sampleSpec,
      endpoints: [
        { id: "a1", method: "GET", path: "/v1/user-profiles" },
        { id: "a2", method: "GET", path: "/v1/userProfile/:id" },
      ],
    };
    const { issues } = validate(mixed, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.section === "API" && i.msg.includes("kebab"))).toBe(true);
  });

  it("flags models with mixed snake_case + camelCase fields", () => {
    const mixed = {
      ...sampleSpec,
      models: [{ id: "m1", name: "Item", fields: "id, user_id, createdAt" }],
    };
    const { issues } = validate(mixed, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.section === "Models" && i.msg.includes("Item"))).toBe(true);
  });

  it("flags P0 features missing from user stories", () => {
    const broken = {
      ...sampleSpec,
      features: [{ id: "f1", title: "Multiplayer sync", priority: "P0", note: "real-time" }],
      stories: [{ id: "s1", text: "As a user, I see items." }],
    };
    const { issues } = validate(broken, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.section === "Stories" && i.msg.includes("Multiplayer sync"))).toBe(
      true,
    );
  });

  it("flags missing accepted ADRs on multi-feature projects", () => {
    const broken = {
      ...sampleSpec,
      features: Array.from({ length: 6 }, (_, i) => ({
        id: `f${i}`,
        title: `Feature ${i}`,
        priority: "P1",
        note: "note",
      })),
      handoff: { adrs: [], risks: [] },
    };
    const { issues } = validate(broken, sampleNodes, sampleEdges);
    expect(issues.some((i) => i.section === "Handoff" && i.msg.includes("decisions"))).toBe(true);
  });
});

describe("estimateTokens", () => {
  it("returns a rough char-based estimate", () => {
    expect(estimateTokens("hello world")).toBe(3);
  });

  it("handles empty input", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens(null)).toBe(0);
    expect(estimateTokens(undefined)).toBe(0);
  });
});
