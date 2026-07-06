import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "./ConfirmDialog.jsx";

const STATUSES = ["Idea", "Braindump", "Draft", "Editing", "Finished"];
const STATUS_COLORS = {
  Idea:      "bg-slate-700 text-slate-300",
  Braindump: "bg-yellow-900/50 text-yellow-300",
  Draft:     "bg-blue-900/50 text-blue-300",
  Editing:   "bg-purple-900/50 text-purple-300",
  Finished:  "bg-emerald-900/50 text-emerald-300",
};

const EMPTY_ACT = (n) => ({ id: uuidv4(), title: `Act ${n}`, chapters: [] });
const EMPTY_CHAPTER = () => ({
  id: uuidv4(),
  title: "",
  synopsis: "",
  characters: "",
  location: "",
  timelineDate: "",
  status: "Idea",
  wordcountTarget: "",
  notes: "",
});

function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? "bg-white/10 text-slate-400"}`}>
      {status}
    </span>
  );
}

function ActDeleteButton({ actId, actTitle, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete act?"
        message={`"${actTitle}" and all its chapters will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(actId); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <button
        onClick={() => setConfirmOpen(true)}
        className="text-xs text-red-500 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
      >
        ✕
      </button>
    </>
  );
}

function ChapterRow({ chapter, onEdit, onDelete, onStatusChange }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete chapter?"
        message={`"${chapter.title || "Untitled Chapter"}" will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(chapter.id); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-white font-medium">{chapter.title || <em className="text-slate-500">Untitled Chapter</em>}</span>
            <StatusBadge status={chapter.status} />
          </div>
          {chapter.synopsis && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{chapter.synopsis}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-slate-600">
            {chapter.characters && <span>👤 {chapter.characters}</span>}
            {chapter.location && <span>📍 {chapter.location}</span>}
            {chapter.timelineDate && <span>🗓 {chapter.timelineDate}</span>}
            {chapter.wordcountTarget && <span>📝 {chapter.wordcountTarget} words</span>}
          </div>
        </div>
        {/* Actions — always visible */}
        <div className="flex gap-1 shrink-0">
          <select
            value={chapter.status}
            onChange={(e) => onStatusChange(chapter.id, e.target.value)}
            className="text-[10px] rounded bg-white/10 border border-white/10 text-slate-300 px-1 py-0.5 focus:outline-none"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => onEdit(chapter)} className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors">✏</button>
          <button onClick={() => setConfirmOpen(true)} className="text-xs text-red-500 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-900/30 transition-colors">✕</button>
        </div>
      </div>
    </>
  );
}

function ChapterForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_CHAPTER());
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; onSave(form); }}
      className="space-y-3 p-4 rounded-xl border border-white/10 bg-black/20"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Chapter Title *</label>
          <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="The First Betrayal" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Status</label>
          <select className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Characters present</label>
          <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.characters} onChange={(e) => set("characters", e.target.value)} placeholder="Elara, Kael…" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Location</label>
          <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="The Obsidian Tower" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">In-world Date / Time</label>
          <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.timelineDate} onChange={(e) => set("timelineDate", e.target.value)} placeholder="Year 342, 3rd moon, Dawn" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Wordcount Target</label>
          <input type="number" min="0"
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.wordcountTarget} onChange={(e) => set("wordcountTarget", e.target.value)} placeholder="3500" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Synopsis</label>
        <textarea className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-brand-500"
          value={form.synopsis} onChange={(e) => set("synopsis", e.target.value)} placeholder="What happens in this chapter…" />
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Notes</label>
        <textarea className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-14 focus:outline-none focus:ring-1 focus:ring-brand-500"
          value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Reminders, research needed…" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
      </div>
    </form>
  );
}

// ── Kanban view ───────────────────────────────────────────────────────────────
function KanbanView({ acts, onStatusChange }) {
  const allChapters = acts.flatMap((a) => a.chapters.map((c) => ({ ...c, actTitle: a.title })));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {STATUSES.map((status) => {
        const cols = allChapters.filter((c) => c.status === status);
        return (
          <div key={status} className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
            <div className={`px-3 py-2 text-xs font-semibold ${STATUS_COLORS[status]} border-b border-white/10`}>
              {status} <span className="opacity-60 font-normal">({cols.length})</span>
            </div>
            <div className="p-2 space-y-2 min-h-[80px]">
              {cols.map((c) => (
                <div key={c.id} className="rounded-lg bg-white/5 border border-white/8 p-2 text-xs">
                  <div className="text-white font-medium line-clamp-2">{c.title || "Untitled"}</div>
                  <div className="text-slate-500 mt-0.5">{c.actTitle}</div>
                </div>
              ))}
              {cols.length === 0 && <div className="text-slate-700 text-xs text-center py-2">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OutlineBoard() {
  const [acts, setActs] = useLocalStorage("mythos_outline", [EMPTY_ACT(1)]);
  const [viewMode, setViewMode] = useState("list"); // "list" | "kanban"
  const [editingChapter, setEditingChapter] = useState(null); // { actId, chapter }
  const [addingActChapter, setAddingActChapter] = useState(null); // actId

  function addAct() {
    setActs((a) => [...a, EMPTY_ACT(a.length + 1)]);
  }

  function deleteAct(actId) {
    setActs((a) => a.filter((act) => act.id !== actId));
  }

  function renameAct(actId, title) {
    setActs((a) => a.map((act) => act.id === actId ? { ...act, title } : act));
  }

  function saveChapter(actId, form) {
    setActs((acts) =>
      acts.map((act) => {
        if (act.id !== actId) return act;
        const exists = act.chapters.find((c) => c.id === form.id);
        const chapters = exists
          ? act.chapters.map((c) => (c.id === form.id ? form : c))
          : [...act.chapters, form];
        return { ...act, chapters };
      })
    );
    setEditingChapter(null);
    setAddingActChapter(null);
  }

  function deleteChapter(actId, chapterId) {
    setActs((acts) =>
      acts.map((act) =>
        act.id === actId
          ? { ...act, chapters: act.chapters.filter((c) => c.id !== chapterId) }
          : act
      )
    );
  }

  function changeStatus(actId, chapterId, status) {
    setActs((acts) =>
      acts.map((act) =>
        act.id === actId
          ? { ...act, chapters: act.chapters.map((c) => c.id === chapterId ? { ...c, status } : c) }
          : act
      )
    );
  }

  const totalChapters = acts.reduce((s, a) => s + a.chapters.length, 0);
  const statusCounts = STATUSES.map((s) => ({
    s,
    n: acts.flatMap((a) => a.chapters).filter((c) => c.status === s).length,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Story Outline</h3>
          <p className="text-xs text-slate-500 mt-0.5">{acts.length} act{acts.length !== 1 ? "s" : ""} · {totalChapters} chapter{totalChapters !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs transition-colors"
          >
            {viewMode === "list" ? "🗂 Kanban" : "≡ List"}
          </button>
          <button
            onClick={addAct}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
          >
            + Add Act
          </button>
        </div>
      </div>

      {/* Status summary */}
      {totalChapters > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusCounts.map(({ s, n }) => n > 0 && (
            <span key={s} className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[s]}`}>
              {s}: {n}
            </span>
          ))}
        </div>
      )}

      {viewMode === "kanban" ? (
        <KanbanView acts={acts} onStatusChange={(cid, status) => {
          const actId = acts.find((a) => a.chapters.find((c) => c.id === cid))?.id;
          if (actId) changeStatus(actId, cid, status);
        }} />
      ) : (
        <div className="space-y-4">
          {acts.map((act) => (
            <div key={act.id} className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
              {/* Act header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white/3 border-b border-white/10">
                <input
                  className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none focus:underline"
                  value={act.title}
                  onChange={(e) => renameAct(act.id, e.target.value)}
                />
                <span className="text-xs text-slate-500">{act.chapters.length} ch.</span>
                <button
                  onClick={() => setAddingActChapter(addingActChapter === act.id ? null : act.id)}
                  className="text-xs px-3 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 text-brand-400 transition-colors"
                >
                  + Chapter
                </button>
                <ActDeleteButton actId={act.id} actTitle={act.title} onDelete={deleteAct} />
              </div>

              {/* Chapters */}
              {act.chapters.map((chapter) =>
                editingChapter?.chapter.id === chapter.id ? (
                  <div key={chapter.id} className="p-3">
                    <ChapterForm
                      initial={editingChapter.chapter}
                      onSave={(form) => saveChapter(act.id, form)}
                      onCancel={() => setEditingChapter(null)}
                    />
                  </div>
                ) : (
                  <ChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    onEdit={(c) => setEditingChapter({ actId: act.id, chapter: c })}
                    onDelete={(cid) => deleteChapter(act.id, cid)}
                    onStatusChange={(cid, s) => changeStatus(act.id, cid, s)}
                  />
                )
              )}

              {act.chapters.length === 0 && addingActChapter !== act.id && (
                <div className="text-center py-6 text-slate-600 text-xs">No chapters yet</div>
              )}

              {/* Add chapter form inline */}
              {addingActChapter === act.id && (
                <div className="p-3">
                  <ChapterForm
                    onSave={(form) => saveChapter(act.id, form)}
                    onCancel={() => setAddingActChapter(null)}
                  />
                </div>
              )}
            </div>
          ))}

          {acts.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm">
              <div className="text-3xl mb-2">📖</div>
              No acts yet — add your first act to begin structuring your story.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
