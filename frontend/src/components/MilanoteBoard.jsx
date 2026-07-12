import { useState, useRef, useEffect } from "react";
import { useSupabaseStorage } from "../hooks/useSupabaseStorage.js";
import { v4 as uuidv4 } from "uuid";

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_TYPES = {
  NOTE: { label: "Note", icon: "📝", color: "#f6e05e" },
  IMAGE: { label: "Image", icon: "🖼️", color: "#34d399" },
  LINK: { label: "Link", icon: "🔗", color: "#60a5fa" },
  TODO: { label: "To-do", icon: "✅", color: "#fb923c" },
  COLUMN: { label: "Column", icon: "📋", color: "#94a3b8" },
  // ── Nested-board opener tiles ──
  CHARACTERS: { label: "Characters", icon: "👤", color: "#e879f9" },
  OUTLINE: { label: "Outline", icon: "📖", color: "#38bdf8" },
  WORLD: { label: "Worldbuilding", icon: "🌍", color: "#4ade80" },
  LOCATIONS: { label: "Locations", icon: "📍", color: "#f97316" },
  IDEAS: { label: "Ideas & Goals", icon: "💡", color: "#facc15" },
  CITATIONS: { label: "Citations", icon: "📚", color: "#a78bfa" },
};

// Separate toolbar groups
const BASIC_TYPES = ["NOTE", "IMAGE", "LINK", "TODO", "COLUMN"];
const MODULE_TYPES = ["CHARACTERS", "OUTLINE", "WORLD", "LOCATIONS", "IDEAS", "CITATIONS"];

const NOTE_COLORS = [
  { label: "Yellow", bg: "#fef08a", text: "#1a1a00" },
  { label: "Pink", bg: "#fbcfe8", text: "#3b0036" },
  { label: "Blue", bg: "#bae6fd", text: "#0c2340" },
  { label: "Green", bg: "#bbf7d0", text: "#022c22" },
  { label: "Purple", bg: "#e9d5ff", text: "#1e0048" },
  { label: "Orange", bg: "#fed7aa", text: "#431407" },
  { label: "Dark", bg: "#1e293b", text: "#e2e8f0" },
];

const DEFAULT_SIZES = {
  NOTE: { w: 220, h: 190 },
  IMAGE: { w: 280, h: 240 },
  LINK: { w: 260, h: 110 },
  TODO: { w: 260, h: 210 },
  COLUMN: { w: 280, h: 420 },
  CHARACTERS: { w: 480, h: 520 },
  OUTLINE: { w: 520, h: 560 },
  WORLD: { w: 500, h: 540 },
  LOCATIONS: { w: 480, h: 520 },
  IDEAS: { w: 480, h: 520 },
  CITATIONS: { w: 480, h: 520 },
};

