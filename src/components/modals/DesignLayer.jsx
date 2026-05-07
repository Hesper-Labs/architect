import { useState } from "react";
import { Icon } from "../../data/icons.jsx";
import { DESIGN_TOKENS, COMPONENT_INVENTORY, ASSETS, BREAKPOINTS } from "../../data/design-data.js";

function TokenSwatch({ token }) {
  return (
    <div className="token-row">
      <div className="token-chip" style={{ background: token.value }}></div>
      <div className="token-meta">
        <div className="token-name">{token.name}</div>
        <div className="token-val">{token.value}</div>
      </div>
      <div className="token-role">{token.role}</div>
    </div>
  );
}

function TypeSpecimen({ token }) {
  const [family, weight] =
    token.value.split(" · ").length >= 2
      ? [token.value.split(" · ")[0], token.value.split(" · ")[2] || "400"]
      : ["Inter", "400"];
  return (
    <div className="type-row">
      <div className="type-meta">
        <div className="token-name">{token.name}</div>
        <div className="token-val">{token.value}</div>
      </div>
      <div
        className="type-sample"
        style={{
          fontFamily: family.includes("Mono")
            ? "var(--font-mono)"
            : family.includes("Serif")
              ? "Georgia, serif"
              : "var(--font-sans)",
          fontWeight: parseInt(weight) || 400,
          fontSize:
            token.name === "display"
              ? 28
              : token.name === "h1"
                ? 22
                : token.name === "h2"
                  ? 17
                  : token.name === "caption"
                    ? 12
                    : 14,
        }}
      >
        {token.sample}
      </div>
    </div>
  );
}

function SpacingBar({ token }) {
  const px = parseInt(token.value);
  return (
    <div className="spacing-row">
      <div className="token-name" style={{ width: 28 }}>
        {token.name}
      </div>
      <div className="spacing-bar" style={{ width: px || 1 }}></div>
      <div className="token-val">{token.value}</div>
    </div>
  );
}

function RadiusSample({ token }) {
  const px = token.value === "999px" ? 999 : parseInt(token.value);
  return (
    <div className="radius-row">
      <div className="radius-box" style={{ borderRadius: px }}></div>
      <div className="token-meta">
        <div className="token-name">{token.name}</div>
        <div className="token-val">{token.value}</div>
      </div>
    </div>
  );
}

