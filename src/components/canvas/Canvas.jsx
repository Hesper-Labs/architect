import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "../../data/icons.jsx";

// ============== Node type registry ==============
const NODE_TYPES = {
  // System architecture
  user: { icon: "user", color: "var(--green)", defaultLabel: "Client" },
  api: { icon: "api", color: "var(--accent)", defaultLabel: "API" },
  fn: { icon: "fn", color: "var(--accent)", defaultLabel: "Service" },
  db: { icon: "db", color: "var(--blue)", defaultLabel: "Database" },
  cloud: { icon: "cloud", color: "var(--violet)", defaultLabel: "External" },
  queue: { icon: "queue", color: "var(--rose)", defaultLabel: "Queue" },
  box: { icon: "box", color: "var(--ink-2)", defaultLabel: "Component" },
  // ER diagram
  entity: { icon: "er", color: "var(--blue)", defaultLabel: "Entity" },
  // State machine
  state: { icon: "state", color: "var(--accent)", defaultLabel: "State" },
  initial: { icon: "state", color: "var(--green)", defaultLabel: "Start" },
  final: { icon: "state", color: "var(--rose)", defaultLabel: "End" },
  // Sequence
  actor: { icon: "user", color: "var(--green)", defaultLabel: "Actor" },
  system: { icon: "box", color: "var(--accent)", defaultLabel: "System" },
  // Component tree
  component: { icon: "tree", color: "var(--accent)", defaultLabel: "Component" },
  // Free-form annotation
  note: { icon: "text", color: "var(--amber, #f59e0b)", defaultLabel: "Note" },
};

const NODE_W = 156;
const NODE_H = 60;
const PORT_R = 5;

// ============== Helpers ==============
function uid(prefix = "n") {
  return prefix + "_" + Math.random().toString(36).slice(2, 8);
}

// snap to grid 8
const snap = (v) => Math.round(v / 8) * 8;

