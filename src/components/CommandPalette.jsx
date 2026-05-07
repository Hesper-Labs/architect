import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../data/icons.jsx";

/**
 * Command palette — Cmd/Ctrl+K to open. Shows a fuzzy-searched list of
 * actions plus the user's recent projects.
 */
function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const haystack = `${c.title} ${c.section ?? ""} ${c.keywords ?? ""}`.toLowerCase();
      return q.split(/\s+/).every((tok) => haystack.includes(tok));
    });
  }, [commands, query]);

  const grouped = useMemo(() => {
    const out = new Map();
    for (const c of filtered) {
      const key = c.section || "Actions";
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(c);
    }
    return [...out.entries()];
  }, [filtered]);

  // Flat index → group index mapping for keyboard navigation
  const flatIndex = useMemo(() => {
    const map = [];
    for (const [section, items] of grouped) {
      for (const c of items) map.push({ section, c });
    }
    return map;
  }, [grouped]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => Math.min(flatIndex.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = flatIndex[selected]?.c;
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flatIndex, selected, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-cmd-index="${selected}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  return (
    <div
      className="modal-scrim"
      onClick={onClose}
      style={{
        background: "rgba(8, 6, 5, 0.7)",
        backdropFilter: "blur(6px)",
        alignItems: "flex-start",
        paddingTop: "12vh",
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          width: "min(560px, 92vw)",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Icon name="search" size={14} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, project, or action…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink-0)",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
            }}
          />
          <kbd
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--ink-3)",
              padding: "2px 6px",
              border: "1px solid var(--line)",
              borderRadius: 4,
            }}
          >
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "6px 6px 8px",
          }}
        >
          {flatIndex.length === 0 ? (
            <div
              style={{
                padding: "30px 16px",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No matches for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            grouped.map(([section, items]) => (
              <div key={section} style={{ marginTop: 4 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: "var(--ink-3)",
                    textTransform: "uppercase",
                    letterSpacing: 0.05,
                    padding: "6px 10px 4px",
                  }}
                >
                  {section}
                </div>
                {items.map((c) => {
                  const idx = flatIndex.findIndex((f) => f.c === c);
                  const active = idx === selected;
                  return (
                    <button
                      key={c.id}
                      data-cmd-index={idx}
                      type="button"
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => {
                        c.run();
                        onClose();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: active ? "var(--bg-2)" : "transparent",
                        color: "var(--ink-0)",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 5,
                          background: "var(--bg-2)",
                          color: "var(--ink-2)",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={c.icon || "sparkles"} size={12} />
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.title}
                      </span>
                      {c.shortcut && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10.5,
                            color: "var(--ink-3)",
                          }}
                        >
                          {c.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 14px",
            borderTop: "1px solid var(--line)",
            background: "var(--bg-1)",
            fontSize: 11,
            color: "var(--ink-3)",
          }}
        >
          <span>
            <kbd className="kbd-inline">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd-inline">↵</kbd> select
          </span>
          <span style={{ flex: 1 }} />
          <span>{flatIndex.length} matches</span>
        </div>
      </div>
    </div>
  );
}

export { CommandPalette };
