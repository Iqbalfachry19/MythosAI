import { useState, useRef, useEffect } from "react";
import { useSupabaseStorage } from "../hooks/useSupabaseStorage.js";
import { v4 as uuidv4 } from "uuid";
import CharacterManager from "./CharacterManager.jsx";
import OutlineBoard from "./OutlineBoard.jsx";
import WorldbuildingPanel from "./WorldbuildingPanel.jsx";
import LocationManager from "./LocationManager.jsx";
import BraindumpBoard from "./BraindumpBoard.jsx";
import CitationTracker from "./CitationTracker.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_TYPES = {
  NOTE:       { label: "Note",         icon: "📝", color: "#f6e05e" },
  TEXT:       { label: "Text",         icon: "📄", color: "#a78bfa" },
  IMAGE:      { label: "Image",        icon: "🖼️", color: "#34d399" },
  LINK:       { label: "Link",         icon: "🔗", color: "#60a5fa" },
  TODO:       { label: "To-do",        icon: "✅", color: "#fb923c" },
  SECTION:    { label: "Section",      icon: "📋", color: "#94a3b8" },
  // ── Module embeds ──
  CHARACTERS: { label: "Characters",   icon: "👤", color: "#e879f9" },
  OUTLINE:    { label: "Outline",      icon: "📖", color: "#38bdf8" },
  WORLD:      { label: "Worldbuilding",icon: "🌍", color: "#4ade80" },
  LOCATIONS:  { label: "Locations",    icon: "📍", color: "#f97316" },
  IDEAS:      { label: "Ideas & Goals",icon: "💡", color: "#facc15" },
  CITATIONS:  { label: "Citations",    icon: "📚", color: "#a78bfa" },
};

// Separate toolbar groups
const BASIC_TYPES = ["NOTE","TEXT","IMAGE","LINK","TODO","SECTION"];
const MODULE_TYPES = ["CHARACTERS","OUTLINE","WORLD","LOCATIONS","IDEAS","CITATIONS"];

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
  NOTE:       { w: 220, h: 190 },
  TEXT:       { w: 300, h: 200 },
  IMAGE:      { w: 280, h: 240 },
  LINK:       { w: 260, h: 110 },
  TODO:       { w: 260, h: 210 },
  SECTION:    { w: 420, h: 300 },
  CHARACTERS: { w: 480, h: 520 },
  OUTLINE:    { w: 520, h: 560 },
  WORLD:      { w: 500, h: 540 },
  LOCATIONS:  { w: 480, h: 520 },
  IDEAS:      { w: 480, h: 520 },
  CITATIONS:  { w: 480, h: 520 },
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
    case "NOTE":    return { ...base, content: "", color: NOTE_COLORS[0] };
    case "TEXT":    return { ...base, title: "", content: "" };
    case "IMAGE":   return { ...base, src: "", caption: "" };
    case "LINK":    return { ...base, url: "", title: "", favicon: "" };
    case "TODO":    return { ...base, title: "To-do", items: [] };
    case "SECTION": return { ...base, label: "Section", opacity: 0.06 };
    default:        return base; // module cards need no extra data
  }
}

// ── Basic Card Bodies ─────────────────────────────────────────────────────────