// Meta for the nested-board opener tiles (no external component — just label/icon/accent)
const MODULE_META = {
  CHARACTERS: { label: "Characters", icon: "👤", accent: "#e879f9" },
  OUTLINE: { label: "Outline", icon: "📖", accent: "#38bdf8" },
  WORLD: { label: "Worldbuilding", icon: "🌍", accent: "#4ade80" },
  LOCATIONS: { label: "Locations", icon: "📍", accent: "#f97316" },
  IDEAS: { label: "Ideas & Goals", icon: "💡", accent: "#facc15" },
  CITATIONS: { label: "Citations", icon: "📚", accent: "#a78bfa" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function newCard(type, pos) {
  const size = DEFAULT_SIZES[type] ?? { w: 240, h: 160 };
  const base = {
    id: uuidv4(), type,
    x: pos.x, y: pos.y,
    w: size.w, h: size.h,
    zIndex: Date.now(),
    createdAt: new Date().toISOString(),
  };
  switch (type) {
    case "NOTE": return { ...base, content: "", color: NOTE_COLORS[0] };
    case "IMAGE": return { ...base, src: "", caption: "" };
    case "LINK": return { ...base, url: "", title: "", favicon: "" };
    case "TODO": return { ...base, title: "To-do", items: [] };
    case "COLUMN": return { ...base, label: "Column", items: [] };
    default:
      // Nested-board opener tile: starts with its own empty board
      return { ...base, label: MODULE_META[type]?.label ?? type, boardCards: [], boardConnections: [] };
  }
}

// ── Basic Card Bodies ─────────────────────────────────────────────────────────

function NoteCard({ card, onChange, onDelete }) {
  return (
    <div style={{ width: "100%", height: "100%", background: card.color?.bg ?? "#fef08a", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 4, padding: "6px 8px 4px", background: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
        {NOTE_COLORS.map((c) => (
          <button key={c.label} title={c.label} onClick={(e) => { e.stopPropagation(); onChange({ color: c }); }}
            style={{ width: 12, height: 12, borderRadius: "50%", background: c.bg, border: card.color?.label === c.label ? "2px solid white" : "1px solid rgba(0,0,0,0.2)", cursor: "pointer", flexShrink: 0 }} />
        ))}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(0,0,0,0.4)", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</button>
      </div>
      <textarea value={card.content} onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Write something…" onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", padding: "8px 10px", fontSize: 13, color: card.color?.text ?? "#1a1a00", fontFamily: "inherit", lineHeight: 1.6 }} />
    </div>
  );
}

function ImageCard({ card, onChange, onDelete }) {
  const inputRef = useRef();
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ src: ev.target.result });
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid rgba(52,211,153,0.15)", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600, letterSpacing: 1 }}>IMAGE</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
      {card.src ? (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <img src={card.src} alt={card.caption || "Image"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          <span style={{ fontSize: 28 }}>🖼️</span>
          <span style={{ color: "#64748b", fontSize: 12 }}>Click to upload image</span>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {card.src && (
        <input value={card.caption} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Caption…" onClick={(e) => e.stopPropagation()}
          style={{ padding: "5px 10px", background: "rgba(0,0,0,0.4)", border: "none", outline: "none", color: "#94a3b8", fontSize: 11, borderTop: "1px solid rgba(52,211,153,0.1)" }} />
      )}
    </div>
  );
}

function LinkCard({ card, onChange, onDelete }) {
  function fetchMeta() {
    if (!card.url) return;
    try {
      const domain = new URL(card.url.startsWith("http") ? card.url : "https://" + card.url).hostname;
      onChange({ favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`, title: card.title || domain });
    } catch { }
  }
  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid rgba(96,165,250,0.15)", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, letterSpacing: 1 }}>LINK</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {card.favicon && <img src={card.favicon} width={16} height={16} alt="" style={{ borderRadius: 3, flexShrink: 0 }} />}
          <input value={card.url} onChange={(e) => onChange({ url: e.target.value })} onBlur={fetchMeta}
            placeholder="https://…" onClick={(e) => e.stopPropagation()}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6, padding: "4px 8px", color: "#60a5fa", fontSize: 11.5, outline: "none" }} />
        </div>
        <input value={card.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Label…" onClick={(e) => e.stopPropagation()}
          style={{ background: "none", border: "none", outline: "none", color: "#e2e8f0", fontWeight: 600, fontSize: 13 }} />
        {card.url && (
          <a href={card.url.startsWith("http") ? card.url : "https://" + card.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: "#60a5fa", textDecoration: "underline", opacity: 0.7 }}>Open link →</a>
        )}
      </div>
    </div>
  );
}

function TodoCard({ card, onChange, onDelete }) {
  const [newItem, setNewItem] = useState("");
  function addItem() {
    if (!newItem.trim()) return;
    onChange({ items: [...(card.items || []), { id: uuidv4(), text: newItem.trim(), done: false }] });
    setNewItem("");
  }
  function toggleItem(id) { onChange({ items: (card.items || []).map((it) => it.id === id ? { ...it, done: !it.done } : it) }); }
  function deleteItem(id) { onChange({ items: (card.items || []).filter((it) => it.id !== id) }); }
  const done = (card.items || []).filter((i) => i.done).length, total = (card.items || []).length;
  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid rgba(251,146,60,0.15)", flexShrink: 0 }}>
        <span style={{ fontSize: 13 }}>✅</span>
        <input value={card.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="To-do list…" onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontWeight: 600, fontSize: 13 }} />
        {total > 0 && <span style={{ fontSize: 10, color: "#fb923c", background: "rgba(251,146,60,0.15)", padding: "1px 6px", borderRadius: 10 }}>{done}/{total}</span>}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
      <div data-scrollable style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        {(card.items || []).map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} style={{ cursor: "pointer", accentColor: "#fb923c", width: 14, height: 14 }} />
            <span style={{ flex: 1, fontSize: 12, color: item.done ? "#475569" : "#cbd5e1", textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
            <button onClick={() => deleteItem(item.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 10, opacity: 0.6 }}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            placeholder="Add item…"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 8px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
          <button onClick={addItem} style={{ background: "rgba(251,146,60,0.2)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 6, padding: "4px 10px", color: "#fb923c", fontSize: 12, cursor: "pointer" }}>+</button>
        </div>
      </div>
    </div>
  );
}

// ── Column Card (holds Note / To-do items, natural drag-and-drop-in) ──────────

function ColumnCard({ card, onChange, onDelete, isDragTarget }) {
  const items = card.items || [];

  function addItem(type) {
    const item = type === "NOTE"
      ? { id: uuidv4(), type: "NOTE", content: "", color: NOTE_COLORS[0] }
      : { id: uuidv4(), type: "TODO", title: "To-do", items: [] };
    onChange({ items: [...items, item] });
  }
  function updateItem(id, patch) {
    onChange({ items: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }
  function deleteItem(id) {
    onChange({ items: items.filter((it) => it.id !== id) });
  }

  return (
    <div
      data-column-dropzone={card.id}
      style={{
        width: "100%", height: "100%",
        background: isDragTarget ? "rgba(129,140,248,0.08)" : "rgba(148,163,184,0.05)",
        border: isDragTarget ? "1.5px dashed #818cf8" : "1px solid rgba(148,163,184,0.18)",
        borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid rgba(148,163,184,0.12)", flexShrink: 0 }}>
        <span style={{ fontSize: 13 }}>📋</span>
        <input value={card.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Column name…" onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#cbd5e1", fontWeight: 700, fontSize: 13, letterSpacing: 0.3, textTransform: "uppercase" }} />
        <span style={{ fontSize: 10, color: "#475569" }}>{items.length}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>

      <div
        data-scrollable
        style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 10 }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item) => (
          <div key={item.id} style={{ height: item.type === "TODO" ? 220 : 170, flexShrink: 0 }}>
            {item.type === "NOTE" && (
              <NoteCard card={item} onChange={(patch) => updateItem(item.id, patch)} onDelete={() => deleteItem(item.id)} />
            )}
            {item.type === "TODO" && (
              <TodoCard card={item} onChange={(patch) => updateItem(item.id, patch)} onDelete={() => deleteItem(item.id)} />
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => addItem("NOTE")}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(148,163,184,0.3)", borderRadius: 8, padding: "7px", color: "#64748b", fontSize: 11.5, cursor: "pointer" }}>
            📝 + Note
          </button>
          <button onClick={() => addItem("TODO")}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(148,163,184,0.3)", borderRadius: 8, padding: "7px", color: "#64748b", fontSize: 11.5, cursor: "pointer" }}>
            ✅ + To-do
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Nested-board Opener Card (static tile — double-click opens its own empty board) ──

function ModuleCard({ card, onChange, onDelete }) {
  const meta = MODULE_META[card.type];
  if (!meta) return null;
  const { icon, accent } = meta;
  const displayLabel = card.label ?? meta.label;
  const count = (card.boardCards || []).length;

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--bg-surface)",
      border: `1px solid ${accent}30`,
      borderRadius: 14,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      backdropFilter: "blur(12px)",
      transition: "background 0.3s",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px",
        background: `linear-gradient(90deg, ${accent}18 0%, transparent 100%)`,
        borderBottom: `1px solid ${accent}20`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <input
          value={displayLabel}
          onChange={(e) => onChange({ label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder={meta.label}
          style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: accent, fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "#334155", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
            board
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
          >✕</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center" }}>
        <span style={{ fontSize: 40, opacity: 0.5 }}>{icon}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Double-click untuk buka board {displayLabel}</span>
        {count > 0 && <span style={{ fontSize: 10.5, color: "#475569" }}>{count} card di dalam</span>}
      </div>
    </div>
  );
}

// ── Connections Layer (SVG lines with text labels between cards) ─────────────

function ConnectionsLayer({ cards, connections, zoom, pendingLine, editingConnId, setEditingConnId, onUpdateLabel, onDeleteConnection }) {
  function edgePoint(from, to) {
    const cx = from.x + from.w / 2, cy = from.y + from.h / 2;
    const dx = (to.x + to.w / 2) - cx, dy = (to.y + to.h / 2) - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const scale = Math.min(from.w / 2 / Math.abs(dx || 1e-6), from.h / 2 / Math.abs(dy || 1e-6));
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  return (
    <svg style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#818cf8" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const fromCard = cards.find((c) => c.id === conn.fromId);
        const toCard = cards.find((c) => c.id === conn.toId);
        if (!fromCard || !toCard) return null;
        const p1 = edgePoint(fromCard, toCard);
        const p2 = edgePoint(toCard, fromCard);
        const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
        return (
          <g key={conn.id}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#818cf8" strokeWidth={2 / zoom} markerEnd="url(#arrowhead)" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={14 / zoom}
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); setEditingConnId(conn.id); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteConnection(conn.id); }}
            />
            <foreignObject x={midX - 60} y={midY - 14} width={120} height={28} style={{ pointerEvents: "auto" }}>
              <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "center" }}>
                {editingConnId === conn.id ? (
                  <input autoFocus defaultValue={conn.label}
                    onBlur={(e) => { onUpdateLabel(conn.id, e.target.value); setEditingConnId(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                    style={{ fontSize: 11, textAlign: "center", background: "#1e293b", border: "1px solid #818cf8", borderRadius: 6, color: "#e2e8f0", padding: "2px 6px", width: 110 }} />
                ) : conn.label ? (
                  <span onClick={() => setEditingConnId(conn.id)}
                    style={{ fontSize: 10.5, background: "#1e293b", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 6, padding: "2px 8px", color: "#c7d2fe", cursor: "text", whiteSpace: "nowrap" }}>
                    {conn.label}
                  </span>
                ) : (
                  <span onClick={() => setEditingConnId(conn.id)} style={{ fontSize: 10, color: "#475569", cursor: "text", opacity: 0.6 }}>+ label</span>
                )}
              </div>
            </foreignObject>
          </g>
        );
      })}

      {pendingLine && (
        <line x1={pendingLine.x1} y1={pendingLine.y1} x2={pendingLine.x2} y2={pendingLine.y2}
          stroke="#818cf8" strokeWidth={2 / zoom} strokeDasharray="6,4" pointerEvents="none" />
      )}
    </svg>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, items }) {
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", left: x, top: y, zIndex: 5000,
        background: "var(--toolbar-bg)", backdropFilter: "blur(24px)",
        border: "1px solid var(--toolbar-border)", borderRadius: 10,
        padding: 4, minWidth: 170, boxShadow: "var(--shadow-toolbar)",
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} style={{ height: 1, background: "var(--border-subtle)", margin: "4px 2px" }} />
        ) : (
          <button key={i} onClick={item.onClick} disabled={item.disabled}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              background: "none", border: "none", borderRadius: 7,
              padding: "7px 10px", fontSize: 12.5, textAlign: "left",
              color: item.danger ? "#f87171" : item.disabled ? "var(--text-faint)" : "var(--text-primary)",
              cursor: item.disabled ? "default" : "pointer", opacity: item.disabled ? 0.4 : 1,
            }}
            onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span style={{ width: 14, textAlign: "center" }}>{item.icon}</span>{item.label}
          </button>
        )
      )}
    </div>
  );
}

// ── Draggable Board Card ───────────────────────────────────────────────────────

function BoardCard({ card, onChange, onDelete, onBringToFront, selected, onSelect, zoom, onContextMenu, onStartConnection, onOpenModule, onDropIntoColumn, onDragOverColumn, dragOverColumnId }) {
  const dragRef = useRef({ active: false });
  const resizeRef = useRef({ active: false });
  const [hovered, setHovered] = useState(false);

  const isModule = MODULE_TYPES.includes(card.type);
  const canDropIntoColumn = card.type === "NOTE" || card.type === "TODO";

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest("textarea,input,a,button,select,[data-scroll]")) return;
    e.preventDefault();
    e.stopPropagation();
    onBringToFront();
    onSelect();
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: card.x, origY: card.y };

    function onMove(ev) {
      if (!dragRef.current.active) return;
      onChange({ x: dragRef.current.origX + (ev.clientX - dragRef.current.startX) / zoom, y: dragRef.current.origY + (ev.clientY - dragRef.current.startY) / zoom });
      if (canDropIntoColumn) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const zone = el?.closest("[data-column-dropzone]");
        onDragOverColumn?.(zone ? zone.getAttribute("data-column-dropzone") : null);
      }
    }
    function onUp(ev) {
      dragRef.current.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (canDropIntoColumn) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const zone = el?.closest("[data-column-dropzone]");
        if (zone) onDropIntoColumn?.(zone.getAttribute("data-column-dropzone"));
        onDragOverColumn?.(null);
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleResizeDown(e) {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, origW: card.w, origH: card.h };
    function onMove(ev) {
      if (!resizeRef.current.active) return;
      onChange({ w: Math.max(180, resizeRef.current.origW + (ev.clientX - resizeRef.current.startX) / zoom), h: Math.max(100, resizeRef.current.origH + (ev.clientY - resizeRef.current.startY) / zoom) });
    }
    function onUp() { resizeRef.current.active = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const accentColor = MODULE_META[card.type]?.accent;

  return (
    <div
      data-card-id={card.id}
      style={{
        position: "absolute", left: card.x, top: card.y,
        width: card.w, height: card.h,
        zIndex: card.zIndex ?? 1,
        userSelect: "none",
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor ?? '#818cf8'}, 0 12px 40px rgba(0,0,0,0.6)`
          : "0 4px 24px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.15s",
        cursor: "grab",
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { if (isModule && onOpenModule) { e.stopPropagation(); onOpenModule(card.type, card.id); } }}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {card.type === "NOTE" && <NoteCard card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "IMAGE" && <ImageCard card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "LINK" && <LinkCard card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "TODO" && <TodoCard card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "COLUMN" && <ColumnCard card={card} onChange={onChange} onDelete={onDelete} isDragTarget={dragOverColumnId === card.id} />}
      {isModule && <ModuleCard card={card} onChange={onChange} onDelete={onDelete} />}

      {/* Connector handle */}
      <div
        onMouseDown={(e) => { e.stopPropagation(); onStartConnection(card.id, e); }}
        title="Drag untuk hubungkan ke card lain"
        style={{
          position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: "#818cf8", border: "2px solid #0f172a",
          cursor: "crosshair", zIndex: 40,
          opacity: hovered || selected ? 1 : 0.15,
          transition: "opacity 0.15s",
        }}
      />

      {/* Resize handle */}
      <div onMouseDown={handleResizeDown}
        style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, cursor: "nwse-resize", zIndex: 30, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 3 }}>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{ opacity: 0.35 }}>
          <path d="M1 8L8 1M4.5 8L8 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ onAdd, zoom, onZoom, onFitAll, cardCount, showModuleTypes }) {
  return (
    <div style={{
      position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 0,
      background: "var(--toolbar-bg)", backdropFilter: "blur(24px)",
      border: "1px solid var(--toolbar-border)", borderRadius: 18,
      padding: "6px 10px", zIndex: 1000, boxShadow: "var(--shadow-toolbar)",
      whiteSpace: "nowrap",
      transition: "background 0.3s, border-color 0.3s",
    }}>
      {/* Basic card types */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {BASIC_TYPES.map((key) => {
          const def = CARD_TYPES[key];
          return (
            <button key={key} onClick={() => onAdd(key)} title={`Add ${def.label}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, background: "none", border: "none", cursor: "pointer", padding: "5px 8px", borderRadius: 9, transition: "background 0.12s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              <span style={{ fontSize: 16 }}>{def.icon}</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 0.3, textTransform: "uppercase" }}>{def.label}</span>
            </button>
          );
        })}
      </div>

      {showModuleTypes && (
        <>
          <div style={{ width: 1, height: 32, background: "var(--border-subtle)", margin: "0 8px", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {MODULE_TYPES.map((key) => {
              const def = CARD_TYPES[key];
              const meta = MODULE_META[key];
              return (
                <button key={key} onClick={() => onAdd(key)} title={`Add ${def.label}`}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, background: "none", border: "none", cursor: "pointer", padding: "5px 8px", borderRadius: 9, transition: "background 0.12s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${meta.accent}15`; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                  <span style={{ fontSize: 16 }}>{def.icon}</span>
                  <span style={{ fontSize: 9, color: meta.accent, letterSpacing: 0.3, textTransform: "uppercase", opacity: 0.85 }}>{def.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div style={{ width: 1, height: 32, background: "var(--border-subtle)", margin: "0 8px", flexShrink: 0 }} />

      {/* Zoom */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button onClick={() => onZoom(-0.1)} style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", borderRadius: 7, width: 26, height: 26, color: "var(--text-secondary)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <button onClick={() => onZoom(0)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 10.5, cursor: "pointer", minWidth: 34, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Math.round(zoom * 100)}%</button>
        <button onClick={() => onZoom(0.1)} style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", borderRadius: 7, width: 26, height: 26, color: "var(--text-secondary)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        <button onClick={onFitAll} style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: 7, padding: "3px 9px", color: "#818cf8", fontSize: 10.5, cursor: "pointer", fontWeight: 600 }}>Fit</button>
      </div>

      {cardCount > 0 && <span style={{ fontSize: 9.5, color: "var(--text-faint)", marginLeft: 6 }}>{cardCount}</span>}
    </div>
  );
}


// ── BoardCanvas ────────────────────────────────────────────────────────────────
// Self-contained canvas: owns its own pan/zoom/selection/context-menu/clipboard
// state, and operates on whatever `cards`/`connections` + setters it's given.
// Used both for the top-level board and for each nested module board.

function BoardCanvas({ cards, setCards, connections, setConnections, showModuleTypes, onOpenModule, hidden, emptyHint }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [editingConnId, setEditingConnId] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const canvasRef = useRef(null);
  const panRef = useRef({ active: false });

  function handleCanvasMouseDown(e) {
    if (e.button !== 0) return;
    const target = e.target;
    if (target !== canvasRef.current && !target.classList.contains("board-bg")) return;
    setSelectedId(null);
    setContextMenu(null);
    panRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
    function onMove(ev) {
      if (!panRef.current.active) return;
      setPan({ x: panRef.current.origX + (ev.clientX - panRef.current.startX), y: panRef.current.origY + (ev.clientY - panRef.current.startY) });
    }
    function onUp() { panRef.current.active = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleWheel(e) {
    if (e.target.closest("[data-scrollable]")) return;
    e.preventDefault();
    const isPinch = e.ctrlKey || e.metaKey;
    if (isPinch) {
      setZoom((z) => clamp(z + (-e.deltaY * 0.01), 0.15, 3));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    function handleClick() { setContextMenu(null); }
    function handleKey(e) { if (e.key === "Escape") setContextMenu(null); }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  function worldPointFromScreen(clientX, clientY) {
    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }

  function addCard(type) {
    const rect = canvasRef.current?.getBoundingClientRect() ?? { width: 900, height: 600 };
    const jitter = () => (Math.random() - 0.5) * 100;
    const size = DEFAULT_SIZES[type] ?? { w: 240, h: 160 };
    const cx = (rect.width / 2 - pan.x) / zoom;
    const cy = (rect.height / 2 - pan.y) / zoom;
    const card = newCard(type, { x: cx - size.w / 2 + jitter(), y: cy - size.h / 2 + jitter() });
    setCards((arr) => [...arr, card]);
    setSelectedId(card.id);
  }

  function updateCard(id, patch) { setCards((arr) => arr.map((c) => c.id === id ? { ...c, ...patch } : c)); }

  function deleteCard(id) {
    setCards((arr) => arr.filter((c) => c.id !== id));
    setConnections((arr) => arr.filter((c) => c.fromId !== id && c.toId !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function bringToFront(id) { setCards((arr) => arr.map((c) => c.id === id ? { ...c, zIndex: Date.now() } : c)); }

  function handleZoom(delta) {
    if (delta === 0) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    setZoom((z) => clamp(z + delta, 0.15, 3));
  }

  function fitAll() {
    if (cards.length === 0) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const rect = canvasRef.current?.getBoundingClientRect() ?? { width: 900, height: 600 };
    const minX = Math.min(...cards.map((c) => c.x));
    const minY = Math.min(...cards.map((c) => c.y));
    const maxX = Math.max(...cards.map((c) => c.x + c.w));
    const maxY = Math.max(...cards.map((c) => c.y + c.h));
    const pad = 80;
    const bw = maxX - minX + pad * 2, bh = maxY - minY + pad * 2;
    const nz = clamp(Math.min(rect.width / bw, rect.height / bh), 0.15, 2);
    setZoom(nz);
    setPan({ x: rect.width / 2 - ((minX + maxX) / 2) * nz, y: rect.height / 2 - ((minY + maxY) / 2) * nz });
  }

  function moveCardIntoColumn(cardId, columnId) {
    if (cardId === columnId) return;
    setCards((arr) => {
      const dragged = arr.find((c) => c.id === cardId);
      const column = arr.find((c) => c.id === columnId);
      if (!dragged || !column || column.type !== "COLUMN") return arr;
      if (dragged.type !== "NOTE" && dragged.type !== "TODO") return arr;
      const { x, y, w, h, zIndex, createdAt, ...itemFields } = dragged;
      const updatedColumn = { ...column, items: [...(column.items || []), itemFields] };
      return arr.filter((c) => c.id !== cardId).map((c) => (c.id === columnId ? updatedColumn : c));
    });
    setConnections((arr) => arr.filter((c) => c.fromId !== cardId && c.toId !== cardId));
    setSelectedId(null);
  }

  function startConnection(fromId, e) {
    e.preventDefault(); e.stopPropagation();
    const start = worldPointFromScreen(e.clientX, e.clientY);
    setPendingConnection({ fromId, x2: start.x, y2: start.y });

    function onMove(ev) {
      const p = worldPointFromScreen(ev.clientX, ev.clientY);
      setPendingConnection((pc) => pc ? { ...pc, x2: p.x, y2: p.y } : pc);
    }
    function onUp(ev) {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const targetEl = el?.closest("[data-card-id]");
      const toId = targetEl?.getAttribute("data-card-id");
      if (toId && toId !== fromId) {
        setConnections((arr) => [...arr, { id: uuidv4(), fromId, toId, label: "" }]);
      }
      setPendingConnection(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function updateConnectionLabel(id, label) { setConnections((arr) => arr.map((c) => c.id === id ? { ...c, label } : c)); }
  function deleteConnection(id) { setConnections((arr) => arr.filter((c) => c.id !== id)); }

  function openCardMenu(e, cardId) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(cardId);
    setContextMenu({ x: e.clientX, y: e.clientY, cardId, type: "card" });
  }

  function openCanvasMenu(e) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: "canvas" });
  }

  function copyCardToClipboard(id, cut) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const { id: _id, zIndex: _z, createdAt: _c, ...rest } = card;
    setClipboard({ data: rest, cut });
    if (cut) deleteCard(id);
    setContextMenu(null);
  }

  function duplicateCardById(id) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const clone = { ...card, id: uuidv4(), x: card.x + 30, y: card.y + 30, zIndex: Date.now() };
    setCards((arr) => [...arr, clone]);
    setSelectedId(clone.id);
    setContextMenu(null);
  }

  function deleteCardById(id) {
    deleteCard(id);
    setContextMenu(null);
  }

  function pasteClipboard(screenX, screenY) {
    if (!clipboard) return;
    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const worldX = (screenX - rect.left - pan.x) / zoom;
    const worldY = (screenY - rect.top - pan.y) / zoom;
    const size = DEFAULT_SIZES[clipboard.data.type] ?? { w: clipboard.data.w, h: clipboard.data.h };
    const newC = { ...clipboard.data, id: uuidv4(), x: worldX - size.w / 2, y: worldY - size.h / 2, zIndex: Date.now(), createdAt: new Date().toISOString() };
    setCards((arr) => [...arr, newC]);
    setSelectedId(newC.id);
    if (clipboard.cut) setClipboard(null);
    setContextMenu(null);
  }

  const sorted = [...cards].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const pendingLine = pendingConnection ? (() => {
    const fromCard = cards.find((c) => c.id === pendingConnection.fromId);
    if (!fromCard) return null;
    return { x1: fromCard.x + fromCard.w / 2, y1: fromCard.y + fromCard.h / 2, x2: pendingConnection.x2, y2: pendingConnection.y2 };
  })() : null;

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={openCanvasMenu}
      style={{
        position: "absolute", inset: 0, overflow: "hidden",
        borderRadius: 16, border: "1px solid var(--border-subtle)",
        cursor: "default",
        transition: "border-color 0.3s",
        display: hidden ? "none" : "block",
      }}
    >
      <div className="board-bg" style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "var(--canvas-bg)",
        backgroundImage: `
          radial-gradient(ellipse at 25% 35%, var(--canvas-glow1) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 65%, var(--canvas-glow2) 0%, transparent 55%),
          repeating-linear-gradient(var(--canvas-grid) 0px, var(--canvas-grid) 1px, transparent 1px, transparent 44px),
          repeating-linear-gradient(90deg, var(--canvas-grid) 0px, var(--canvas-grid) 1px, transparent 1px, transparent 44px)
        `,
        transition: "background 0.3s",
      }} />

      <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", width: 0, height: 0, zIndex: 1 }}>
        <ConnectionsLayer
          cards={cards}
          connections={connections}
          zoom={zoom}
          editingConnId={editingConnId}
          setEditingConnId={setEditingConnId}
          onUpdateLabel={updateConnectionLabel}
          onDeleteConnection={deleteConnection}
          pendingLine={pendingLine}
        />

        {sorted.map((card) => (
          <BoardCard
            key={card.id} card={card} zoom={zoom}
            selected={selectedId === card.id}
            onSelect={() => setSelectedId(card.id)}
            onBringToFront={() => bringToFront(card.id)}
            onChange={(patch) => updateCard(card.id, patch)}
            onDelete={() => deleteCard(card.id)}
            onContextMenu={(e) => openCardMenu(e, card.id)}
            onStartConnection={startConnection}
            onOpenModule={onOpenModule}
            onDropIntoColumn={(columnId) => moveCardIntoColumn(card.id, columnId)}
            onDragOverColumn={setDragOverColumnId}
            dragOverColumnId={dragOverColumnId}
          />
        ))}
      </div>

      {cards.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
          <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.12 }}>🎨</div>
          <p style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 600 }}>Board is empty</p>
          <p style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 6 }}>{emptyHint}</p>
        </div>
      )}


      <Toolbar onAdd={addCard} zoom={zoom} onZoom={handleZoom} onFitAll={fitAll} cardCount={cards.length} showModuleTypes={showModuleTypes} />

      {contextMenu?.type === "card" && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          items={[
            { icon: "📋", label: "Copy", onClick: () => copyCardToClipboard(contextMenu.cardId, false) },
            { icon: "✂️", label: "Cut", onClick: () => copyCardToClipboard(contextMenu.cardId, true) },
            { icon: "🧬", label: "Duplicate", onClick: () => duplicateCardById(contextMenu.cardId) },
            { divider: true },
            { icon: "🗑️", label: "Delete", danger: true, onClick: () => deleteCardById(contextMenu.cardId) },
          ]}
        />
      )}
      {contextMenu?.type === "canvas" && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          items={[
            { icon: "📌", label: "Paste", disabled: !clipboard, onClick: () => pasteClipboard(contextMenu.x, contextMenu.y) },
          ]}
        />
      )}
    </div>
  );
}

