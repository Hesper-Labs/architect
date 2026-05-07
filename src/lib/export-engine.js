// ============== Spec → Markdown / Mermaid / JSON / XML / ASCII ==============

// Convert canvas (nodes + edges) to Mermaid based on diagram type
function toMermaid(diagramType, nodes, edges) {
  const safe = (s) => String(s || "").replace(/[^\w]/g, "_") || "n";
  const label = (s) => String(s || "").replace(/"/g, "'");

  if (diagramType === "sequence") {
    const lines = ["sequenceDiagram"];
    const actors = nodes.slice(0, 4);
    actors.forEach((a) => lines.push(`  participant ${safe(a.id)} as ${label(a.label)}`));
    // sample message flow based on edges in order
    edges.forEach((e) => {
      const f = nodes.find((n) => n.id === e.from);
      const t = nodes.find((n) => n.id === e.to);
      if (!f || !t) return;
      lines.push(`  ${safe(f.id)}->>+${safe(t.id)}: ${label(e.label || "request")}`);
      lines.push(`  ${safe(t.id)}-->>-${safe(f.id)}: response`);
    });
    return lines.join("\n");
  }

  if (diagramType === "er") {
    const lines = ["erDiagram"];
    nodes.forEach((n) => {
      lines.push(`  ${safe(n.label)} {`);
      const fields = (n.sub || "id, name")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      fields.forEach((f) => lines.push(`    string ${safe(f)}`));
      lines.push(`  }`);
    });
    edges.forEach((e) => {
      const f = nodes.find((n) => n.id === e.from);
      const t = nodes.find((n) => n.id === e.to);
      if (!f || !t) return;
      lines.push(`  ${safe(f.label)} ||--o{ ${safe(t.label)} : "${e.label || "has"}"`);
    });
    return lines.join("\n");
  }

  if (diagramType === "state") {
    const lines = ["stateDiagram-v2"];
    nodes.forEach((n) => {
      if (n.type === "initial") lines.push(`  [*] --> ${safe(n.label)}`);
    });
    edges.forEach((e) => {
      const f = nodes.find((n) => n.id === e.from);
      const t = nodes.find((n) => n.id === e.to);
      if (!f || !t) return;
      lines.push(`  ${safe(f.label)} --> ${safe(t.label)}${e.label ? ` : ${label(e.label)}` : ""}`);
    });
    nodes
      .filter((n) => n.type === "final")
      .forEach((n) => {
        lines.push(`  ${safe(n.label)} --> [*]`);
      });
    return lines.join("\n");
  }

  if (diagramType === "flow") {
    const lines = ["flowchart TD"];
    nodes.forEach((n) => {
      const shape = n.type === "user" ? `([${label(n.label)}])` : `[${label(n.label)}]`;
      lines.push(`  ${safe(n.id)}${shape}`);
    });
    edges.forEach((e) => {
      const arrow = e.label ? ` -->|${label(e.label)}| ` : ` --> `;
      lines.push(`  ${safe(e.from)}${arrow}${safe(e.to)}`);
    });
    return lines.join("\n");
  }

  if (diagramType === "tree") {
    const lines = ["graph TD"];
    nodes.forEach((n) => lines.push(`  ${safe(n.id)}[${label(n.label)}]`));
    edges.forEach((e) => lines.push(`  ${safe(e.from)} --> ${safe(e.to)}`));
    return lines.join("\n");
  }

  // default: system / graph LR
  const lines = ["graph LR"];
  nodes.forEach((n) => {
    let shape = `[${label(n.label)}]`;
    if (n.type === "db") shape = `[(${label(n.label)})]`;
    if (n.type === "queue") shape = `[/${label(n.label)}/]`;
    if (n.type === "user") shape = `([${label(n.label)}])`;
    if (n.type === "cloud") shape = `((${label(n.label)}))`;
    lines.push(`  ${safe(n.id)}${shape}`);
  });
  edges.forEach((e) => {
    const arrow = e.label ? ` -->|${label(e.label)}| ` : ` --> `;
    lines.push(`  ${safe(e.from)}${arrow}${safe(e.to)}`);
  });
  return lines.join("\n");
}

// ASCII fallback — boxed nodes laid out in columns based on edges
function toAscii(nodes, edges) {
  const incoming = {};
  nodes.forEach((n) => {
    incoming[n.id] = 0;
  });
  edges.forEach((e) => {
    if (incoming[e.to] !== undefined) incoming[e.to]++;
  });

  // Group by column: source = 0
  const col = {};
  const sources = nodes.filter((n) => incoming[n.id] === 0).map((n) => n.id);
  const queue = sources.map((id) => ({ id, c: 0 }));
  sources.forEach((id) => (col[id] = 0));
  while (queue.length) {
    const { id, c } = queue.shift();
    edges
      .filter((e) => e.from === id)
      .forEach((e) => {
        if (col[e.to] === undefined || c + 1 > col[e.to]) {
          col[e.to] = c + 1;
          queue.push({ id: e.to, c: c + 1 });
        }
      });
  }
  nodes.forEach((n) => {
    if (col[n.id] === undefined) col[n.id] = 0;
  });

  // Build columns
  const cols = {};
  nodes.forEach((n) => {
    cols[col[n.id]] = cols[col[n.id]] || [];
    cols[col[n.id]].push(n);
  });

  const colKeys = Object.keys(cols).sort((a, b) => +a - +b);
  const out = [];
  colKeys.forEach((c) => {
    out.push(`Column ${c}:`);
    cols[c].forEach((n) => {
      out.push(`  ┌────────────────────┐`);
      out.push(`  │ ${(n.label || "").padEnd(18).slice(0, 18)} │`);
      out.push(`  │ ${(n.sub || "").padEnd(18).slice(0, 18)} │`);
      out.push(`  └────────────────────┘`);
    });
    out.push("");
  });

  out.push("Connections:");
  edges.forEach((e) => {
    const f = nodes.find((n) => n.id === e.from);
    const t = nodes.find((n) => n.id === e.to);
    if (f && t) out.push(`  ${f.label} ──▶ ${t.label}${e.label ? "  [" + e.label + "]" : ""}`);
  });

  return out.join("\n");
}

// Spec to full Markdown (CLAUDE.md format)
function toClaudeMd(spec, mermaid, includeMermaid = true, includeAscii = false, ascii = "") {
  const lines = [];
  const push = (s = "") => lines.push(s);

  push(`# ${spec.overview.name}`);
  push();
  push(`> ${spec.overview.tagline}`);
  push();
  push(`## Overview`);
  push();
  push(spec.overview.description);
  push();
  push(`### Goals`);
  push();
  push(spec.overview.goals);
  push();

  push(`## Architecture`);
  push();
  if (includeMermaid) {
    push("```mermaid");
    push(mermaid);
    push("```");
    push();
  }
  if (includeAscii) {
    push("```");
    push(ascii);
    push("```");
    push();
  }

  push(`## Tech stack`);
  push();
  push(`| Layer | Technologies |`);
  push(`| --- | --- |`);
  push(`| Frontend | ${spec.stack.frontend.join(", ")} |`);
  push(`| Backend | ${spec.stack.backend.join(", ")} |`);
  push(`| Data | ${spec.stack.data.join(", ")} |`);
  push(`| Infra | ${spec.stack.infra.join(", ")} |`);
  push();

  push(`## Features`);
  push();
  spec.features.forEach((f) => push(`- **[${f.priority}]** ${f.title} — ${f.note}`));
  push();

  push(`## Data models`);
  push();
  push("```typescript");
  spec.models.forEach((m) => {
    push(`type ${m.name} = {`);
    m.fields
      .split(",")
      .map((s) => s.trim())
      .forEach((f) => push(`  ${f};`));
    push(`};`);
    push();
  });
  push("```");
  push();

  push(`## API endpoints`);
  push();
  push("```http");
  spec.endpoints.forEach((e) => push(`${e.method.padEnd(6)} ${e.path}`));
  push("```");
  push();

  push(`## User stories`);
  push();
  spec.stories.forEach((s) => push(`- ${s.text}`));
  push();

  push(`## Constraints`);
  push();
  push(`**Must-haves:**`);
  spec.constraints.musts.forEach((m) => push(`- ${m}`));
  push();
  push(`**Non-goals:**`);
  spec.constraints.nonGoals.forEach((m) => push(`- ${m}`));
  push();

  push(`## Coding conventions`);
  push();
  push(`### Style`);
  push(spec.conventions.style);
  push();
  push(`### Naming`);
  push(spec.conventions.naming);
  push();
  push(`### Testing`);
  push(spec.conventions.testing);
  push();

  push(`## Deployment`);
  push();
  push(`**Environments:** ${spec.deploy.envs.join(", ")}`);
  push();
  push(spec.deploy.notes);
  push();

  push(`---`);
  push();
  push(`> Generated by Architect · ${new Date().toISOString().slice(0, 10)}`);
  return lines.join("\n");
}

// Spec to JSON (machine-readable)
function toStructuredJSON(spec, nodes, edges, diagramType) {
  return {
    project: {
      name: spec.overview.name,
      tagline: spec.overview.tagline,
      description: spec.overview.description,
      goals: spec.overview.goals,
    },
    stack: spec.stack,
    features: spec.features.map((f) => ({ priority: f.priority, title: f.title, note: f.note })),
    models: spec.models.map((m) => ({
      name: m.name,
      fields: m.fields.split(",").map((s) => s.trim()),
    })),
    endpoints: spec.endpoints.map((e) => ({ method: e.method, path: e.path })),
    stories: spec.stories.map((s) => s.text),
    constraints: spec.constraints,
    conventions: spec.conventions,
    deploy: spec.deploy,
    diagram: {
      type: diagramType,
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, label: n.label, sub: n.sub })),
      edges: edges.map((e) => ({ from: e.from, to: e.to, label: e.label })),
    },
  };
}

