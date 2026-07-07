import { useState } from "react";
import { useSupabaseStorage } from "../hooks/useSupabaseStorage.js";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "./ConfirmDialog.jsx";
import ImageUploadField from "./ImageUploadField.jsx";

const CATEGORIES = ["Lore & History", "Factions & Politics", "Magic & Rules", "Geography", "Religion & Mythology", "Technology", "Flora & Fauna", "Other"];

const EMPTY_ENTRY = {
  title: "",
  category: "Lore & History",
  summary: "",
  details: "",
  relatedCharacters: "",
  relatedLocations: "",
  inWorldDate: "",
  tags: "",
  isKeyEvent: false,
  refImageUrl: "",
};

function EntryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_ENTRY);
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; onSave(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Title *</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="The First Sundering"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Category</label>
          <select
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.category} onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Related Characters</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.relatedCharacters} onChange={(e) => set("relatedCharacters", e.target.value)} placeholder="Elara, The Elder…"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Related Locations</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.relatedLocations} onChange={(e) => set("relatedLocations", e.target.value)} placeholder="The Obsidian Plains…"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">In-world Date</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.inWorldDate} onChange={(e) => set("inWorldDate", e.target.value)} placeholder="Age of Embers, Year 0"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tags</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="war, magic, pivotal"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Summary</label>
        <textarea
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-brand-500"
          value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Short overview…"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Full Details</label>
        <textarea
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-28 focus:outline-none focus:ring-1 focus:ring-brand-500"
          value={form.details} onChange={(e) => set("details", e.target.value)} placeholder="Deep lore, rules, history…"
        />
      </div>
      <ImageUploadField
        label="Reference Image"
        value={form.refImageUrl}
        onChange={(v) => set("refImageUrl", v)}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox" id="isKey" checked={form.isKeyEvent}
          onChange={(e) => set("isKeyEvent", e.target.checked)}
          className="rounded border-white/20 bg-white/5 accent-brand-500"
        />
        <label htmlFor="isKey" className="text-xs text-slate-400">Mark as Key Scene / Milestone</label>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
      </div>
    </form>
  );
}

const CATEGORY_ICON = {
  "Lore & History": "📜",
  "Factions & Politics": "⚔",
  "Magic & Rules": "✨",
  "Geography": "🗺",
  "Religion & Mythology": "🌙",
  "Technology": "⚙",
  "Flora & Fauna": "🌿",
  "Other": "💡",
};

function EntryCard({ entry, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete world entry?"
        message={`"${entry.title}" will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(entry.id); }}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
        {/* ── Header row ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          {entry.refImageUrl ? (
            <img
              src={entry.refImageUrl}
              alt={entry.title}
              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <span className="text-lg shrink-0">{CATEGORY_ICON[entry.category] ?? "💡"}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{entry.title}</span>
              {entry.isKeyEvent && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700/30">★ Key Event</span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {entry.category}{entry.inWorldDate ? ` · ${entry.inWorldDate}` : ""}
              {entry.summary && ` · ${entry.summary.slice(0, 60)}${entry.summary.length > 60 ? "…" : ""}`}
            </div>
          </div>
          <span className="text-slate-500 text-xs">{open ? "▲" : "▼"}</span>
        </div>

        {/* ── Expanded detail ── */}
        {open && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 text-xs text-slate-300 space-y-2">
            {/* Reference image full size */}
            {entry.refImageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={entry.refImageUrl}
                  alt={entry.title}
                  className="w-full object-cover"
                  style={{ maxHeight: "220px" }}
                  onError={(e) => { e.target.parentElement.style.display = "none"; }}
                />
              </div>
            )}
            {entry.details && <p className="leading-relaxed">{entry.details}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
              {entry.relatedCharacters && <span>👤 {entry.relatedCharacters}</span>}
              {entry.relatedLocations && <span>📍 {entry.relatedLocations}</span>}
              {entry.tags && (
                <span className="flex gap-1">
                  {entry.tags.split(",").map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{t.trim()}</span>
                  ))}
                </span>
              )}
            </div>
            {/* Action buttons — always visible */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onEdit(entry)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                ✏ Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function WorldbuildingPanel() {
  const [entries, setEntries] = useSupabaseStorage("mythos_world", []);
  const [view, setView] = useState("list"); // "list" | "new" | "edit"
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [filterKey, setFilterKey] = useState(false);

  function handleSave(form) {
    if (editing) {
      setEntries((e) => e.map((en) => en.id === editing.id ? { ...form, id: editing.id } : en));
    } else {
      setEntries((e) => [{ ...form, id: uuidv4() }, ...e]);
    }
    setView("list");
    setEditing(null);
  }

  const filtered = entries.filter((e) =>
    (filterCat === "All" || e.category === filterCat) &&
    (!filterKey || e.isKeyEvent)
  );

  const keyCount = entries.filter((e) => e.isKeyEvent).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Worldbuilding</h3>
          <p className="text-xs text-slate-500 mt-0.5">{entries.length} entries · {keyCount} key event{keyCount !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setView(view === "new" ? "list" : "new"); }}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          {view === "new" ? "✕ Cancel" : "+ New Entry"}
        </button>
      </div>

      {view === "new" && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">New World Entry</p>
          <EntryForm onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      )}

      {view === "edit" && editing && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">Edit — {editing.title}</p>
          <EntryForm initial={editing} onSave={handleSave} onCancel={() => { setView("list"); setEditing(null); }} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterCat === c
                ? "bg-brand-600 border-brand-500 text-white"
                : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            {CATEGORY_ICON[c] ?? ""} {c}
          </button>
        ))}
        <button
          onClick={() => setFilterKey((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ml-auto ${
            filterKey
              ? "bg-yellow-900/50 border-yellow-700 text-yellow-300"
              : "border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          ★ Key Events
        </button>
      </div>

      {filtered.length === 0 && view === "list" && (
        <div className="text-center py-12 text-slate-600 text-sm">
          <div className="text-3xl mb-2">🌍</div>
          {entries.length === 0 ? "No world entries yet — start building your universe." : "No entries match this filter."}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={(e) => { setEditing(e); setView("edit"); }}
            onDelete={(id) => setEntries((en) => en.filter((e) => e.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