// ── Main MilanoteBoard ────────────────────────────────────────────────────────

export default function MilanoteBoard() {
  const [cards, setCards] = useSupabaseStorage("mythos_milanote_cards", []);
  const [connections, setConnections] = useSupabaseStorage("mythos_milanote_connections", []);
  const [boardName, setBoardName] = useSupabaseStorage("mythos_board_name", "My Story Board");
  const [editingName, setEditingName] = useState(false);

  const [openModuleType, setOpenModuleType] = useState(null);   // null = on the top board, else module key
  const [openModuleCardId, setOpenModuleCardId] = useState(null); // which tile's nested board is open

  function openModule(type, cardId) { setOpenModuleType(type); setOpenModuleCardId(cardId); setEditingName(false); }
  function closeModule() { setOpenModuleType(null); setOpenModuleCardId(null); }

  // Wrappers so a nested board can be given cards/setCards just like the top-level one,
  // but reading/writing from the opened tile's own boardCards / boardConnections fields.
  function nestedSetCards(updater) {
    setCards((arr) => arr.map((c) => {
      if (c.id !== openModuleCardId) return c;
      const current = c.boardCards || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...c, boardCards: next };
    }));
  }
  function nestedSetConnections(updater) {
    setCards((arr) => arr.map((c) => {
      if (c.id !== openModuleCardId) return c;
      const current = c.boardConnections || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...c, boardConnections: next };
    }));
  }

  const openCard = cards.find((c) => c.id === openModuleCardId);
  const nestedCards = openCard?.boardCards || [];
  const nestedConnections = openCard?.boardConnections || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 108px)", minHeight: 540, position: "relative" }}>
      {/* Board title / breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {editingName && !openModuleType ? (
            <input autoFocus value={boardName} onChange={(e) => setBoardName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              style={{ background: "transparent", border: "none", borderBottom: "2px solid #818cf8", outline: "none", color: "var(--text-primary)", fontSize: 20, fontWeight: 700, minWidth: 200 }} />
          ) : (
            <h2
              onClick={() => openModuleType ? closeModule() : setEditingName(true)}
              style={{
                fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6,
                color: openModuleType ? "#818cf8" : "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              🎨 {boardName}
              {!openModuleType && <span style={{ fontSize: 13, opacity: 0.25 }}>✎</span>}
            </h2>
          )}

          {openModuleType && (
            <>
              <span style={{ opacity: 0.3, fontSize: 18 }}>›</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{MODULE_META[openModuleType].icon}</span>
                {openCard?.label ?? MODULE_META[openModuleType].label}
              </span>
            </>
          )}
        </div>

        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-faint)" }}>
          {openModuleType ? "Klik nama board untuk kembali" : "Scroll or drag to pan · Pinch to zoom · Double-click sebuah tile untuk buka board-nya"}
        </span>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {/* Top-level board — stays mounted (hidden) so its pan/zoom/state survive navigation */}
        <BoardCanvas
          cards={cards}
          setCards={setCards}
          connections={connections}
          setConnections={setConnections}
          showModuleTypes={true}
          onOpenModule={openModule}
          hidden={!!openModuleType}
          emptyHint="Use the toolbar below — add notes, columns, or a Characters/Outline/etc. tile"
        />

        {/* Nested board for whichever tile is open — starts empty, fills up as the user adds cards */}
        {openModuleType && (
          <BoardCanvas
            key={openModuleCardId}
            cards={nestedCards}
            setCards={nestedSetCards}
            connections={nestedConnections}
            setConnections={nestedSetConnections}
            showModuleTypes={false}
            onOpenModule={undefined}
            hidden={false}
            emptyHint="Board ini masih kosong — mulai tambahkan card dari toolbar di bawah"
          />
        )}
      </div>
    </div>
  );
}