// Spec to XML (some agents prefer this)
function toXML(spec, nodes, edges) {
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const lines = [];
  lines.push(`<project name="${esc(spec.overview.name)}">`);
  lines.push(`  <description>${esc(spec.overview.description)}</description>`);
  lines.push(`  <goals>${esc(spec.overview.goals)}</goals>`);
  lines.push(`  <stack>`);
  Object.entries(spec.stack).forEach(([k, v]) => {
    lines.push(`    <${k}>${v.map(esc).join(", ")}</${k}>`);
  });
  lines.push(`  </stack>`);
  lines.push(`  <features>`);
  spec.features.forEach((f) =>
    lines.push(`    <feature priority="${f.priority}">${esc(f.title)}</feature>`),
  );
  lines.push(`  </features>`);
  lines.push(`  <models>`);
  spec.models.forEach((m) =>
    lines.push(`    <model name="${esc(m.name)}" fields="${esc(m.fields)}" />`),
  );
  lines.push(`  </models>`);
  lines.push(`  <api>`);
  spec.endpoints.forEach((e) =>
    lines.push(`    <endpoint method="${e.method}" path="${esc(e.path)}" />`),
  );
  lines.push(`  </api>`);
  lines.push(`  <architecture>`);
  nodes.forEach((n) =>
    lines.push(`    <node id="${n.id}" type="${n.type}" label="${esc(n.label)}" />`),
  );
  edges.forEach((e) => lines.push(`    <edge from="${e.from}" to="${e.to}" />`));
  lines.push(`  </architecture>`);
  lines.push(`</project>`);
  return lines.join("\n");
}