function NoteCard({ card, onChange, onDelete }) {
  return (
    <div style={{ width:"100%",height:"100%",background:card.color?.bg??"#fef08a",borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",gap:4,padding:"6px 8px 4px",background:"rgba(0,0,0,0.15)",flexShrink:0 }}>
        {NOTE_COLORS.map((c) => (
          <button key={c.label} title={c.label} onClick={(e)=>{e.stopPropagation();onChange({color:c});}}
            style={{ width:12,height:12,borderRadius:"50%",background:c.bg,border:card.color?.label===c.label?"2px solid white":"1px solid rgba(0,0,0,0.2)",cursor:"pointer",flexShrink:0 }} />
        ))}
        <button onClick={(e)=>{e.stopPropagation();onDelete();}} style={{ marginLeft:"auto",background:"none",border:"none",color:"rgba(0,0,0,0.4)",cursor:"pointer",fontSize:12,lineHeight:1 }}>✕</button>
      </div>
      <textarea value={card.content} onChange={(e)=>onChange({content:e.target.value})}
        placeholder="Write something…" onClick={(e)=>e.stopPropagation()}
        style={{ flex:1,background:"transparent",border:"none",outline:"none",resize:"none",padding:"8px 10px",fontSize:13,color:card.color?.text??"#1a1a00",fontFamily:"inherit",lineHeight:1.6 }} />
    </div>
  );
}

function TextCard({ card, onChange, onDelete }) {
  return (
    <div style={{ width:"100%",height:"100%",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderBottom:"1px solid rgba(139,92,246,0.15)",flexShrink:0 }}>
        <span style={{ fontSize:13 }}>📄</span>
        <input value={card.title} onChange={(e)=>onChange({title:e.target.value})} placeholder="Title…" onClick={(e)=>e.stopPropagation()}
          style={{ flex:1,background:"none",border:"none",outline:"none",color:"#e2e8f0",fontWeight:600,fontSize:13 }} />
        <button onClick={(e)=>{e.stopPropagation();onDelete();}} style={{ background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12 }}>✕</button>
      </div>
      <textarea value={card.content} onChange={(e)=>onChange({content:e.target.value})} placeholder="Write your note…" onClick={(e)=>e.stopPropagation()}
        style={{ flex:1,background:"transparent",border:"none",outline:"none",resize:"none",padding:"8px 10px",fontSize:12.5,color:"#cbd5e1",fontFamily:"inherit",lineHeight:1.65 }} />
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
    <div style={{ width:"100%",height:"100%",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",borderBottom:"1px solid rgba(52,211,153,0.15)",flexShrink:0 }}>
        <span style={{ fontSize:11,color:"#34d399",fontWeight:600,letterSpacing:1 }}>IMAGE</span>
        <button onClick={(e)=>{e.stopPropagation();onDelete();}} style={{ background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12 }}>✕</button>
      </div>
      {card.src ? (
        <div style={{ flex:1,overflow:"hidden" }}>
          <img src={card.src} alt={card.caption||"Image"} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        </div>
      ) : (
        <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer" }}
          onClick={(e)=>{e.stopPropagation();inputRef.current?.click();}}>
          <span style={{ fontSize:28 }}>🖼️</span>
          <span style={{ color:"#64748b",fontSize:12 }}>Click to upload image</span>
          <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} onClick={(e)=>e.stopPropagation()} />
        </div>
      )}
      {card.src && (
        <input value={card.caption} onChange={(e)=>onChange({caption:e.target.value})} placeholder="Caption…" onClick={(e)=>e.stopPropagation()}
          style={{ padding:"5px 10px",background:"rgba(0,0,0,0.4)",border:"none",outline:"none",color:"#94a3b8",fontSize:11,borderTop:"1px solid rgba(52,211,153,0.1)" }} />
      )}
    </div>
  );
}

function LinkCard({ card, onChange, onDelete }) {
  function fetchMeta() {
    if (!card.url) return;
    try {
      const domain = new URL(card.url.startsWith("http") ? card.url : "https://"+card.url).hostname;
      onChange({ favicon:`https://www.google.com/s2/favicons?domain=${domain}&sz=32`, title:card.title||domain });
    } catch {}
  }
  return (
    <div style={{ width:"100%",height:"100%",background:"rgba(96,165,250,0.07)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",borderBottom:"1px solid rgba(96,165,250,0.15)",flexShrink:0 }}>
        <span style={{ fontSize:11,color:"#60a5fa",fontWeight:600,letterSpacing:1 }}>LINK</span>
        <button onClick={(e)=>{e.stopPropagation();onDelete();}} style={{ background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12 }}>✕</button>
      </div>
      <div style={{ padding:"10px",display:"flex",flexDirection:"column",gap:8,flex:1 }}>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          {card.favicon && <img src={card.favicon} width={16} height={16} alt="" style={{ borderRadius:3,flexShrink:0 }} />}
          <input value={card.url} onChange={(e)=>onChange({url:e.target.value})} onBlur={fetchMeta}
            placeholder="https://…" onClick={(e)=>e.stopPropagation()}
            style={{ flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:6,padding:"4px 8px",color:"#60a5fa",fontSize:11.5,outline:"none" }} />
        </div>
        <input value={card.title} onChange={(e)=>onChange({title:e.target.value})} placeholder="Label…" onClick={(e)=>e.stopPropagation()}
          style={{ background:"none",border:"none",outline:"none",color:"#e2e8f0",fontWeight:600,fontSize:13 }} />
        {card.url && (
          <a href={card.url.startsWith("http")?card.url:"https://"+card.url} target="_blank" rel="noopener noreferrer"
            onClick={(e)=>e.stopPropagation()} style={{ fontSize:11,color:"#60a5fa",textDecoration:"underline",opacity:0.7 }}>Open link →</a>
        )}
      </div>
    </div>
  );
}

function TodoCard({ card, onChange, onDelete }) {
  const [newItem, setNewItem] = useState("");
  function addItem() {
    if (!newItem.trim()) return;
    onChange({ items:[...(card.items||[]),{id:uuidv4(),text:newItem.trim(),done:false}] });
    setNewItem("");
  }
  function toggleItem(id) { onChange({ items:(card.items||[]).map((it)=>it.id===id?{...it,done:!it.done}:it) }); }
  function deleteItem(id) { onChange({ items:(card.items||[]).filter((it)=>it.id!==id) }); }
  const done=(card.items||[]).filter((i)=>i.done).length, total=(card.items||[]).length;
  return (
    <div style={{ width:"100%",height:"100%",background:"rgba(251,146,60,0.07)",border:"1px solid rgba(251,146,60,0.2)",borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:"1px solid rgba(251,146,60,0.15)",flexShrink:0 }}>
        <span style={{ fontSize:13 }}>✅</span>
        <input value={card.title} onChange={(e)=>onChange({title:e.target.value})} placeholder="To-do list…" onClick={(e)=>e.stopPropagation()}
          style={{ flex:1,background:"none",border:"none",outline:"none",color:"#e2e8f0",fontWeight:600,fontSize:13 }} />
        {total>0&&<span style={{ fontSize:10,color:"#fb923c",background:"rgba(251,146,60,0.15)",padding:"1px 6px",borderRadius:10 }}>{done}/{total}</span>}
        <button onClick={(e)=>{e.stopPropagation();onDelete();}} style={{ background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12 }}>✕</button>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:"6px 10px" }} onClick={(e)=>e.stopPropagation()}>
        {(card.items||[]).map((item)=>(
          <div key={item.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <input type="checkbox" checked={item.done} onChange={()=>toggleItem(item.id)} style={{ cursor:"pointer",accentColor:"#fb923c",width:14,height:14 }} />
            <span style={{ flex:1,fontSize:12,color:item.done?"#475569":"#cbd5e1",textDecoration:item.done?"line-through":"none" }}>{item.text}</span>
            <button onClick={()=>deleteItem(item.id)} style={{ background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:10,opacity:0.6 }}>✕</button>
          </div>
        ))}
        <div style={{ display:"flex",gap:6,marginTop:6 }}>
          <input value={newItem} onChange={(e)=>setNewItem(e.target.value)}
            onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addItem();}}}
            placeholder="Add item…"
            style={{ flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"4px 8px",color:"#e2e8f0",fontSize:12,outline:"none" }} />
          <button onClick={addItem} style={{ background:"rgba(251,146,60,0.2)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:6,padding:"4px 10px",color:"#fb923c",fontSize:12,cursor:"pointer" }}>+</button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ card, onChange, onDelete }) {
  return (
    <div style={{ width:"100%",height:"100%",background:`rgba(148,163,184,${card.opacity??0.06})`,border:"1.5px dashed rgba(148,163,184,0.25)",borderRadius:14,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",flexShrink:0 }}>
        <span style={{ fontSize:13 }}>📋</span>
        <input value={card.label} onChange={(e)=>onChange({label:e.target.value})} placeholder="Section name…" onClick={(e)=>e.stopPropagation()}
          style={{ flex:1,background:"none",border:"none",outline:"none",color:"#94a3b8",fontWeight:700,fontSize:14,letterSpacing:0.5,textTransform:"uppercase" }} />
        <button onClick={(e)=>{e.stopPropagation();onDelete();}} style={{ background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:12 }}>✕</button>
      </div>
    </div>
  );
}

// ── Module Embed Card ─────────────────────────────────────────────────────────

const MODULE_META = {
  CHARACTERS: { label: "Characters",    icon: "👤", accent: "#e879f9", Component: CharacterManager },
  OUTLINE:    { label: "Outline",       icon: "📖", accent: "#38bdf8", Component: OutlineBoard },
  WORLD:      { label: "Worldbuilding", icon: "🌍", accent: "#4ade80", Component: WorldbuildingPanel },
  LOCATIONS:  { label: "Locations",     icon: "📍", accent: "#f97316", Component: LocationManager },
  IDEAS:      { label: "Ideas & Goals", icon: "💡", accent: "#facc15", Component: BraindumpBoard },
  CITATIONS:  { label: "Citations",     icon: "📚", accent: "#a78bfa", Component: CitationTracker },
};

function ModuleCard({ card, onDelete }) {
  const meta = MODULE_META[card.type];
  if (!meta) return null;
  const { label, icon, accent, Component } = meta;

  return (
    <div style={{
      width:"100%", height:"100%",
      background:"var(--bg-surface)",
      border:`1px solid ${accent}30`,
      borderRadius:14,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
      backdropFilter:"blur(12px)",
      transition:"background 0.3s",
    }}>
      {/* Module header bar */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px",
        background:`linear-gradient(90deg, ${accent}18 0%, transparent 100%)`,
        borderBottom:`1px solid ${accent}20`,
        flexShrink:0,
      }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ color:accent, fontWeight:700, fontSize:13, letterSpacing:0.3 }}>{label}</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:10, color:"#334155", background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:6, border:"1px solid rgba(255,255,255,0.06)" }}>
            embedded
          </span>
          <button
            onClick={(e)=>{e.stopPropagation();onDelete();}}
            style={{ background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:12, padding:"2px 4px", borderRadius:4, lineHeight:1 }}
            onMouseEnter={(e)=>e.currentTarget.style.color="#ef4444"}
            onMouseLeave={(e)=>e.currentTarget.style.color="#475569"}
          >✕</button>
        </div>
      </div>

      {/* Scrollable component area */}
      <div
        style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"12px 14px" }}
        onClick={(e)=>e.stopPropagation()}
        onMouseDown={(e)=>e.stopPropagation()}
        onWheel={(e)=>e.stopPropagation()}
      >
        <Component />
      </div>
    </div>
  );
}

