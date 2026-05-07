import { useState, useMemo } from "react";
import { Icon, ClaudeMark } from "../../data/icons.jsx";
import * as ArchitectExport from "../../lib/export-engine.js";
import {
  openInClaudeAi,
  downloadAsClaudeMd,
  copyClaudeCodeSnippet,
} from "../../lib/claude-handoff.js";
import { pushClaudeMd, isConfigured as githubConfigured } from "../../lib/github.js";
import { useSettingsStore } from "../../store/settings.js";
import { toast } from "../../store/toasts.js";

// ============== Code highlighter (lightweight) ==============
function highlightMarkdown(src) {
  return src.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return (
        <div key={i}>
          <span className="hash">#</span> <span className="h1">{line.slice(2)}</span>
        </div>
      );
    if (line.startsWith("## "))
      return (
        <div key={i}>
          <span className="hash">##</span> <span className="h2">{line.slice(3)}</span>
        </div>
      );
    if (line.startsWith("### "))
      return (
        <div key={i}>
          <span className="hash">###</span> <span className="h2">{line.slice(4)}</span>
        </div>
      );
    if (line.startsWith("> "))
      return (
        <div key={i} className="com">
          {line}
        </div>
      );
    if (line.startsWith("```"))
      return (
        <div key={i} className="punct">
          {line}
        </div>
      );
    if (line.startsWith("- ")) return <div key={i}>{highlightInline(line)}</div>;
    if (line.startsWith("|"))
      return (
        <div key={i} className="key">
          {line}
        </div>
      );
    if (/^[A-Z][a-z]+ \d+$/.test(line))
      return (
        <div key={i} className="h2">
          {line}
        </div>
      );
    return <div key={i}>{highlightInline(line) || "\u00A0"}</div>;
  });
}

function highlightInline(line) {
  if (!line) return null;
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[A-Z\d]+\])/g);
  return parts.map((p, j) => {
    if (p.startsWith("**"))
      return (
        <span key={j} className="key">
          {p.slice(2, -2)}
        </span>
      );
    if (p.startsWith("`"))
      return (
        <span key={j} className="str">
          {p}
        </span>
      );
    if (/^\[[A-Z\d]+\]$/.test(p))
      return (
        <span key={j} className="hash">
          {p}
        </span>
      );
    return <span key={j}>{p}</span>;
  });
}