// ============== Single node ==============
function CanvasNode({
  node,
  selected,
  hovered,
  dimmed,
  onMouseDown,
  onPortDown,
  onPortUp,
  onDoubleClick,
  editing,
  onLabelChange,
  onLabelCommit,
}) {
  const meta = NODE_TYPES[node.type] || NODE_TYPES.box;
  const isNote = node.type === "note";

  const cls = [
    "node",
    isNote && "node-note",
    selected && "selected",
    hovered && "hovered",
    dimmed && "dimmed",
    editing && "editing",
  ]
    .filter(Boolean)
    .join(" ");

  // Sticky note: yellow card, soft shadow, slight tilt, no ports.
  const noteStyle = isNote
    ? {
        background: "#fff5cc",
        color: "#3a2e0c",
        border: "1px solid rgba(120, 90, 0, 0.25)",
        boxShadow: "0 6px 16px -6px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.6) inset",
        transform: `rotate(${((node.id?.charCodeAt(node.id.length - 1) || 0) % 5) - 2 * 0.4}deg)`,
        minHeight: 80,
      }
    : {};

  return (
    <div
      className={cls}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        ["--node-color"]: meta.color,
        ...noteStyle,
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(node.id);
      }}
      data-node-id={node.id}
    >
      {!isNote && (
        <span
          className="node-port left"
          onMouseDown={(e) => {
            e.stopPropagation();
            onPortDown(e, node.id, "in");
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onPortUp(e, node.id, "in");
          }}
        />
      )}
      <div className="node-head">
        {!isNote && (
          <span className="ico" style={{ color: meta.color }}>
            <Icon name={meta.icon} size={13} />
          </span>
        )}
        {editing ? (
          <input
            autoFocus
            className="node-label-input"
            value={node.label}
            onChange={(e) => onLabelChange(node.id, e.target.value)}
            onBlur={() => onLabelCommit(node.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onLabelCommit(node.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="node-label">{node.label}</span>
        )}
      </div>
      {node.sub && <div className="node-body">{node.sub}</div>}
      {!isNote && (
        <span
          className="node-port right"
          onMouseDown={(e) => {
            e.stopPropagation();
            onPortDown(e, node.id, "out");
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onPortUp(e, node.id, "out");
          }}
        />
      )}
    </div>
  );
}

// ============== Edge path ==============
function edgePath(fx, fy, tx, ty) {
  const dx = Math.max(40, Math.abs(tx - fx) * 0.5);
  return `M ${fx} ${fy} C ${fx + dx} ${fy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

function CanvasEdge({ edge, from, to, selected, onSelect, onDelete }) {
  const fx = from.x + NODE_W;
  const fy = from.y + NODE_H / 2;
  const tx = to.x;
  const ty = to.y + NODE_H / 2;
  const d = edgePath(fx, fy, tx, ty);
  const mid = { x: (fx + tx) / 2, y: (fy + ty) / 2 };

  return (
    <g
      className={"edge" + (selected ? " selected" : "")}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(edge.id);
      }}
    >
      {/* hit area */}
      <path d={d} stroke="transparent" strokeWidth="14" fill="none" style={{ cursor: "pointer" }} />
      <path d={d} className="edge-stroke" fill="none" />
      {edge.label && (
        <g transform={`translate(${mid.x}, ${mid.y})`}>
          <rect x="-32" y="-9" width="64" height="18" rx="4" className="edge-label-bg" />
          <text className="edge-label-text" textAnchor="middle" dominantBaseline="middle">
            {edge.label}
          </text>
        </g>
      )}
      <circle cx={tx} cy={ty} r="3" className="edge-arrow" />
      {selected && (
        <foreignObject x={mid.x - 14} y={mid.y - 30} width="28" height="22">
          <button
            className="edge-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(edge.id);
            }}
            title="Delete edge"
          >
            ×
          </button>
        </foreignObject>
      )}
    </g>
  );
}

// ============== Marquee selection ==============
function Marquee({ rect }) {
  if (!rect) return null;
  const x = Math.min(rect.x1, rect.x2);
  const y = Math.min(rect.y1, rect.y2);
  const w = Math.abs(rect.x2 - rect.x1);
  const h = Math.abs(rect.y2 - rect.y1);
  return <div className="marquee" style={{ left: x, top: y, width: w, height: h }} />;
}

// ============== Auto-layout (hierarchical, left-to-right) ==============
function autoLayout(nodes, edges) {
  // Build adjacency
  const incoming = {};
  const outgoing = {};
  nodes.forEach((n) => {
    incoming[n.id] = [];
    outgoing[n.id] = [];
  });
  edges.forEach((e) => {
    if (outgoing[e.from] && incoming[e.to]) {
      outgoing[e.from].push(e.to);
      incoming[e.to].push(e.from);
    }
  });
  // Assign columns via BFS from sources
  const col = {};
  const sources = nodes.filter((n) => incoming[n.id].length === 0).map((n) => n.id);
  const queue = sources.map((id) => ({ id, c: 0 }));
  sources.forEach((id) => (col[id] = 0));
  while (queue.length) {
    const { id, c } = queue.shift();
    outgoing[id].forEach((t) => {
      const nc = c + 1;
      if (col[t] === undefined || nc > col[t]) {
        col[t] = nc;
        queue.push({ id: t, c: nc });
      }
    });
  }
  // unconnected nodes go to column 0
  nodes.forEach((n) => {
    if (col[n.id] === undefined) col[n.id] = 0;
  });

  // Group by column
  const cols = {};
  nodes.forEach((n) => {
    cols[col[n.id]] = cols[col[n.id]] || [];
    cols[col[n.id]].push(n.id);
  });

  // Place
  const colW = NODE_W + 100;
  const rowH = NODE_H + 30;
  const placed = nodes.map((n) => {
    const c = col[n.id];
    const idx = cols[c].indexOf(n.id);
    const total = cols[c].length;
    const x = 60 + c * colW;
    const y = 80 + idx * rowH - ((total - 1) * rowH) / 2 + 200;
    return { ...n, x: snap(x), y: snap(y) };
  });
  return placed;
}

// ============== Sequence diagram renderer ==============
function SequenceCanvas({ actors, messages, viewport }) {
  const lifelineY = 60;
  const lifelineH = 420;
  const actorW = 140;
  const actorGap = 80;
  const startY = 100;
  const msgGap = 50;

  return (
    <div className="seq-canvas">
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {actors.map((a, i) => {
          const x = 80 + i * (actorW + actorGap) + actorW / 2;
          return (
            <g key={a.id}>
              <line
                x1={x}
                y1={lifelineY + 36}
                x2={x}
                y2={lifelineY + lifelineH}
                stroke="var(--line-strong)"
                strokeDasharray="4,4"
                strokeWidth="1.2"
              />
            </g>
          );
        })}
        {messages.map((m, i) => {
          const fi = actors.findIndex((a) => a.id === m.from);
          const ti = actors.findIndex((a) => a.id === m.to);
          if (fi < 0 || ti < 0) return null;
          const fx = 80 + fi * (actorW + actorGap) + actorW / 2;
          const tx = 80 + ti * (actorW + actorGap) + actorW / 2;
          const y = startY + i * msgGap;
          const dir = tx > fx ? 1 : -1;
          return (
            <g key={m.id}>
              <line
                x1={fx}
                y1={y}
                x2={tx}
                y2={y}
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeDasharray={m.kind === "return" ? "4,3" : "0"}
              />
              <polygon
                points={`${tx},${y} ${tx - 8 * dir},${y - 4} ${tx - 8 * dir},${y + 4}`}
                fill="var(--accent)"
              />
              <text
                x={(fx + tx) / 2}
                y={y - 6}
                textAnchor="middle"
                fill="var(--ink-1)"
                fontSize="11"
                fontFamily="var(--font-sans)"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "relative", display: "flex", gap: actorGap, padding: "20px 80px" }}>
        {actors.map((a) => (
          <div key={a.id} className="seq-actor" style={{ width: actorW }}>
            <Icon name={NODE_TYPES[a.type]?.icon || "user"} size={14} />
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Main canvas (interactive) ==============
function CanvasArea({
  diagramType,
  nodes,
  setNodes,
  edges,
  setEdges,
  selected,
  setSelected, // {nodes: [...ids], edges: [...ids]}
  showGrid,
  tool,
  setTool,
  zoom,
  setZoom,
  pan,
  setPan,
}) {
  const wrapRef = useRef(null);
  const [drag, setDrag] = useState(null); // dragging nodes: {ids, startX, startY, origs}
  const [marquee, setMarquee] = useState(null);
  const [pending, setPending] = useState(null); // pending edge: {fromId, x, y}
  const [hoverNode, setHoverNode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [panDrag, setPanDrag] = useState(null);
  const [edgeSource, setEdgeSource] = useState(null); // for click-then-click connect tool
  const clipboardRef = useRef(null); // Cmd+C / Cmd+V buffer

  // Convert client → canvas coords
  const clientToCanvas = useCallback(
    (cx, cy) => {
      const rect = wrapRef.current.getBoundingClientRect();
      return {
        x: (cx - rect.left - pan.x) / zoom,
        y: (cy - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom],
  );

  // ============== Mouse: node down ==============
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation();
    if (editingId) return;

    // Connect tool: click two nodes in succession to create an edge between them.
    if (tool === "edge") {
      if (edgeSource == null) {
        setEdgeSource(id);
        setSelected({ nodes: [id], edges: [] });
      } else if (edgeSource !== id) {
        const exists = edges.some((ed) => ed.from === edgeSource && ed.to === id);
        if (!exists) {
          setEdges((prev) => [...prev, { id: uid("e"), from: edgeSource, to: id }]);
        }
        setEdgeSource(null);
        setSelected({ nodes: [], edges: [] });
        setTool("select");
      } else {
        // clicked the same node again — cancel
        setEdgeSource(null);
      }
      return;
    }

    const isMulti = e.shiftKey || e.metaKey || e.ctrlKey;
    const inSelection = selected.nodes.includes(id);

    let newSel = selected;
    if (!inSelection) {
      newSel = isMulti ? { nodes: [...selected.nodes, id], edges: [] } : { nodes: [id], edges: [] };
      setSelected(newSel);
    } else if (isMulti) {
      newSel = { nodes: selected.nodes.filter((n) => n !== id), edges: [] };
      setSelected(newSel);
      return;
    }

    const origs = {};
    newSel.nodes.forEach((nid) => {
      const n = nodes.find((x) => x.id === nid);
      if (n) origs[nid] = { x: n.x, y: n.y };
    });
    const c = clientToCanvas(e.clientX, e.clientY);
    setDrag({ ids: newSel.nodes, startX: c.x, startY: c.y, origs });
  };

  // ============== Port interactions ==============
  const onPortDown = (e, id, side) => {
    if (side !== "out") return; // only drag from out ports
    const node = nodes.find((n) => n.id === id);
    const start = { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
    const c = clientToCanvas(e.clientX, e.clientY);
    setPending({ fromId: id, startX: start.x, startY: start.y, x: c.x, y: c.y });
  };
  const onPortUp = (e, id, side) => {
    if (pending && side === "in" && pending.fromId !== id) {
      const exists = edges.some((ed) => ed.from === pending.fromId && ed.to === id);
      if (!exists) {
        setEdges((prev) => [...prev, { id: uid("e"), from: pending.fromId, to: id }]);
      }
    }
    setPending(null);
  };

  // ============== Background mouse down ==============
  const onBgMouseDown = (e) => {
    if (e.button === 1 || tool === "pan" || e.altKey) {
      // pan
      setPanDrag({ startX: e.clientX, startY: e.clientY, origPan: pan });
      document.body.style.cursor = "grabbing";
      return;
    }
    if (tool === "node") {
      const c = clientToCanvas(e.clientX, e.clientY);
      const newNode = {
        id: uid("n"),
        type: "fn",
        kind: "svc",
        x: snap(c.x - NODE_W / 2),
        y: snap(c.y - NODE_H / 2),
        label: "New service",
        sub: "",
      };
      setNodes((prev) => [...prev, newNode]);
      setSelected({ nodes: [newNode.id], edges: [] });
      setEditingId(newNode.id);
      setTool("select");
      return;
    }
    if (tool === "note") {
      const c = clientToCanvas(e.clientX, e.clientY);
      const newNode = {
        id: uid("note"),
        type: "note",
        kind: "note",
        x: snap(c.x - NODE_W / 2),
        y: snap(c.y - NODE_H / 2),
        label: "New note",
        sub: "",
      };
      setNodes((prev) => [...prev, newNode]);
      setSelected({ nodes: [newNode.id], edges: [] });
      setEditingId(newNode.id);
      setTool("select");
      return;
    }
    // marquee
    setSelected({ nodes: [], edges: [] });
    const c = clientToCanvas(e.clientX, e.clientY);
    setMarquee({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY, cx1: c.x, cy1: c.y });
  };

  // ============== Window mouse move/up ==============
  useEffect(() => {
    const onMove = (e) => {
      if (drag) {
        const c = clientToCanvas(e.clientX, e.clientY);
        const dx = c.x - drag.startX;
        const dy = c.y - drag.startY;
        setNodes((prev) =>
          prev.map((n) => {
            if (drag.origs[n.id]) {
              return { ...n, x: snap(drag.origs[n.id].x + dx), y: snap(drag.origs[n.id].y + dy) };
            }
            return n;
          }),
        );
      }
      if (pending) {
        const c = clientToCanvas(e.clientX, e.clientY);
        setPending((p) => ({ ...p, x: c.x, y: c.y }));
      }
      if (marquee) {
        const c = clientToCanvas(e.clientX, e.clientY);
        setMarquee((m) => ({ ...m, x2: e.clientX, y2: e.clientY, cx2: c.x, cy2: c.y }));
      }
      if (panDrag) {
        setPan({
          x: panDrag.origPan.x + (e.clientX - panDrag.startX),
          y: panDrag.origPan.y + (e.clientY - panDrag.startY),
        });
      }
    };
    const onUp = (e) => {
      if (marquee) {
        // select nodes inside
        const x1 = Math.min(marquee.cx1, marquee.cx2);
        const x2 = Math.max(marquee.cx1, marquee.cx2);
        const y1 = Math.min(marquee.cy1, marquee.cy2);
        const y2 = Math.max(marquee.cy1, marquee.cy2);
        if (Math.abs(marquee.x2 - marquee.x1) > 4 || Math.abs(marquee.y2 - marquee.y1) > 4) {
          const ids = nodes
            .filter((n) => n.x + NODE_W > x1 && n.x < x2 && n.y + NODE_H > y1 && n.y < y2)
            .map((n) => n.id);
          setSelected({ nodes: ids, edges: [] });
        }
      }
      setDrag(null);
      setMarquee(null);
      setPending(null);
      setPanDrag(null);
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, pending, marquee, panDrag, nodes, clientToCanvas, setNodes, setPan, setSelected]);

  // ============== Keyboard ==============
  useEffect(() => {
    const onKey = (e) => {
      if (editingId) return;
      const tgt = e.target;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.nodes.length || selected.edges.length) {
          setNodes((prev) => prev.filter((n) => !selected.nodes.includes(n.id)));
          setEdges((prev) =>
            prev.filter(
              (ed) =>
                !selected.edges.includes(ed.id) &&
                !selected.nodes.includes(ed.from) &&
                !selected.nodes.includes(ed.to),
            ),
          );
          setSelected({ nodes: [], edges: [] });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelected({ nodes: nodes.map((n) => n.id), edges: edges.map((ed) => ed.id) });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        // duplicate
        const dup = nodes
          .filter((n) => selected.nodes.includes(n.id))
          .map((n) => ({ ...n, id: uid("n"), x: n.x + 24, y: n.y + 24 }));
        if (dup.length) {
          setNodes((prev) => [...prev, ...dup]);
          setSelected({ nodes: dup.map((n) => n.id), edges: [] });
        }
      }
      // Cmd/Ctrl+C — copy selected nodes (+ internal edges) to in-memory clipboard
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && selected.nodes.length > 0) {
        e.preventDefault();
        const nodeSet = new Set(selected.nodes);
        const copiedNodes = nodes.filter((n) => nodeSet.has(n.id));
        const copiedEdges = edges.filter((ed) => nodeSet.has(ed.from) && nodeSet.has(ed.to));
        clipboardRef.current = { nodes: copiedNodes, edges: copiedEdges };
      }
      // Cmd/Ctrl+V — paste from clipboard with offset; remap ids so refs stay valid
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && clipboardRef.current) {
        e.preventDefault();
        const { nodes: cNodes, edges: cEdges } = clipboardRef.current;
        const idMap = {};
        const pastedNodes = cNodes.map((n) => {
          const newId = uid("n");
          idMap[n.id] = newId;
          return { ...n, id: newId, x: n.x + 32, y: n.y + 32 };
        });
        const pastedEdges = cEdges
          .filter((ed) => idMap[ed.from] && idMap[ed.to])
          .map((ed) => ({ ...ed, id: uid("e"), from: idMap[ed.from], to: idMap[ed.to] }));
        setNodes((prev) => [...prev, ...pastedNodes]);
        setEdges((prev) => [...prev, ...pastedEdges]);
        setSelected({ nodes: pastedNodes.map((n) => n.id), edges: [] });
      }
      if (e.key === "v") setTool("select");
      if (e.key === "h" || e.key === " ") setTool("pan");
      if (e.key === "n") setTool("node");
      if (e.key === "t") setTool("note");
      if (e.key === "e") setTool("edge");
      if (e.key === "Escape") {
        setSelected({ nodes: [], edges: [] });
        setEditingId(null);
        setEdgeSource(null);
        setTool("select");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, nodes, edges, editingId, setNodes, setEdges, setSelected, setTool]);

  // ============== Wheel zoom ==============
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setZoom((z) => Math.max(0.3, Math.min(2.5, z + delta)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setZoom]);

  // ============== Edit label ==============
  const onDoubleClick = (id) => setEditingId(id);
  const onLabelChange = (id, label) =>
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)));
  const onLabelCommit = () => setEditingId(null);

  // ============== Edge select / delete ==============
  const selectEdge = (id) => setSelected({ nodes: [], edges: [id] });
  const deleteEdge = (id) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
    setSelected({ nodes: [], edges: [] });
  };

  // ============== Auto-layout button ==============
  const doAutoLayout = () => {
    setNodes(autoLayout(nodes, edges));
  };

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach((n) => {
      m[n.id] = n;
    });
    return m;
  }, [nodes]);

  // ============== Render ==============
  if (diagramType === "sequence") {
    return (
      <div className="canvas-wrap" ref={wrapRef}>
        <SequenceCanvas
          actors={nodes.slice(0, 4)}
          messages={[
            { id: "s1", from: nodes[0]?.id, to: nodes[2]?.id, label: "POST /habits/:id/check-in" },
            {
              id: "s2",
              from: nodes[2]?.id,
              to: nodes[4]?.id || nodes[2]?.id,
              label: "validate user",
            },
            {
              id: "s3",
              from: nodes[4]?.id || nodes[2]?.id,
              to: nodes[2]?.id,
              label: "ok",
              kind: "return",
            },
            { id: "s4", from: nodes[2]?.id, to: nodes[6]?.id || nodes[2]?.id, label: "INSERT log" },
            {
              id: "s5",
              from: nodes[6]?.id || nodes[2]?.id,
              to: nodes[2]?.id,
              label: "row",
              kind: "return",
            },
            { id: "s6", from: nodes[2]?.id, to: nodes[0]?.id, label: "200 OK", kind: "return" },
          ]}
        />
        <CanvasFloatingToolbar
          zoom={zoom}
          setZoom={setZoom}
          onAutoLayout={doAutoLayout}
          info="Sequence · time-ordered"
        />
      </div>
    );
  }

  return (
    <div
      className={"canvas-wrap" + (tool === "pan" ? " pan-mode" : "")}
      ref={wrapRef}
      onMouseDown={onBgMouseDown}
    >
      {showGrid && (
        <div
          className="canvas-grid"
          style={{
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          }}
        />
      )}

      <div
        className="canvas-stage"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <svg className="canvas-svg" width="4000" height="3000">
          {edges.map((e) => {
            const from = nodeMap[e.from],
              to = nodeMap[e.to];
            if (!from || !to) return null;
            return (
              <CanvasEdge
                key={e.id}
                edge={e}
                from={from}
                to={to}
                selected={selected.edges.includes(e.id)}
                onSelect={selectEdge}
                onDelete={deleteEdge}
              />
            );
          })}
          {pending && (
            <path
              d={edgePath(pending.startX, pending.startY, pending.x, pending.y)}
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              fill="none"
            />
          )}
        </svg>

        {nodes.map((n) => (
          <CanvasNode
            key={n.id}
            node={n}
            selected={selected.nodes.includes(n.id)}
            hovered={hoverNode === n.id}
            dimmed={selected.nodes.length > 0 && !selected.nodes.includes(n.id)}
            editing={editingId === n.id}
            onMouseDown={onNodeMouseDown}
            onPortDown={onPortDown}
            onPortUp={onPortUp}
            onDoubleClick={onDoubleClick}
            onLabelChange={onLabelChange}
            onLabelCommit={onLabelCommit}
          />
        ))}
      </div>

      <Marquee rect={marquee} />

      {/* Tool hint banner — informs the user how the active tool works */}
      {tool === "edge" && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 6,
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            border: "1px solid var(--accent-line)",
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          {edgeSource
            ? "Click a target node to connect — Esc to cancel"
            : "Click a source node to start the connection"}
        </div>
      )}
      {tool === "note" && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 6,
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            border: "1px solid var(--accent-line)",
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          Click anywhere on the canvas to drop a sticky note
        </div>
      )}
      {tool === "node" && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 6,
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            border: "1px solid var(--accent-line)",
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          Click anywhere on the canvas to add a node
        </div>
      )}

      <CanvasFloatingToolbar
        zoom={zoom}
        setZoom={setZoom}
        onAutoLayout={doAutoLayout}
        info={`${nodes.length} nodes · ${edges.length} edges`}
      />

      {/* Selection hint */}
      {selected.nodes.length > 1 && (
        <div className="canvas-hint">
          {selected.nodes.length} selected · ⌘D duplicate · ⌫ delete
        </div>
      )}

      {/* Mini-map */}
      <div className="canvas-mini">
        <div className="canvas-mini-label">Overview</div>
        <svg viewBox="0 0 1400 800" style={{ width: "100%", height: "100%" }}>
          {edges.map((e) => {
            const f = nodeMap[e.from],
              t = nodeMap[e.to];
            if (!f || !t) return null;
            return (
              <line
                key={e.id}
                x1={f.x + NODE_W / 2}
                y1={f.y + NODE_H / 2}
                x2={t.x + NODE_W / 2}
                y2={t.y + NODE_H / 2}
                stroke="var(--line-strong)"
                strokeWidth="2"
              />
            );
          })}
          {nodes.map((n) => (
            <rect
              key={n.id}
              x={n.x}
              y={n.y}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill={selected.nodes.includes(n.id) ? "var(--accent)" : "var(--bg-3)"}
              stroke="var(--line-strong)"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function CanvasFloatingToolbar({ zoom, setZoom, onAutoLayout, info }) {
  return (
    <>
      <div className="canvas-toolbar">
        <button className="icon-btn" title="Undo (⌘Z)">
          <Icon name="undo" size={14} />
        </button>
        <button className="icon-btn" title="Redo">
          <Icon name="redo" size={14} />
        </button>
        <span className="sep" style={{ height: 18, alignSelf: "center" }}></span>
        <button
          className="icon-btn"
          title="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
        >
          <Icon name="zoomOut" size={14} />
        </button>
        <span className="zoom">{Math.round(zoom * 100)}%</span>
        <button
          className="icon-btn"
          title="Zoom in"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
        >
          <Icon name="zoomIn" size={14} />
        </button>
        <button className="icon-btn" title="Fit to screen" onClick={() => setZoom(1)}>
          <Icon name="fit" size={14} />
        </button>
        <span className="sep" style={{ height: 18, alignSelf: "center" }}></span>
        <button className="btn btn-sm" onClick={onAutoLayout}>
          <Icon name="sparkles" size={12} /> Auto-layout
        </button>
      </div>
      <div className="canvas-info">{info}</div>
    </>
  );
}

export { CanvasArea, NODE_TYPES, NODE_W, NODE_H, autoLayout };