function ShadowSample({ token }) {
  return (
    <div className="radius-row">
      <div
        className="radius-box"
        style={{ background: "var(--bg-1)", boxShadow: token.value, borderColor: "transparent" }}
      ></div>
      <div className="token-meta">
        <div className="token-name">{token.name}</div>
        <div className="token-val" style={{ fontSize: 10 }}>
          {token.value}
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ comp }) {
  return (
    <div className="comp-row">
      <div className="comp-name-cell">
        <div className="comp-name">{comp.name}</div>
        <div className="comp-used">used {comp.used}×</div>
      </div>
      <div className="comp-variants">
        {comp.variants.map((v) => (
          <span key={v} className="comp-tag">
            {v}
          </span>
        ))}
      </div>
      <div className="comp-states">
        {comp.states.map((s) => (
          <span key={s} className={"comp-state-dot state-" + s}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function AssetCard({ asset, kind }) {
  return (
    <div className="asset-card">
      <div className={"asset-thumb thumb-" + kind}>
        <Icon
          name={
            kind === "logos"
              ? "sparkles"
              : kind === "icons"
                ? "grid"
                : kind === "illustrations"
                  ? "eye"
                  : "folder"
          }
          size={20}
        />
      </div>
      <div className="asset-name">{asset.name}</div>
      <div className="asset-meta">
        {asset.type} · {asset.size}
      </div>
      <div className="asset-note">{asset.note}</div>
    </div>
  );
}

function DesignLayer({ onClose }) {
  const [tab, setTab] = useState("tokens");
  const [tokenCat, setTokenCat] = useState("color");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(1200px, 96vw)", height: "min(820px, 92vh)" }}
      >
        <div className="modal-head">
          <div>
            <div className="modal-title">Design layer</div>
            <div className="modal-sub">
              Tokens, components, breakpoints, and assets — synced with the spec
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="dl-tabs">
          {[
            { id: "tokens", label: "Design tokens", icon: "palette" },
            { id: "components", label: "Component inventory", icon: "grid" },
            { id: "breakpoints", label: "Breakpoints", icon: "device" },
            { id: "assets", label: "Assets", icon: "folder" },
          ].map((t) => (
            <button
              key={t.id}
              className={"dl-tab" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={13} />
              <span>{t.label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-sm btn-ghost">
            <Icon name="download" size={12} /> Export tokens
          </button>
          <button className="btn btn-sm">
            <Icon name="plus" size={12} /> Sync to Figma
          </button>
        </div>

        <div className="dl-body">
          {tab === "tokens" && (
            <div className="dl-tokens">
              <div className="dl-side">
                {[
                  { id: "color", label: "Color", count: DESIGN_TOKENS.color.length },
                  { id: "type", label: "Typography", count: DESIGN_TOKENS.type.length },
                  { id: "spacing", label: "Spacing", count: DESIGN_TOKENS.spacing.length },
                  { id: "radius", label: "Radius", count: DESIGN_TOKENS.radius.length },
                  { id: "shadow", label: "Shadow", count: DESIGN_TOKENS.shadow.length },
                ].map((c) => (
                  <button
                    key={c.id}
                    className={"dl-side-btn" + (tokenCat === c.id ? " active" : "")}
                    onClick={() => setTokenCat(c.id)}
                  >
                    <span>{c.label}</span>
                    <span className="pill">{c.count}</span>
                  </button>
                ))}
              </div>
              <div className="dl-content scroll">
                {tokenCat === "color" &&
                  DESIGN_TOKENS.color.map((t) => <TokenSwatch key={t.name} token={t} />)}
                {tokenCat === "type" &&
                  DESIGN_TOKENS.type.map((t) => <TypeSpecimen key={t.name} token={t} />)}
                {tokenCat === "spacing" &&
                  DESIGN_TOKENS.spacing.map((t) => <SpacingBar key={t.name} token={t} />)}
                {tokenCat === "radius" && (
                  <div className="dl-grid">
                    {DESIGN_TOKENS.radius.map((t) => (
                      <RadiusSample key={t.name} token={t} />
                    ))}
                  </div>
                )}
                {tokenCat === "shadow" && (
                  <div className="dl-grid">
                    {DESIGN_TOKENS.shadow.map((t) => (
                      <ShadowSample key={t.name} token={t} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "components" && (
            <div className="dl-content scroll" style={{ padding: 20 }}>
              {COMPONENT_INVENTORY.map((cat) => (
                <div key={cat.category} className="comp-category">
                  <div className="comp-cat-head">
                    <span>{cat.category}</span>
                    <span className="pill">{cat.components.length}</span>
                  </div>
                  <div className="comp-table">
                    <div className="comp-thead">
                      <div>Component</div>
                      <div>Variants</div>
                      <div>States</div>
                    </div>
                    {cat.components.map((c) => (
                      <ComponentRow key={c.name} comp={c} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "breakpoints" && (
            <div className="dl-content scroll" style={{ padding: 20 }}>
              <div className="bp-table">
                <div className="bp-thead">
                  <div>Name</div>
                  <div>Min</div>
                  <div>Max</div>
                  <div>Cols</div>
                  <div>Gutter</div>
                  <div>Preview</div>
                </div>
                {BREAKPOINTS.map((bp) => (
                  <div key={bp.name} className="bp-row">
                    <div className="bp-name">{bp.name}</div>
                    <div className="token-val">{bp.min}</div>
                    <div className="token-val">{bp.max}</div>
                    <div>{bp.cols} cols</div>
                    <div className="token-val">{bp.gutter}</div>
                    <div className="bp-preview">
                      {Array.from({ length: bp.cols }).map((_, i) => (
                        <span key={i} className="bp-col"></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--ink-3)" }}>
                Layout grid is fluid within column gutters. Components above <code>tablet</code> opt
                into 2-column splits; above <code>desktop</code> the sidebar becomes persistent.
              </div>
            </div>
          )}

          {tab === "assets" && (
            <div className="dl-content scroll" style={{ padding: 20 }}>
              {Object.entries(ASSETS).map(([kind, list]) => (
                <div key={kind} className="comp-category">
                  <div className="comp-cat-head">
                    <span style={{ textTransform: "capitalize" }}>{kind}</span>
                    <span className="pill">{list.length}</span>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-sm btn-ghost">
                      <Icon name="plus" size={11} /> Add
                    </button>
                  </div>
                  <div className="dl-asset-grid">
                    {list.map((a) => (
                      <AssetCard key={a.name} asset={a} kind={kind} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DesignLayer };