function highlightJSON(json) {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/("[^"]+")(\s*:)/g, '<span class="key">$1</span>$2')
    .replace(/: ("[^"]*")/g, ': <span class="str">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="hash">$1</span>')
    .replace(/: (\d+)/g, ': <span class="hash">$1</span>');
}

function highlightXML(xml) {
  return xml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="key">$2</span>')
    .replace(
      /([a-zA-Z-]+)=(&quot;[^&]*&quot;)/g,
      '<span class="hash">$1</span>=<span class="str">$2</span>',
    );
}

function highlightMermaid(src) {
  return src.split("\n").map((line, i) => {
    if (/^(graph|flowchart|sequenceDiagram|stateDiagram|erDiagram)/.test(line.trim())) {
      return (
        <div key={i}>
          <span className="h1">{line}</span>
        </div>
      );
    }
    if (line.trim().startsWith("%%"))
      return (
        <div key={i} className="com">
          {line}
        </div>
      );
    return (
      <div key={i}>
        {line
          .split(/(-->|--o\{|\|\|--|\[\(|\)\]|\[|\]|\(\(|\)\)|\(|\)|->>|-->>|\{|\})/g)
          .map((p, j) => {
            if (["-->", "->>", "-->>", "--o{", "||--"].includes(p))
              return (
                <span key={j} className="hash">
                  {p}
                </span>
              );
            if (["[", "]", "(", ")", "(", "((", "))", "[(", ")]", "{", "}"].includes(p))
              return (
                <span key={j} className="punct">
                  {p}
                </span>
              );
            return <span key={j}>{p}</span>;
          })}
      </div>
    );
  });
}

// ============== Validation panel ==============
function ValidationPanel({ issues, score }) {
  const errs = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const infos = issues.filter((i) => i.level === "info");

  const scoreColor = score >= 80 ? "var(--green)" : score >= 60 ? "var(--accent)" : "var(--rose)";
  const scoreLabel =
    score >= 90
      ? "Production-ready"
      : score >= 75
        ? "Looks solid"
        : score >= 60
          ? "Needs polish"
          : "Has gaps";

  return (
    <div className="val-panel">
      <div className="val-score-card">
        <div
          className="val-score-ring"
          style={{
            background: `conic-gradient(${scoreColor} ${score * 3.6}deg, var(--bg-2) 0)`,
          }}
        >
          <div className="val-score-inner">
            <div className="val-score-num">{score}</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{scoreLabel}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {errs.length} errors · {warns.length} warnings · {infos.length} info
          </div>
        </div>
      </div>

      <div className="val-list">
        {issues.length === 0 && (
          <div className="val-empty">
            <Icon name="check" size={28} />
            <div style={{ fontWeight: 500, marginTop: 10, fontSize: 14 }}>
              Spec passes all checks
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
              Ready to hand off to your AI agent.
            </div>
          </div>
        )}
        {issues.map((iss, i) => (
          <div key={i} className={"val-item lvl-" + iss.level}>
            <span className="val-icon">
              {iss.level === "error" && <Icon name="x" size={12} />}
              {iss.level === "warn" && <span style={{ fontSize: 11, fontWeight: 700 }}>!</span>}
              {iss.level === "info" && <span style={{ fontSize: 11, fontWeight: 700 }}>i</span>}
            </span>
            <div className="val-body">
              <div className="val-section">{iss.section}</div>
              <div className="val-msg">{iss.msg}</div>
              <div className="val-fix">
                <Icon name="sparkles" size={10} /> {iss.fix}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Push to GitHub modal-step ==============
function GithubPushView({ spec, markdown, onBack }) {
  const githubPat = useSettingsStore((s) => s.githubPat);
  const tokenOk = githubConfigured(githubPat);

  const slug = spec.overview.name.toLowerCase().replace(/[^\w]+/g, "-");
  const [step, setStep] = useState("config"); // config | pushing | done | error
  const [repo, setRepo] = useState("your-username/" + slug);
  const [branch, setBranch] = useState(
    `architect/${slug}-${new Date().toISOString().slice(0, 10)}`,
  );
  const [commitMsg, setCommitMsg] = useState(`docs: update CLAUDE.md from Architect spec`);
  const [createPr, setCreatePr] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const push = async () => {
    setError(null);
    if (!tokenOk) {
      setError("Add a GitHub personal access token in Settings → GitHub before pushing.");
      return;
    }
    const parts = repo.trim().split("/").filter(Boolean);
    if (parts.length !== 2) {
      setError("Repository must be in `owner/repo` format.");
      return;
    }
    const [owner, repoName] = parts;

    setStep("pushing");
    try {
      const r = await pushClaudeMd({
        token: githubPat,
        owner,
        repo: repoName,
        branch: branch.trim(),
        content: markdown,
        commitMessage: commitMsg.trim() || "docs: update CLAUDE.md from Architect spec",
        createPr,
        prTitle: commitMsg.trim() || "Spec update from Architect",
        prBody:
          "Spec, canvas, and diagram updates from [Architect](https://github.com/your-username/architect). Generated CLAUDE.md attached.",
      });
      setResult(r);
      setStep("done");
    } catch (err) {
      setError(err?.message ?? String(err));
      setStep("error");
    }
  };

  if (step === "pushing") {
    return (
      <div className="gh-pane">
        <div className="gh-spinner"></div>
        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 18 }}>Pushing to {repo}…</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
          Resolving default branch · creating <span className="mono">{branch}</span> · committing
          CLAUDE.md{createPr ? " · opening PR" : ""}
        </div>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="gh-pane">
        <div className="gh-success">
          <Icon name="check" size={32} />
        </div>
        <div
          style={{ fontSize: 18, fontWeight: 600, marginTop: 14, fontFamily: "var(--font-serif)" }}
        >
          Pushed successfully
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            marginTop: 6,
            textAlign: "center",
            maxWidth: 420,
          }}
        >
          {result.prUrl ? (
            <>
              CLAUDE.md committed to <span className="mono">{result.branch}</span> and a pull
              request was opened against <span className="mono">{result.defaultBranch}</span>.
            </>
          ) : (
            <>
              CLAUDE.md committed to <span className="mono">{result.branch}</span>. Open the branch
              on GitHub to review or merge.
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 22,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {result.prUrl && (
            <a className="btn btn-primary" href={result.prUrl} target="_blank" rel="noreferrer">
              <Icon name="extLink" size={13} />
              <span>Open pull request</span>
            </a>
          )}
          {result.fileUrl && (
            <a className="btn" href={result.fileUrl} target="_blank" rel="noreferrer">
              <Icon name="extLink" size={13} />
              <span>View CLAUDE.md</span>
            </a>
          )}
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Back to export
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gh-pane" style={{ alignItems: "stretch", padding: "24px 32px" }}>
      <div style={{ marginBottom: 18 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack} style={{ marginBottom: 10 }}>
          <Icon name="chevL" size={12} /> Back
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--font-serif)" }}>
          Push to GitHub
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
          Architect creates a new branch, commits <span className="mono">CLAUDE.md</span> with your
          spec, and (optionally) opens a pull request. Uses the GitHub token you added in Settings;
          all calls go directly from your browser to <span className="mono">api.github.com</span>.
        </div>
      </div>

      {!tokenOk && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "color-mix(in oklab, var(--rose, #fb7185) 12%, transparent)",
            border: "1px solid color-mix(in oklab, var(--rose, #fb7185) 30%, transparent)",
            color: "var(--ink-1)",
            fontSize: 12.5,
            marginBottom: 14,
          }}
        >
          <strong>No GitHub token configured.</strong> Add one under{" "}
          <strong>Settings → GitHub</strong>. Need help generating one?{" "}
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-ink)" }}
          >
            Create a fine-grained PAT
          </a>{" "}
          with <span className="mono">Contents: read+write</span> and{" "}
          <span className="mono">Pull requests: read+write</span>.
        </div>
      )}

      <label className="field-label">Repository</label>
      <div className="input-row" style={{ marginBottom: 14 }}>
        <span className="gh-prefix">github.com/</span>
        <input
          className="field-input api"
          style={{ flex: 1 }}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo"
        />
      </div>

      <label className="field-label">Target file</label>
      <div className="gh-file" style={{ marginBottom: 14 }}>
        <Icon name="folder" size={13} />
        <span className="mono">{repo}/</span>
        <span className="mono" style={{ color: "var(--accent-ink)", fontWeight: 500 }}>
          CLAUDE.md
        </span>
        <span className="proj-tag" style={{ marginLeft: "auto" }}>
          create or update
        </span>
      </div>

      <label className="field-label">Branch</label>
      <input
        className="field-input api"
        style={{ marginBottom: 14 }}
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
      />

      <label className="field-label">Commit message</label>
      <input
        className="field-input"
        style={{ marginBottom: 14 }}
        value={commitMsg}
        onChange={(e) => setCommitMsg(e.target.value)}
      />

      <label
        className="field-label"
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
      >
        <input type="checkbox" checked={createPr} onChange={(e) => setCreatePr(e.target.checked)} />
        <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--ink-1)" }}>
          Open pull request after commit
        </span>
      </label>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 8,
            background: "color-mix(in oklab, var(--rose, #fb7185) 14%, transparent)",
            border: "1px solid color-mix(in oklab, var(--rose, #fb7185) 35%, transparent)",
            color: "var(--ink-1)",
            fontSize: 12.5,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ flex: 1 }}
          onClick={push}
          disabled={!tokenOk}
        >
          <Icon name="git" size={14} />
          <span>Push to GitHub</span>
        </button>
      </div>
    </div>
  );
}

