import { useState, useRef, useCallback, useEffect } from "react";
import { useSupabaseStorage } from "../hooks/useSupabaseStorage.js";
import { v4 as uuidv4 } from "uuid";

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_TYPES = {
  NOTE:    { label: "Note",       icon: "📝", color: "#f6e05e", bg: "#1a1a2e" },
  TEXT:    { label: "Text",       icon: "📄", color: "#a78bfa", bg: "#1a1a2e" },
  IMAGE:   { label: "Image",      icon: "🖼️", color: "#34d399", bg: "#1a1a2e" },
  LINK:    { label: "Link",       icon: "🔗", color: "#60a5fa", bg: "#1a1a2e" },
  TODO:    { label: "To-do",      icon: "✅", color: "#fb923c", bg: "#1a1a2e" },
  SECTION: { label: "Section",    icon: "📋", color: "#94a3b8", bg: "#1a1a2e" },
};

const NOTE_COLORS = [
  { label: "Yellow",  bg: "#fef08a", text: "#1a1a00" },
  { label: "Pink",    bg: "#fbcfe8", text: "#3b0036" },
  { label: "Blue",    bg: "#bae6fd", text: "#0c2340" },
  { label: "Green",   bg: "#bbf7d0", text: "#022c22" },
  { label: "Purple",  bg: "#e9d5ff", text: "#1e0048" },
  { label: "Orange",  bg: "#fed7aa", text: "#431407" },
  { label: "Dark",    bg: "#1e293b", text: "#e2e8f0" },
];

