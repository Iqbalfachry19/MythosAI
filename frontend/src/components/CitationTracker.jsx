import { useState } from "react";
import { useSupabaseStorage } from "../hooks/useSupabaseStorage.js";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "./ConfirmDialog.jsx";

const REF_TYPES = ["Book", "Article", "Website", "Video", "Podcast", "Interview", "Dataset", "Document", "Other"];
const REF_ICONS = {
  Book: "📚", Article: "📰", Website: "🌐", Video: "🎬",
  Podcast: "🎙", Interview: "🗣", Dataset: "🗃", Document: "📄", Other: "🔗",
};

const EMPTY_REF = {
  title: "",
  type: "Book",
  author: "",
  source: "",
  url: "",
  year: "",
  excerpt: "",
  notes: "",
  tags: "",
  usedIn: "",
};

const INPUT = "w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500";
const TEXTAREA = `${INPUT} resize-none h-20`;

function CitationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_REF);
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Title *</label>
          <input className={INPUT} placeholder="The Name of the Wind" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Type</label>
          <select className={INPUT} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {REF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Author / Creator</label>
          <input className={INPUT} placeholder="Patrick Rothfuss" value={form.author} onChange={(e) => set("author", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Publisher / Source</label>
          <input className={INPUT} placeholder="DAW Books" value={form.source} onChange={(e) => set("source", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Year</label>
          <input className={INPUT} placeholder="2007" value={form.year} onChange={(e) => set("year", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">URL / DOI</label>
          <input className={INPUT} placeholder="https://…" value={form.url} onChange={(e) => set("url", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Used in (chapter/section)</label>
          <input className={INPUT} placeholder="Ch. 3, Act 2 research…" value={form.usedIn} onChange={(e) => set("usedIn", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tags</label>
          <input className={INPUT} placeholder="magic system, inspiration" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Key Excerpt / Quote</label>
        <textarea className={TEXTAREA} placeholder="Paste the relevant passage or quote…" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Personal Notes</label>
        <textarea className={TEXTAREA} placeholder="Why is this useful? What to borrow?" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function CitationCard({ ref: r, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete reference?"
        message={`"${r.title}" will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(r.id); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setOpen((v) => !v)}>
          <span className="text-xl mt-0.5 shrink-0">{REF_ICONS[r.type] ?? "🔗"}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{r.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {r.type}{r.author ? ` · ${r.author}` : ""}{r.year ? ` · ${r.year}` : ""}
              {r.source ? ` · ${r.source}` : ""}
            </div>
            {r.usedIn && <div className="text-[10px] text-slate-600 mt-0.5">📖 {r.usedIn}</div>}
          </div>
          {r.url && (
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-400 hover:text-brand-300 text-xs shrink-0 px-2 py-1 rounded border border-brand-500/30 bg-brand-600/10 hover:bg-brand-600/20 transition-colors">
              ↗ Open
            </a>
          )}
          <span className="text-slate-500 text-xs ml-1">{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 text-xs text-slate-300 space-y-2">
            {r.excerpt && (
              <blockquote className="border-l-2 border-brand-500/40 pl-3 text-slate-400 italic leading-relaxed">
                {r.excerpt}
              </blockquote>
            )}
            {r.notes && <div><span className="text-slate-500 font-medium">Notes: </span>{r.notes}</div>}
            {r.tags && (
              <div className="flex gap-1 flex-wrap pt-1">
                {r.tags.split(",").map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{t.trim()}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => onEdit(r)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">✏ Edit</button>
              <button onClick={() => setConfirmOpen(true)} className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors">🗑 Delete</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function CitationTracker() {
  const [refs, setRefs] = useSupabaseStorage("mythos_citations", []);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");

  function handleSave(form) {
    if (editing) {
      setRefs((r) => r.map((ref) => ref.id === editing.id ? { ...form, id: editing.id } : ref));
    } else {
      setRefs((r) => [{ ...form, id: uuidv4(), createdAt: new Date().toISOString() }, ...r]);
    }
    setView("list");
    setEditing(null);
  }

  const filtered = refs.filter((r) =>
    (filterType === "All" || r.type === filterType) &&
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.author || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || "").toLowerCase().includes(search.toLowerCase()))
  );

  function formatApa(r) {
    const parts = [];
    if (r.author) parts.push(r.author);
    if (r.year) parts.push(`(${r.year})`);
    if (r.title) parts.push(`*${r.title}*`);
    if (r.source) parts.push(r.source);
    if (r.url) parts.push(r.url);
    return parts.join(". ");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Citations & References</h3>
          <p className="text-xs text-slate-500 mt-0.5">{refs.length} reference{refs.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setView(view === "new" ? "list" : "new"); }}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          {view === "new" ? "✕ Cancel" : "+ Add Reference"}
        </button>
      </div>

      {view === "new" && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">New Reference</p>
          <CitationForm onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      )}
      {view === "edit" && editing && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">Edit — {editing.title}</p>
          <CitationForm initial={editing} onSave={handleSave} onCancel={() => { setView("list"); setEditing(null); }} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["All", ...REF_TYPES].map((t) => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterType === t ? "bg-brand-600 border-brand-500 text-white" : "border-white/10 text-slate-400 hover:text-white"
            }`}>
            {REF_ICONS[t] ?? ""} {t}
          </button>
        ))}
      </div>

      {refs.length > 3 && (
        <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Search by title, author, or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
      )}

      {filtered.length === 0 && view === "list" && (
        <div className="text-center py-12 text-slate-600 text-sm">
          <div className="text-3xl mb-2">📚</div>
          {refs.length === 0 ? "No references yet — add your first source." : "No references match this filter."}
        </div>
      )}

      {refs.length > 0 && (
        <details className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
          <summary className="px-4 py-3 text-xs text-slate-400 cursor-pointer hover:text-white transition-colors select-none">
            📋 Export Reference List (APA-style)
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-1">
            {refs.map((r, i) => (
              <div key={r.id} className="text-xs text-slate-400 leading-relaxed">
                {i + 1}. {formatApa(r)}
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <CitationCard key={r.id} ref={r}
            onEdit={(ref) => { setEditing(ref); setView("edit"); }}
            onDelete={(id) => setRefs((arr) => arr.filter((r) => r.id !== id))} />
        ))}
      </div>
    </div>
  );
}
