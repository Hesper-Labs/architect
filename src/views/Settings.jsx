import { useState } from "react";
import { Icon, ClaudeMark } from "../data/icons.jsx";
import { useSettingsStore } from "../store/settings.js";

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!on}
      className={"toggle" + (on ? " on" : "")}
      onClick={() => onChange(!on)}
    />
  );
}

function SecretField({ value, onSave, onClear, placeholder }) {
  const [draft, setDraft] = useState(value);
  const [revealed, setRevealed] = useState(false);
  const dirty = draft !== value;

  const save = () => {
    if (dirty) onSave(draft.trim());
  };

  const clear = () => {
    setDraft("");
    onClear();
  };

  return (
    <div className="input-row" style={{ gap: 8 }}>
      <input
        className="field-input api"
        type={revealed ? "text" : "password"}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        style={{ width: 280 }}
        autoComplete="off"
        spellCheck="false"
      />
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        onClick={() => setRevealed((r) => !r)}
        title={revealed ? "Hide" : "Show"}
      >
        <Icon name={revealed ? "lock" : "eye"} size={12} />
      </button>
      <button type="button" className="btn btn-sm" onClick={save} disabled={!dirty}>
        Save
      </button>
      {value && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={clear}>
          Clear
        </button>
      )}
    </div>
  );
}

function Settings() {
  const settings = useSettingsStore();
  const { update, setApiKey, setGithubPat } = settings;
  const connected = Boolean(settings.apiKey);
  const githubConnected = Boolean(settings.githubPat);

  return (
    <div className="scroll">
      <div className="settings">
        <h1>Settings</h1>
        <p className="lede">
          Manage integrations, defaults, and how specs are exported. Everything is stored locally in
          your browser.
        </p>

        {/* Claude integration */}
        <div className="set-group">
          <div className="set-group-head">
            <div className="ico">
              <ClaudeMark size={16} />
            </div>
            <h3>Claude API</h3>
          </div>

          <div className="connection">
            <div className="conn-ico">
              <ClaudeMark size={20} />
            </div>
            <div className="conn-text">
              <div className="conn-name">Anthropic API</div>
              <div className="conn-status">
                <span className={"dot " + (connected ? "live" : "")} />{" "}
                {connected ? "Connected" : "Not configured — AI panels show sample responses"}
              </div>
            </div>
          </div>

          <div className="set-row">
            <div>
              <div className="lbl">Anthropic API key</div>
              <div className="desc">
                Bring your own key. Stored only in your browser&apos;s localStorage. Never sent
                anywhere except api.anthropic.com when you use the AI features.
              </div>
            </div>
            <SecretField
              value={settings.apiKey}
              onSave={(k) => setApiKey(k)}
              onClear={() => setApiKey("")}
              placeholder="sk-ant-api03-…"
            />
          </div>

          <div className="set-row" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="lbl">No API key? Use claude.ai or Claude Code instead</div>
              <div className="desc">
                In-app AI panels need an Anthropic API key. If you only have a{" "}
                <strong>claude.ai</strong> subscription or use the <strong>Claude Code CLI</strong>,
                the export panel includes one-click handoff:
                <ul style={{ margin: "8px 0 0 16px", padding: 0, lineHeight: 1.7 }}>
                  <li>
                    <strong>Open in Claude.ai</strong> — copies the spec to your clipboard and opens
                    a new chat. Paste with ⌘V / Ctrl V.
                  </li>
                  <li>
                    <strong>Open in Claude Code</strong> — downloads the spec as{" "}
                    <code>CLAUDE.md</code> and copies a shell snippet (
                    <code>cat &gt; CLAUDE.md … claude</code>) to your clipboard. Drop the file into
                    your project root or paste the snippet into a terminal.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub */}
        <div className="set-group">
          <div className="set-group-head">
            <div className="ico">
              <Icon name="git" size={14} />
            </div>
            <h3>GitHub</h3>
          </div>

          <div className="connection">
            <div className="conn-ico">
              <Icon name="git" size={20} />
            </div>
            <div className="conn-text">
              <div className="conn-name">GitHub REST API</div>
              <div className="conn-status">
                <span className={"dot " + (githubConnected ? "live" : "")} />{" "}
                {githubConnected
                  ? "Token saved — Push to GitHub is enabled"
                  : "Not configured — Push to GitHub is disabled"}
              </div>
            </div>
          </div>

          <div className="set-row">
            <div>
              <div className="lbl">Personal access token</div>
              <div className="desc">
                Required to push <code>CLAUDE.md</code> from the export panel. Stored only in your
                browser&apos;s localStorage and only sent to <code>api.github.com</code>. Use a{" "}
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent-ink)" }}
                >
                  fine-grained PAT
                </a>{" "}
                limited to the repos you want to push to, with <code>Contents: read+write</code> and{" "}
                <code>Pull requests: read+write</code>. Classic <code>ghp_</code> tokens with the{" "}
                <code>repo</code> scope also work.
              </div>
            </div>
            <SecretField
              value={settings.githubPat}
              onSave={(p) => setGithubPat(p)}
              onClear={() => setGithubPat("")}
              placeholder="github_pat_… or ghp_…"
            />
          </div>
        </div>

        {/* Export defaults */}
        <div className="set-group">
          <div className="set-group-head">
            <div className="ico">
              <Icon name="download" size={14} />
            </div>
            <h3>Export defaults</h3>
          </div>

          <div className="set-row">
            <div>
              <div className="lbl">Include Mermaid diagrams</div>
              <div className="desc">Embed graph/flowchart syntax in the exported Markdown.</div>
            </div>
            <Toggle on={settings.includeMermaid} onChange={(v) => update({ includeMermaid: v })} />
          </div>

          <div className="set-row">
            <div>
              <div className="lbl">Include ASCII fallback</div>
              <div className="desc">For agents without Mermaid renderers.</div>
            </div>
            <Toggle on={settings.includeAscii} onChange={(v) => update({ includeAscii: v })} />
          </div>
        </div>

        {/* Workspace */}
        <div className="set-group">
          <div className="set-group-head">
            <div className="ico">
              <Icon name="sliders" size={14} />
            </div>
            <h3>Workspace</h3>
          </div>

          <div className="set-row">
            <div>
              <div className="lbl">Auto-save</div>
              <div className="desc">
                Architect saves your spec, canvas, and diagram type to local storage 600 ms after
                each edit. Auto-save can&apos;t be turned off — for permanent backups, export the
                project as JSON from the dashboard.
              </div>
            </div>
            <span className="proj-tag">Always on</span>
          </div>

          <div className="set-row">
            <div>
              <div className="lbl">Theme</div>
              <div className="desc">
                Switch between dark and light themes from the Tweaks panel (bottom-right). Accent
                color and grid visibility live there too.
              </div>
            </div>
            <span className="proj-tag">{settings.tweaks.theme}</span>
          </div>
        </div>

        {/* Storage */}
        <div className="set-group">
          <div className="set-group-head">
            <div className="ico">
              <Icon name="db" size={14} />
            </div>
            <h3>Storage</h3>
          </div>
          <div className="set-row">
            <div>
              <div className="lbl">Local storage backend</div>
              <div className="desc">
                Projects and settings live in <code>localStorage</code> under the{" "}
                <code>architect:</code> namespace. Clearing site data wipes everything — export
                projects as JSON to back them up.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Settings };