// ============== Main preview modal ==============
function PreviewModal({ spec, nodes, edges, diagramType, onClose, onCopy }) {
  const [tab, setTab] = useState("md"); // md | mermaid | json | xml | ascii | validation
  const [view, setView] = useState("preview"); // preview | github
  const [copied, setCopied] = useState(false);
  const [includeMermaid, setIncludeMermaid] = useState(true);
  const [includeAscii, setIncludeAscii] = useState(false);

  const mermaid = useMemo(
    () => ArchitectExport.toMermaid(diagramType, nodes, edges),
    [diagramType, nodes, edges],
  );
  const ascii = useMemo(() => ArchitectExport.toAscii(nodes, edges), [nodes, edges]);
  const md = useMemo(
    () => ArchitectExport.toClaudeMd(spec, mermaid, includeMermaid, includeAscii, ascii),
    [spec, mermaid, includeMermaid, includeAscii, ascii],
  );
  const json = useMemo(
    () =>
      JSON.stringify(ArchitectExport.toStructuredJSON(spec, nodes, edges, diagramType), null, 2),
    [spec, nodes, edges, diagramType],
  );
  const xml = useMemo(() => ArchitectExport.toXML(spec, nodes, edges), [spec, nodes, edges]);
  const validation = useMemo(
    () => ArchitectExport.validate(spec, nodes, edges),
    [spec, nodes, edges],
  );

  const currentText = useMemo(() => {
    switch (tab) {
      case "md":
        return md;
      case "mermaid":
        return mermaid;
      case "json":
        return json;
      case "xml":
        return xml;
      case "ascii":
        return ascii;
      default:
        return md;
    }
  }, [tab, md, mermaid, json, xml, ascii]);

  const tokens = useMemo(() => ArchitectExport.estimateTokens(currentText), [currentText]);

  const copy = () => {
    try {
      navigator.clipboard?.writeText(currentText);
    } catch (e) {
      /* clipboard might not be available */
    }
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const ext = { md: "md", mermaid: "mmd", json: "json", xml: "xml", ascii: "txt" }[tab] || "txt";
    const filename = `${spec.overview.name.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    const blob = new Blob([currentText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Export project"
      >
        <div className="modal-head">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--accent-soft)",
              display: "grid",
              placeItems: "center",
              color: "var(--accent-ink)",
            }}
          >
            <Icon name="sparkles" size={15} />
          </div>
          <div>
            <h2>Export — {spec.overview.name}</h2>
            <div className="sub">
              ~{tokens.toLocaleString()} tokens ·{" "}
              {validation.issues.length === 0
                ? "valid"
                : `${validation.issues.length} issue${validation.issues.length === 1 ? "" : "s"}`}{" "}
              · ready for Claude Code
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        {view === "github" ? (
          <GithubPushView spec={spec} markdown={md} onBack={() => setView("preview")} />
        ) : (
          <>
            <div className="modal-subhead">
              <div className="modal-tabs">
                {[
                  { id: "md", label: "CLAUDE.md" },
                  { id: "mermaid", label: "Mermaid" },
                  { id: "json", label: "JSON" },
                  { id: "xml", label: "XML" },
                  { id: "ascii", label: "ASCII" },
                  { id: "validation", label: "Validate", count: validation.issues.length },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={"modal-tab" + (tab === t.id ? " active" : "")}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                    {t.count !== undefined && t.count > 0 && (
                      <span className="modal-tab-count">{t.count}</span>
                    )}
                  </button>
                ))}
              </div>
              {tab === "md" && (
                <div className="modal-options">
                  <label className="opt-check">
                    <input
                      type="checkbox"
                      checked={includeMermaid}
                      onChange={(e) => setIncludeMermaid(e.target.checked)}
                    />
                    <span>Mermaid</span>
                  </label>
                  <label className="opt-check">
                    <input
                      type="checkbox"
                      checked={includeAscii}
                      onChange={(e) => setIncludeAscii(e.target.checked)}
                    />
                    <span>ASCII</span>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-body">
              {tab === "md" && <pre className="code-pane">{highlightMarkdown(md)}</pre>}
              {tab === "mermaid" && <pre className="code-pane">{highlightMermaid(mermaid)}</pre>}
              {tab === "json" && (
                <pre
                  className="code-pane"
                  dangerouslySetInnerHTML={{ __html: highlightJSON(json) }}
                />
              )}
              {tab === "xml" && (
                <pre
                  className="code-pane"
                  dangerouslySetInnerHTML={{ __html: highlightXML(xml) }}
                />
              )}
              {tab === "ascii" && <pre className="code-pane">{ascii}</pre>}
              {tab === "validation" && <ValidationPanel {...validation} />}
            </div>

            <div className="modal-foot" style={{ flexWrap: "wrap", gap: 8 }}>
              <span className="meta">/init · /plan · /build · /spec</span>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={download}>
                <Icon name="download" size={13} />
                <span>Download</span>
              </button>
              <button className="btn" onClick={copy}>
                <Icon name={copied ? "check" : "copy"} size={13} />
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                className="btn"
                onClick={async () => {
                  await copyClaudeCodeSnippet(md);
                  downloadAsClaudeMd(md);
                  toast.success("CLAUDE.md downloaded · CLI snippet copied");
                }}
                title="Download CLAUDE.md and copy a shell snippet to start a Claude Code session"
              >
                <Icon name="terminal" size={13} />
                <span>Open in Claude Code</span>
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const ok = await openInClaudeAi(md);
                  if (ok) toast.success("Spec copied — paste into Claude.ai");
                  else
                    toast.warning("claude.ai opened — copy the spec manually with the Copy button");
                }}
                title="Open a new claude.ai chat with the spec on your clipboard"
              >
                <ClaudeMark size={14} />
                <span>Open in Claude.ai</span>
                <Icon name="extLink" size={11} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { PreviewModal };