// ── Draggable Board Card ───────────────────────────────────────────────────────

function BoardCard({ card, onChange, onDelete, onBringToFront, selected, onSelect, zoom }) {
  const dragRef = useRef({ active:false });
  const resizeRef = useRef({ active:false });

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest("textarea,input,a,button,select,[data-scroll]")) return;
    e.preventDefault();
    e.stopPropagation();
    onBringToFront();
    onSelect();
    dragRef.current = { active:true, startX:e.clientX, startY:e.clientY, origX:card.x, origY:card.y };
    function onMove(ev) {
      if (!dragRef.current.active) return;
      onChange({ x:dragRef.current.origX+(ev.clientX-dragRef.current.startX)/zoom, y:dragRef.current.origY+(ev.clientY-dragRef.current.startY)/zoom });
    }
    function onUp() { dragRef.current.active=false; window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  function handleResizeDown(e) {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { active:true, startX:e.clientX, startY:e.clientY, origW:card.w, origH:card.h };
    function onMove(ev) {
      if (!resizeRef.current.active) return;
      onChange({ w:Math.max(180,resizeRef.current.origW+(ev.clientX-resizeRef.current.startX)/zoom), h:Math.max(100,resizeRef.current.origH+(ev.clientY-resizeRef.current.startY)/zoom) });
    }
    function onUp() { resizeRef.current.active=false; window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  const isModule = MODULE_TYPES.includes(card.type);
  const accentColor = MODULE_META[card.type]?.accent;

  return (
    <div
      style={{
        position:"absolute", left:card.x, top:card.y,
        width:card.w, height:card.h,
        zIndex:card.zIndex??1,
        userSelect:"none",
        borderRadius:14,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor??'#818cf8'}, 0 12px 40px rgba(0,0,0,0.6)`
          : "0 4px 24px rgba(0,0,0,0.4)",
        transition:"box-shadow 0.15s",
        cursor: isModule ? "default" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onClick={(e)=>{e.stopPropagation();onSelect();}}
    >
      {/* Drag handle for module cards (top bar only) */}
      {isModule && (
        <div
          onMouseDown={(e)=>{
            if(e.target.closest("button")) return;
            // Allow drag from the module header only
            if(!e.currentTarget.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation();
            onBringToFront(); onSelect();
            const orig={x:card.x,y:card.y};
            const start={x:e.clientX,y:e.clientY};
            function mv(ev){ onChange({x:orig.x+(ev.clientX-start.x)/zoom,y:orig.y+(ev.clientY-start.y)/zoom}); }
            function up(){ window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",up); }
            window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
          }}
          style={{ position:"absolute",top:0,left:0,right:0,height:38,zIndex:20,cursor:"grab",borderRadius:"14px 14px 0 0" }}
        />
      )}

      {card.type === "NOTE"       && <NoteCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "TEXT"       && <TextCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "IMAGE"      && <ImageCard   card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "LINK"       && <LinkCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "TODO"       && <TodoCard    card={card} onChange={onChange} onDelete={onDelete} />}
      {card.type === "SECTION"    && <SectionCard card={card} onChange={onChange} onDelete={onDelete} />}
      {isModule && <ModuleCard card={card} onDelete={onDelete} />}

      {/* Resize handle */}
      <div onMouseDown={handleResizeDown}
        style={{ position:"absolute",bottom:0,right:0,width:18,height:18,cursor:"nwse-resize",zIndex:30,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:3 }}>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{ opacity:0.35 }}>
          <path d="M1 8L8 1M4.5 8L8 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ onAdd, zoom, onZoom, onFitAll, cardCount }) {
  return (
    <div style={{
      position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)",
      display:"flex", alignItems:"center", gap:0,
      background:"var(--toolbar-bg)", backdropFilter:"blur(24px)",
      border:"1px solid var(--toolbar-border)", borderRadius:18,
      padding:"6px 10px", zIndex:1000, boxShadow:"var(--shadow-toolbar)",
      whiteSpace:"nowrap",
      transition:"background 0.3s, border-color 0.3s",
    }}>
      {/* Basic card types */}
      <div style={{ display:"flex",alignItems:"center",gap:2 }}>
        {BASIC_TYPES.map((key) => {
          const def = CARD_TYPES[key];
          return (
            <button key={key} onClick={()=>onAdd(key)} title={`Add ${def.label}`}
              style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:1,background:"none",border:"none",cursor:"pointer",padding:"5px 8px",borderRadius:9,transition:"background 0.12s" }}
              onMouseEnter={(e)=>e.currentTarget.style.background="var(--bg-hover)"}
              onMouseLeave={(e)=>e.currentTarget.style.background="none"}>
              <span style={{ fontSize:16 }}>{def.icon}</span>
              <span style={{ fontSize:9,color:"var(--text-muted)",letterSpacing:0.3,textTransform:"uppercase" }}>{def.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width:1,height:32,background:"var(--border-subtle)",margin:"0 8px",flexShrink:0 }} />

      {/* Module embed types */}
      <div style={{ display:"flex",alignItems:"center",gap:2 }}>
        {MODULE_TYPES.map((key) => {
          const def = CARD_TYPES[key];
          const meta = MODULE_META[key];
          return (
            <button key={key} onClick={()=>onAdd(key)} title={`Embed ${def.label}`}
              style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:1,background:"none",border:"none",cursor:"pointer",padding:"5px 8px",borderRadius:9,transition:"background 0.12s" }}
              onMouseEnter={(e)=>{ e.currentTarget.style.background=`${meta.accent}15`; }}
              onMouseLeave={(e)=>e.currentTarget.style.background="none"}>
              <span style={{ fontSize:16 }}>{def.icon}</span>
              <span style={{ fontSize:9,color:meta.accent,letterSpacing:0.3,textTransform:"uppercase",opacity:0.85 }}>{def.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width:1,height:32,background:"var(--border-subtle)",margin:"0 8px",flexShrink:0 }} />

      {/* Zoom */}
      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
        <button onClick={()=>onZoom(-0.1)} style={{ background:"var(--bg-overlay)",border:"1px solid var(--border-subtle)",borderRadius:7,width:26,height:26,color:"var(--text-secondary)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
        <button onClick={()=>onZoom(0)} style={{ background:"none",border:"none",color:"var(--text-muted)",fontSize:10.5,cursor:"pointer",minWidth:34,textAlign:"center",fontVariantNumeric:"tabular-nums" }}>{Math.round(zoom*100)}%</button>
        <button onClick={()=>onZoom(0.1)} style={{ background:"var(--bg-overlay)",border:"1px solid var(--border-subtle)",borderRadius:7,width:26,height:26,color:"var(--text-secondary)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
        <button onClick={onFitAll} style={{ background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.22)",borderRadius:7,padding:"3px 9px",color:"#818cf8",fontSize:10.5,cursor:"pointer",fontWeight:600 }}>Fit</button>
      </div>

      {cardCount>0 && <span style={{ fontSize:9.5,color:"var(--text-faint)",marginLeft:6 }}>{cardCount}</span>}
    </div>
  );
}

// ── Mini-map ──────────────────────────────────────────────────────────────────

function MiniMap({ cards }) {
  if (cards.length===0) return null;
  const W=150, H=90;
  const minX=Math.min(...cards.map((c)=>c.x));
  const minY=Math.min(...cards.map((c)=>c.y));
  const maxX=Math.max(...cards.map((c)=>c.x+c.w));
  const maxY=Math.max(...cards.map((c)=>c.y+c.h));
  const rangeX=maxX-minX||800, rangeY=maxY-minY||600;
  const s=Math.min(W/rangeX,H/rangeY,0.24);
  return (
    <div style={{ position:"absolute",top:14,right:14,width:W,height:H,background:"var(--minimap-bg)",border:"1px solid var(--minimap-border)",borderRadius:8,overflow:"hidden",zIndex:900,backdropFilter:"blur(10px)",transition:"background 0.3s" }}>
      {cards.map((c)=>(
        <div key={c.id} style={{ position:"absolute",left:(c.x-minX)*s,top:(c.y-minY)*s,width:Math.max(4,c.w*s),height:Math.max(3,c.h*s),background:CARD_TYPES[c.type]?.color??"#94a3b8",borderRadius:2,opacity:0.75 }} />
      ))}
    </div>
  );
}

// ── Main MilanoteBoard ────────────────────────────────────────────────────────

export default function MilanoteBoard() {
  const [cards, setCards] = useSupabaseStorage("mythos_milanote_cards", []);
  const [pan, setPan] = useState({ x:0, y:0 });
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [boardName, setBoardName] = useSupabaseStorage("mythos_board_name", "My Story Board");
  const [editingName, setEditingName] = useState(false);

  const canvasRef = useRef(null);
  const panRef = useRef({ active:false });

  function handleCanvasMouseDown(e) {
    if (e.button!==0) return;
    // Only pan when clicking the canvas background itself
    const target = e.target;
    if (target!==canvasRef.current && !target.classList.contains("board-bg")) return;
    setSelectedId(null);
    panRef.current = { active:true, startX:e.clientX, startY:e.clientY, origX:pan.x, origY:pan.y };
    function onMove(ev) {
      if (!panRef.current.active) return;
      setPan({ x:panRef.current.origX+(ev.clientX-panRef.current.startX), y:panRef.current.origY+(ev.clientY-panRef.current.startY) });
    }
    function onUp() { panRef.current.active=false; window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  function handleWheel(e) {
    e.preventDefault();
    setZoom((z)=>clamp(z+(-e.deltaY*0.001),0.15,3));
  }

  useEffect(()=>{
    const el=canvasRef.current;
    if(!el) return;
    el.addEventListener("wheel",handleWheel,{passive:false});
    return ()=>el.removeEventListener("wheel",handleWheel);
  },[]);

  function addCard(type) {
    const rect=canvasRef.current?.getBoundingClientRect()??{width:900,height:600};
    const jitter=()=>(Math.random()-0.5)*100;
    const size=DEFAULT_SIZES[type]??{w:240,h:160};
    const cx=(rect.width/2-pan.x)/zoom;
    const cy=(rect.height/2-pan.y)/zoom;
    const card=newCard(type,{ x:cx-size.w/2+jitter(), y:cy-size.h/2+jitter() });
    setCards((arr)=>[...arr,card]);
    setSelectedId(card.id);
  }

  function updateCard(id,patch) { setCards((arr)=>arr.map((c)=>c.id===id?{...c,...patch}:c)); }
  function deleteCard(id) { setCards((arr)=>arr.filter((c)=>c.id!==id)); if(selectedId===id)setSelectedId(null); }
  function bringToFront(id) { setCards((arr)=>arr.map((c)=>c.id===id?{...c,zIndex:Date.now()}:c)); }

  function handleZoom(delta) {
    if(delta===0){setZoom(1);setPan({x:0,y:0});return;}
    setZoom((z)=>clamp(z+delta,0.15,3));
  }

  function fitAll() {
    if(cards.length===0){setZoom(1);setPan({x:0,y:0});return;}
    const rect=canvasRef.current?.getBoundingClientRect()??{width:900,height:600};
    const minX=Math.min(...cards.map((c)=>c.x));
    const minY=Math.min(...cards.map((c)=>c.y));
    const maxX=Math.max(...cards.map((c)=>c.x+c.w));
    const maxY=Math.max(...cards.map((c)=>c.y+c.h));
    const pad=80;
    const bw=maxX-minX+pad*2, bh=maxY-minY+pad*2;
    const nz=clamp(Math.min(rect.width/bw,rect.height/bh),0.15,2);
    setZoom(nz);
    setPan({ x:rect.width/2-((minX+maxX)/2)*nz, y:rect.height/2-((minY+maxY)/2)*nz });
  }

  const sorted=[...cards].sort((a,b)=>(a.zIndex??0)-(b.zIndex??0));

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 108px)",minHeight:540,position:"relative" }}>
      {/* Board title */}
      <div style={{ display:"flex",alignItems:"center",gap:10,paddingBottom:10,flexShrink:0 }}>
        {editingName ? (
          <input autoFocus value={boardName} onChange={(e)=>setBoardName(e.target.value)}
            onBlur={()=>setEditingName(false)}
            onKeyDown={(e)=>{if(e.key==="Enter")setEditingName(false);}}
            style={{ background:"transparent",border:"none",borderBottom:"2px solid #818cf8",outline:"none",color:"var(--text-primary)",fontSize:20,fontWeight:700,minWidth:200 }} />
        ) : (
          <h2 onClick={()=>setEditingName(true)}
            style={{ fontSize:20,fontWeight:700,color:"var(--text-primary)",cursor:"text",display:"flex",alignItems:"center",gap:8,margin:0 }}>
            {boardName}<span style={{ fontSize:13,opacity:0.25 }}>✎</span>
          </h2>
        )}
        <span style={{ marginLeft:"auto",fontSize:11,color:"var(--text-faint)" }}>
          Drag canvas · Scroll to zoom · Drag card header to move
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{
          flex:1, position:"relative", overflow:"hidden",
          borderRadius:16, border:"1px solid var(--border-subtle)",
          cursor:"default",
          transition:"border-color 0.3s",
        }}
      >
        {/* Grid background layer — marked so mousedown can detect it */}
        <div className="board-bg" style={{
          position:"absolute", inset:0, zIndex:0,
          background:"var(--canvas-bg)",
          backgroundImage:`
            radial-gradient(ellipse at 25% 35%, var(--canvas-glow1) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 65%, var(--canvas-glow2) 0%, transparent 55%),
            repeating-linear-gradient(var(--canvas-grid) 0px, var(--canvas-grid) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(90deg, var(--canvas-grid) 0px, var(--canvas-grid) 1px, transparent 1px, transparent 44px)
          `,
          transition:"background 0.3s",
        }} />

        {/* Transformed canvas world */}
        <div style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:"0 0", position:"absolute", width:0, height:0, zIndex:1 }}>
          {sorted.map((card)=>(
            <BoardCard
              key={card.id} card={card} zoom={zoom}
              selected={selectedId===card.id}
              onSelect={()=>setSelectedId(card.id)}
              onBringToFront={()=>bringToFront(card.id)}
              onChange={(patch)=>updateCard(card.id,patch)}
              onDelete={()=>deleteCard(card.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {cards.length===0&&(
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:2 }}>
            <div style={{ fontSize:44,marginBottom:14,opacity:0.12 }}>🎨</div>
            <p style={{ color:"var(--text-muted)",fontSize:15,fontWeight:600 }}>Board is empty</p>
            <p style={{ color:"var(--text-faint)",fontSize:12,marginTop:6 }}>Use the toolbar below — add notes, or embed Characters, Outline, and more</p>
          </div>
        )}

        <MiniMap cards={cards} />
        <Toolbar onAdd={addCard} zoom={zoom} onZoom={handleZoom} onFitAll={fitAll} cardCount={cards.length} />
      </div>
    </div>
  );
}