const DEFAULT_SIZES = {
  NOTE:    { w: 220, h: 180 },
  TEXT:    { w: 300, h: 200 },
  IMAGE:   { w: 280, h: 240 },
  LINK:    { w: 260, h: 100 },
  TODO:    { w: 260, h: 200 },
  SECTION: { w: 420, h: 300 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function newCard(type, pos) {
  const size = DEFAULT_SIZES[type] ?? { w: 240, h: 160 };
  const base = {
    id: uuidv4(),
    type,
    x: pos.x,
    y: pos.y,
    w: size.w,
    h: size.h,
    zIndex: Date.now(),
    createdAt: new Date().toISOString(),
  };
  switch (type) {
    case "NOTE":    return { ...base, content: "", color: NOTE_COLORS[0] };
    case "TEXT":    return { ...base, title: "", content: "" };
    case "IMAGE":   return { ...base, src: "", caption: "" };
    case "LINK":    return { ...base, url: "", title: "", favicon: "" };
    case "TODO":    return { ...base, title: "To-do", items: [] };
    case "SECTION": return { ...base, label: "Section", opacity: 0.06 };
    default:        return base;
  }
}

// ── Card Components ───────────────────────────────────────────────────────────

function NoteCard({ card, onChange, onDelete, selected }) {
  return (
    <div style={{ width: "100%", height: "100%", background: card.color?.bg ?? "#fef08a", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Color picker strip */}
      <div style={{ display: "flex", gap: 4, padding: "6px 8px 4px", background: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
        {NOTE_COLORS.map((c) => (
          <button key={c.label} title={c.label}
            onClick={(e) => { e.stopPropagation(); onChange({ color: c }); }}
            style={{ width: 12, height: 12, borderRadius: "50%", background: c.bg, border: card.color?.label === c.label ? "2px solid white" : "1px solid rgba(0,0,0,0.2)", cursor: "pointer", flexShrink: 0 }}
          />
        ))}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(0,0,0,0.4)", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</button>
      </div>
      <textarea
        value={card.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Write something…"
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", padding: "8px 10px", fontSize: 13, color: card.color?.text ?? "#1a1a00", fontFamily: "inherit", lineHeight: 1.6 }}
      />
    </div>
  );
}

function TextCard({ card, onChange, onDelete }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid rgba(139,92,246,0.15)", flexShrink: 0 }}>
        <span style={{ fontSize: 13 }}>📄</span>
        <input value={card.title} onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Title…" onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontWeight: 600, fontSize: 13 }} />
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
      <textarea value={card.content} onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Write your note…" onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", padding: "8px 10px", fontSize: 12.5, color: "#cbd5e1", fontFamily: "inherit", lineHeight: 1.65 }} />
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
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
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
        <input value={card.caption} onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Caption…" onClick={(e) => e.stopPropagation()}
          style={{ padding: "5px 10px", background: "rgba(0,0,0,0.4)", border: "none", outline: "none", color: "#94a3b8", fontSize: 11, borderTop: "1px solid rgba(52,211,153,0.1)" }} />
      )}
    </div>
  );
}

function LinkCard({ card, onChange, onDelete }) {
  async function fetchMeta() {
    if (!card.url) return;
    try {
      const domain = new URL(card.url.startsWith("http") ? card.url : "https://" + card.url).hostname;
      onChange({ favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`, title: card.title || domain });
    } catch {}
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
        <input value={card.title} onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Label…" onClick={(e) => e.stopPropagation()}
          style={{ background: "none", border: "none", outline: "none", color: "#e2e8f0", fontWeight: 600, fontSize: 13 }} />
        {card.url && (
          <a href={card.url.startsWith("http") ? card.url : "https://" + card.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, color: "#60a5fa", textDecoration: "underline", opacity: 0.7 }}>Open link →</a>
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

  function toggleItem(id) {
    onChange({ items: (card.items || []).map((it) => it.id === id ? { ...it, done: !it.done } : it) });
  }

  function deleteItem(id) {
    onChange({ items: (card.items || []).filter((it) => it.id !== id) });
  }

  const done = (card.items || []).filter((i) => i.done).length;
  const total = (card.items || []).length;

  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid rgba(251,146,60,0.15)", flexShrink: 0 }}>
        <span style={{ fontSize: 13 }}>✅</span>
        <input value={card.title} onChange={(e) => onChange({ title: e.target.value })}
          placeholder="To-do list…" onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontWeight: 600, fontSize: 13 }} />
        {total > 0 && <span style={{ fontSize: 10, color: "#fb923c", background: "rgba(251,146,60,0.15)", padding: "1px 6px", borderRadius: 10 }}>{done}/{total}</span>}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }} onClick={(e) => e.stopPropagation()}>
        {(card.items || []).map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)}
              style={{ cursor: "pointer", accentColor: "#fb923c", width: 14, height: 14 }} />
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

function SectionCard({ card, onChange, onDelete }) {
  return (
    <div style={{ width: "100%", height: "100%", background: `rgba(148,163,184,${card.opacity ?? 0.06})`, border: "1.5px dashed rgba(148,163,184,0.25)", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", flexShrink: 0 }}>
        <span style={{ fontSize: 13 }}>📋</span>
        <input value={card.label} onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Section name…" onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#94a3b8", fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }} />
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
    </div>
  );
}

// ── Draggable Board Card ───────────────────────────────────────────────────────

function BoardCard({ card, onChange, onDelete, onBringToFront, selected, onSelect, zoom }) {
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const resizeRef = useRef({ active: false, startX: 0, startY: 0, origW: 0, origH: 0 });

  // Card dragging
  function handleMouseDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest("textarea,input,a,button,select")) return;
    e.preventDefault();
    e.stopPropagation();
    onBringToFront();
    onSelect();
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: card.x, origY: card.y };

    function onMove(ev) {
      if (!dragRef.current.active) return;
      const dx = (ev.clientX - dragRef.current.startX) / zoom;
      const dy = (ev.clientY - dragRef.current.startY) / zoom;
      onChange({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    }
    function onUp() {
      dragRef.current.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Resize handle
  function handleResizeDown(e) {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, origW: card.w, origH: card.h };

    function onMove(ev) {
      if (!resizeRef.current.active) return;
      const dw = (ev.clientX - resizeRef.current.startX) / zoom;
      const dh = (ev.clientY - resizeRef.current.startY) / zoom;
      onChange({ w: Math.max(150, resizeRef.current.origW + dw), h: Math.max(80, resizeRef.current.origH + dh) });
    }
    function onUp() {
      resizeRef.current.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const cardStyle = {
    position: "absolute",
    left: card.x,
    top: card.y,
    width: card.w,
    height: card.h,
    zIndex: card.zIndex ?? 1,
    userSelect: "none",
    borderRadius: 10,
    boxShadow: selected
      ? "0 0 0 2px #818cf8, 0 8px 32px rgba(0,0,0,0.5)"
      : "0 4px 24px rgba(0,0,0,0.4)",
    transition: "box-shadow 0.15s",
    cursor: "grab",
  };

  return (
    <div style={cardStyle} onMouseDown={handleMouseDown} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Card content */}
      {card.type === "NOTE"    && <NoteCard    card={card} onChange={onChange} onDelete={onDelete} selected={selected} />}
      {card.type === "TEXT"    && <TextCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "IMAGE"   && <ImageCard   card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "LINK"    && <LinkCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "TODO"    && <TodoCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "SECTION" && <SectionCard card={card} onChange={onChange} onDelete={onDelete} />}

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeDown}
        style={{
          position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
          cursor: "nwse-resize", zIndex: 10,
          background: "transparent",
          display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 2,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" style={{ opacity: 0.35 }}>
          <path d="M1 7L7 1M4 7L7 4M7 7V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ onAdd, zoom, onZoom, onFitAll, cardCount }) {
  const types = Object.entries(CARD_TYPES);

  return (
    <div style={{
      position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(15,15,30,0.92)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
      padding: "8px 12px", zIndex: 1000, boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    }}>
      {/* Add card buttons */}
      {types.map(([key, def]) => (
        <button key={key} onClick={() => onAdd(key)}
          title={`Add ${def.label}`}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "none", border: "none", cursor: "pointer",
            padding: "6px 10px", borderRadius: 10,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize: 18 }}>{def.icon}</span>
          <span style={{ fontSize: 9.5, color: "#64748b", letterSpacing: 0.3, textTransform: "uppercase" }}>{def.label}</span>
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

      {/* Zoom controls */}
      <button onClick={() => onZoom(-0.1)} title="Zoom out"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 30, height: 30, color: "#94a3b8", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <button onClick={() => onZoom(0)} title="Reset zoom"
        style={{ background: "none", border: "none", color: "#64748b", fontSize: 11, cursor: "pointer", minWidth: 38, textAlign: "center" }}>
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={() => onZoom(0.1)} title="Zoom in"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 30, height: 30, color: "#94a3b8", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>

      {/* Fit button */}
      <button onClick={onFitAll} title="Fit all cards"
        style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: 8, padding: "4px 10px", color: "#818cf8", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
        Fit ⌖
      </button>

      {/* Card count */}
      {cardCount > 0 && (
        <span style={{ fontSize: 10, color: "#334155", marginLeft: 2 }}>{cardCount} cards</span>
      )}
    </div>
  );
}

// ── Mini-map ──────────────────────────────────────────────────────────────────

function MiniMap({ cards, pan, zoom, canvasSize }) {
  if (cards.length === 0) return null;

  const SCALE = 0.08;
  const W = 150, H = 100;

  const minX = Math.min(...cards.map((c) => c.x));
  const minY = Math.min(...cards.map((c) => c.y));
  const maxX = Math.max(...cards.map((c) => c.x + c.w));
  const maxY = Math.max(...cards.map((c) => c.y + c.h));
  const rangeX = maxX - minX || 800;
  const rangeY = maxY - minY || 600;

  const sx = W / rangeX;
  const sy = H / rangeY;
  const s = Math.min(sx, sy, SCALE * 3);

  return (
    <div style={{ position: "absolute", top: 16, right: 16, width: W, height: H,
      background: "rgba(10,10,20,0.8)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, overflow: "hidden", zIndex: 900, backdropFilter: "blur(10px)" }}>
      {cards.map((c) => (
        <div key={c.id} style={{
          position: "absolute",
          left: (c.x - minX) * s,
          top: (c.y - minY) * s,
          width: Math.max(4, c.w * s),
          height: Math.max(3, c.h * s),
          background: CARD_TYPES[c.type]?.color ?? "#94a3b8",
          borderRadius: 1.5,
          opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

// ── Main MilanoteBoard ────────────────────────────────────────────────────────

export default function MilanoteBoard() {
  const [cards, setCards] = useSupabaseStorage("mythos_milanote_cards", []);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [boardName, setBoardName] = useSupabaseStorage("mythos_board_name", "My Story Board");
  const [editingName, setEditingName] = useState(false);

  const canvasRef = useRef(null);
  const panRef = useRef({ active: false, startX: 0, startY: 0, origPanX: 0, origPanY: 0 });

  // Canvas pan
  function handleCanvasMouseDown(e) {
    if (e.button !== 0) return;
    if (e.target !== canvasRef.current && e.target !== canvasRef.current?.firstChild) return;
    setSelectedId(null);
    panRef.current = { active: true, startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y };

    function onMove(ev) {
      if (!panRef.current.active) return;
      setPan({
        x: panRef.current.origPanX + (ev.clientX - panRef.current.startX),
        y: panRef.current.origPanY + (ev.clientY - panRef.current.startY),
      });
    }
    function onUp() {
      panRef.current.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Scroll to zoom
  function handleWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((z) => clamp(z + delta, 0.2, 3));
  }

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Place new card in center-ish of current viewport
  function addCard(type) {
    const rect = canvasRef.current?.getBoundingClientRect() ?? { width: 900, height: 600 };
    const cx = (rect.width / 2 - pan.x) / zoom;
    const cy = (rect.height / 2 - pan.y) / zoom;
    const jitter = () => (Math.random() - 0.5) * 120;
    const size = DEFAULT_SIZES[type] ?? { w: 240, h: 160 };
    const card = newCard(type, { x: cx - size.w / 2 + jitter(), y: cy - size.h / 2 + jitter() });
    setCards((arr) => [...arr, card]);
    setSelectedId(card.id);
  }

  function updateCard(id, patch) {
    setCards((arr) => arr.map((c) => c.id === id ? { ...c, ...patch } : c));
  }

  function deleteCard(id) {
    setCards((arr) => arr.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function bringToFront(id) {
    setCards((arr) => arr.map((c) => c.id === id ? { ...c, zIndex: Date.now() } : c));
  }

  function handleZoom(delta) {
    if (delta === 0) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    setZoom((z) => clamp(z + delta, 0.2, 3));
  }

  function fitAll() {
    if (cards.length === 0) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const rect = canvasRef.current?.getBoundingClientRect() ?? { width: 900, height: 600 };
    const minX = Math.min(...cards.map((c) => c.x));
    const minY = Math.min(...cards.map((c) => c.y));
    const maxX = Math.max(...cards.map((c) => c.x + c.w));
    const maxY = Math.max(...cards.map((c) => c.y + c.h));
    const pad = 80;
    const bw = maxX - minX + pad * 2;
    const bh = maxY - minY + pad * 2;
    const newZoom = clamp(Math.min(rect.width / bw, rect.height / bh), 0.2, 2);
    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - ((minX + maxX) / 2) * newZoom,
      y: rect.height / 2 - ((minY + maxY) / 2) * newZoom,
    });
  }

  // Sort by zIndex for render order
  const sorted = [...cards].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 520, position: "relative" }}>
      {/* Board Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 0 12px", flexShrink: 0 }}>
        {editingName ? (
          <input
            autoFocus
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
            style={{
              background: "transparent", border: "none", borderBottom: "2px solid #818cf8",
              outline: "none", color: "white", fontSize: 20, fontWeight: 700, width: "auto", minWidth: 200,
            }}
          />
        ) : (
          <h2 onClick={() => setEditingName(true)}
            style={{ fontSize: 20, fontWeight: 700, color: "white", cursor: "text", display: "flex", alignItems: "center", gap: 8 }}>
            {boardName}
            <span style={{ fontSize: 13, opacity: 0.3 }}>✎</span>
          </h2>
        )}
        <span style={{ fontSize: 12, color: "#334155", marginLeft: "auto" }}>
          Drag canvas to pan · Scroll to zoom · Click card to select
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.04) 0%, transparent 60%), #0a0a16",
          cursor: "default",
          backgroundImage: `
            radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.04) 0%, transparent 60%),
            repeating-linear-gradient(rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 40px)
          `,
        }}
      >
        {/* Transformed world */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", width: 0, height: 0 }}>
          {sorted.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              zoom={zoom}
              selected={selectedId === card.id}
              onSelect={() => setSelectedId(card.id)}
              onBringToFront={() => bringToFront(card.id)}
              onChange={(patch) => updateCard(card.id, patch)}
              onDelete={() => deleteCard(card.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {cards.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.15 }}>🎨</div>
            <p style={{ color: "#1e293b", fontSize: 14, fontWeight: 500 }}>Your board is empty</p>
            <p style={{ color: "#0f172a", fontSize: 12, marginTop: 4 }}>Use the toolbar below to add notes, images, links & more</p>
          </div>
        )}

        {/* Mini-map */}
        <MiniMap cards={cards} pan={pan} zoom={zoom} />

        {/* Toolbar */}
        <Toolbar onAdd={addCard} zoom={zoom} onZoom={handleZoom} onFitAll={fitAll} cardCount={cards.length} />
      </div>
    </div>
  );
}