// ============== Validation engine ==============
function validate(spec, nodes, edges) {
  const issues = [];

  // M1: Description present
  if (!spec.overview.description?.trim()) {
    issues.push({
      level: "error",
      section: "Overview",
      msg: "Project description is empty.",
      fix: "Add at least 1-2 sentences.",
    });
  } else if (spec.overview.description.length < 60) {
    issues.push({
      level: "warn",
      section: "Overview",
      msg: "Description is very short.",
      fix: "AI agents work better with at least 2-3 sentences of context.",
    });
  }

  // M2: At least one feature
  if (!spec.features.length) {
    issues.push({
      level: "error",
      section: "Features",
      msg: "No features defined.",
      fix: "Add at least one feature.",
    });
  }
  // P0 features should have notes
  spec.features
    .filter((f) => f.priority === "P0" && !f.note)
    .forEach((f) => {
      issues.push({
        level: "warn",
        section: "Features",
        msg: `P0 feature "${f.title}" has no detail note.`,
        fix: "Add scope/acceptance details.",
      });
    });

  // M3: Endpoints reference models
  const modelNames = spec.models.map((m) => m.name.toLowerCase());
  spec.endpoints.forEach((e) => {
    const path = e.path.toLowerCase();
    const seg = path
      .split("/")
      .filter(Boolean)
      .filter((s) => !s.startsWith(":"))[1]; // /v1/habits → habits
    if (seg && !modelNames.some((mn) => seg.includes(mn) || mn.includes(seg.replace(/s$/, "")))) {
      issues.push({
        level: "warn",
        section: "API",
        msg: `Endpoint ${e.method} ${e.path} doesn't map to any data model.`,
        fix: `Add a "${seg.replace(/s$/, "")}" model or rename the endpoint.`,
      });
    }
  });

  // M4: Models without endpoints
  spec.models.forEach((m) => {
    const has = spec.endpoints.some((e) => e.path.toLowerCase().includes(m.name.toLowerCase()));
    if (!has && m.name !== "User") {
      issues.push({
        level: "info",
        section: "Models",
        msg: `Model "${m.name}" has no endpoints — is it really exposed?`,
        fix: "Add CRUD endpoints or mark internal-only.",
      });
    }
  });

  // M5: Disconnected nodes
  const connected = new Set();
  edges.forEach((e) => {
    connected.add(e.from);
    connected.add(e.to);
  });
  nodes.forEach((n) => {
    if (!connected.has(n.id)) {
      issues.push({
        level: "warn",
        section: "Diagram",
        msg: `Node "${n.label}" is disconnected.`,
        fix: "Connect it or remove it.",
      });
    }
  });

  // M6: Stack must have backend if endpoints exist
  if (spec.endpoints.length && !spec.stack.backend?.length) {
    issues.push({
      level: "error",
      section: "Stack",
      msg: "Endpoints defined but no backend tech specified.",
      fix: "Add a backend framework.",
    });
  }

  // M7: User stories present
  if (!spec.stories.length) {
    issues.push({
      level: "info",
      section: "Stories",
      msg: "No user stories — agents have less context for acceptance.",
      fix: "Add 3-5 'As a user, I can...' statements.",
    });
  }

  // M8: Constraints
  if (!spec.constraints.musts?.length) {
    issues.push({
      level: "info",
      section: "Constraints",
      msg: "No must-haves listed.",
      fix: "Add hard requirements (e.g. accessibility, performance).",
    });
  }

  // M9: Conventions
  if (!spec.conventions.testing?.trim()) {
    issues.push({
      level: "info",
      section: "Conventions",
      msg: "Testing strategy not specified.",
      fix: "Add testing approach (frameworks, coverage targets).",
    });
  }

  // M10: REST endpoint hygiene — flag non-versioned or inconsistent paths.
  const versioned = spec.endpoints.filter((e) => /^\/v\d+\//.test(e.path));
  if (
    spec.endpoints.length >= 3 &&
    versioned.length > 0 &&
    versioned.length < spec.endpoints.length
  ) {
    issues.push({
      level: "warn",
      section: "API",
      msg: "Endpoint versioning is inconsistent — some paths use /v1/ and others don't.",
      fix: "Pick one convention (typically /v1/...) and apply it to every endpoint.",
    });
  }

  // M11: Plural / kebab-case path consistency. If a path has a kebab-case segment
  // and another has camelCase, that's almost always a typo or hand-off mismatch.
  const segments = spec.endpoints
    .flatMap((e) => e.path.split("/"))
    .filter((s) => s && !s.startsWith(":"));
  const hasKebab = segments.some((s) => /-/.test(s) && /^[a-z]/.test(s));
  const hasCamel = segments.some((s) => /[a-z][A-Z]/.test(s));
  if (hasKebab && hasCamel) {
    issues.push({
      level: "warn",
      section: "API",
      msg: "Endpoint paths mix kebab-case and camelCase segments.",
      fix: "Standardize on one (kebab-case is most common in REST URLs).",
    });
  }

  // M12: Model field naming consistency — flag a single model that mixes
  // snake_case and camelCase fields.
  spec.models.forEach((m) => {
    const fieldNames = (m.fields || "")
      .split(",")
      .map((f) => f.trim().split(/\s+/)[0])
      .filter(Boolean);
    const snake = fieldNames.some((f) => f.includes("_"));
    const camel = fieldNames.some((f) => /[a-z][A-Z]/.test(f));
    if (snake && camel) {
      issues.push({
        level: "warn",
        section: "Models",
        msg: `Model "${m.name}" mixes snake_case and camelCase field names.`,
        fix: "Pick one casing (snake_case for SQL columns, camelCase for app code).",
      });
    }
  });

  // M13: P0 features should appear in user stories (signal of priority alignment).
  const p0 = spec.features.filter((f) => f.priority === "P0");
  if (p0.length > 0 && spec.stories.length > 0) {
    const storiesText = spec.stories.map((s) => s.text.toLowerCase()).join(" ");
    p0.forEach((f) => {
      const titleTokens = f.title
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 3);
      const covered = titleTokens.some((t) => storiesText.includes(t));
      if (!covered) {
        issues.push({
          level: "info",
          section: "Stories",
          msg: `P0 feature "${f.title}" doesn't appear in any user story.`,
          fix: "Add a story that exercises this feature (or downgrade the priority).",
        });
      }
    });
  }

  // M14: ADR coverage — handoff register should have at least one accepted ADR
  // for non-trivial projects (5+ features).
  const adrs = spec.handoff?.adrs ?? [];
  const acceptedAdrs = adrs.filter((a) => a.status === "accepted");
  if (spec.features.length >= 5 && acceptedAdrs.length === 0) {
    issues.push({
      level: "info",
      section: "Handoff",
      msg: "No accepted architecture decisions recorded.",
      fix: "Capture the major technical choices in the Handoff package — future reviewers (and AI agents) need the why, not just the what.",
    });
  }

  // M15: Risk register — flag if there are no high-severity risks even though
  // the project has many features (likely incomplete risk thinking).
  const risks = spec.handoff?.risks ?? [];
  const highRisks = risks.filter((r) => r.likelihood * r.impact >= 15);
  if (spec.features.length >= 8 && risks.length > 0 && highRisks.length === 0) {
    issues.push({
      level: "info",
      section: "Handoff",
      msg: "Risk register has entries but no high-severity items.",
      fix: "Honest risk assessment usually surfaces at least one likelihood × impact ≥ 15. Re-score, or add the risks you've been avoiding.",
    });
  }

  // Score
  const score = Math.max(
    0,
    100 -
      issues.filter((i) => i.level === "error").length * 15 -
      issues.filter((i) => i.level === "warn").length * 5 -
      issues.filter((i) => i.level === "info").length * 1,
  );
  return { issues, score };
}

// ============== Token estimate ==============
function estimateTokens(text) {
  // rough estimate: 4 chars per token
  return Math.round((text || "").length / 4);
}

export { toMermaid, toAscii, toClaudeMd, toStructuredJSON, toXML, validate, estimateTokens };
