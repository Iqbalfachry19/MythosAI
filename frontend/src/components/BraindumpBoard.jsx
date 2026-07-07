import { useState } from "react";
import { useSupabaseStorage } from "../hooks/useSupabaseStorage.js";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "./ConfirmDialog.jsx";

const IDEA_TYPES = ["Premise", "Plot Twist", "Character Idea", "Scene", "Dialogue", "Theme", "Research", "Other"];
const IDEA_ICONS = {
  Premise: "💡", "Plot Twist": "🌀", "Character Idea": "👤",
  Scene: "🎬", Dialogue: "💬", Theme: "🔮", Research: "🔬", Other: "📌",
};
const PRIORITY = ["Low", "Medium", "High"];
const PRIORITY_COLORS = {
  Low: "text-slate-400 bg-slate-800",
  Medium: "text-yellow-400 bg-yellow-900/40",
  High: "text-red-400 bg-red-900/40",
};

// ── Idea Card ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onPin, onDelete, onPromote }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete idea?"
        message={`"${idea.title || "Untitled idea"}" will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(idea.id); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className={`rounded-xl border overflow-hidden transition-colors ${idea.pinned ? "border-yellow-700/40 bg-yellow-900/10" : "border-white/10 bg-white/3"}`}>
        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setOpen((v) => !v)}>
          <span className="text-xl mt-0.5 shrink-0">{IDEA_ICONS[idea.type] ?? "📌"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white">{idea.title || <em className="text-slate-500">Untitled idea</em>}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[idea.priority]}`}>{idea.priority}</span>
              {idea.pinned && <span className="text-[10px] text-yellow-400">📌 Pinned</span>}
            </div>
            {idea.content && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{idea.content}</p>}
            <div className="text-[10px] text-slate-600 mt-0.5">
              {idea.type} · {new Date(idea.createdAt).toLocaleDateString()}
            </div>
          </div>
          <span className="text-slate-500 text-xs ml-1">{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 text-xs text-slate-300 space-y-2">
            {idea.content && <p className="leading-relaxed whitespace-pre-wrap">{idea.content}</p>}
            {idea.relatedChapter && <div className="text-slate-500">📖 Related: {idea.relatedChapter}</div>}
            <div className="flex gap-2 pt-1 flex-wrap">
              <button onClick={() => onPin(idea.id)} className="px-3 py-1.5 rounded-lg bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 transition-colors">
                {idea.pinned ? "Unpin" : "📌 Pin"}
              </button>
              <button onClick={() => onPromote(idea)} className="px-3 py-1.5 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 text-brand-400 transition-colors">
                → Promote to Outline
              </button>
              <button onClick={() => setConfirmOpen(true)} className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors">
                🗑 Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, onUpdate, onDelete }) {
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const done = pct >= 100;
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete goal?"
        message={`"${goal.title}" will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(goal.id); }}
        onCancel={() => setConfirmOpen(false)}
      />
    <div className={`rounded-xl border px-4 py-3 space-y-2 ${done ? "border-emerald-700/40 bg-emerald-900/10" : "border-white/10 bg-white/3"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{goal.title}</span>
            {done && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300">✓ Done</span>}
          </div>
          {goal.deadline && <div className="text-xs text-slate-500 mt-0.5">Due: {goal.deadline}</div>}
        </div>
        <button onClick={() => setConfirmOpen(true)} className="text-xs text-red-500 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-900/30 transition-colors shrink-0">✕</button>
      </div>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-brand-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Quick increment */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={goal.current}
          onChange={(e) => onUpdate(goal.id, "current", Number(e.target.value))}
          className="w-24 rounded-lg bg-white/5 border border-white/10 text-xs text-white p-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span className="text-xs text-slate-500">{goal.unit} written</span>
      </div>
    </div>
    </>
  );
}

// ── BraindumpBoard ────────────────────────────────────────────────────────────

export default function BraindumpBoard() {
  const [ideas, setIdeas] = useSupabaseStorage("mythos_ideas", []);
  const [goals, setGoals] = useSupabaseStorage("mythos_goals", []);
  const [tab, setTab] = useState("ideas"); // "ideas" | "goals"

  // Idea form state
  const [ideaForm, setIdeaForm] = useState({ title: "", type: "Premise", priority: "Medium", content: "", relatedChapter: "" });
  const [showIdeaForm, setShowIdeaForm] = useState(false);

  // Goal form state
  const [goalForm, setGoalForm] = useState({ title: "", target: "", unit: "words", deadline: "", current: 0 });
  const [showGoalForm, setShowGoalForm] = useState(false);

  const [filterType, setFilterType] = useState("All");

  function addIdea() {
    if (!ideaForm.title.trim() && !ideaForm.content.trim()) return;
    setIdeas((arr) => [{ ...ideaForm, id: uuidv4(), createdAt: new Date().toISOString(), pinned: false }, ...arr]);
    setIdeaForm({ title: "", type: "Premise", priority: "Medium", content: "", relatedChapter: "" });
    setShowIdeaForm(false);
  }

  function addGoal() {
    if (!goalForm.title.trim() || !goalForm.target) return;
    setGoals((g) => [...g, { ...goalForm, id: uuidv4(), current: 0, target: Number(goalForm.target) }]);
    setGoalForm({ title: "", target: "", unit: "words", deadline: "", current: 0 });
    setShowGoalForm(false);
  }

  function togglePin(id) {
    setIdeas((arr) => arr.map((i) => i.id === id ? { ...i, pinned: !i.pinned } : i));
  }

  function promoteToOutline(idea) {
    alert(`Idea "${idea.title}" — copy it to your Outline tab as a new chapter note.`);
  }

  function updateGoal(id, field, val) {
    setGoals((g) => g.map((goal) => goal.id === id ? { ...goal, [field]: val } : goal));
  }

  const pinnedIdeas = ideas.filter((i) => i.pinned);
  const filtered = ideas.filter((i) =>
    !i.pinned && (filterType === "All" || i.type === filterType)
  );

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button onClick={() => setTab("ideas")} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "ideas" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"}`}>
            💡 Ideas ({ideas.length})
          </button>
          <button onClick={() => setTab("goals")} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "goals" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"}`}>
            🎯 Goals ({goals.length})
          </button>
        </div>
        <button
          onClick={() => { if (tab === "ideas") setShowIdeaForm((v) => !v); else setShowGoalForm((v) => !v); }}
          className="ml-auto px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          {(tab === "ideas" ? showIdeaForm : showGoalForm) ? "✕ Cancel" : `+ New ${tab === "ideas" ? "Idea" : "Goal"}`}
        </button>
      </div>

      {/* ── Ideas tab ── */}
      {tab === "ideas" && (
        <>
          {showIdeaForm && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-4 space-y-3">
              <p className="text-xs text-brand-400 font-medium uppercase tracking-widest">Quick Capture</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Title</label>
                  <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="The mage reveals the truth…" value={ideaForm.title}
                    onChange={(e) => setIdeaForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Type</label>
                  <select className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={ideaForm.type} onChange={(e) => setIdeaForm((f) => ({ ...f, type: e.target.value }))}>
                    {IDEA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={ideaForm.priority} onChange={(e) => setIdeaForm((f) => ({ ...f, priority: e.target.value }))}>
                    {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes / Braindump</label>
                <textarea className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-24 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Write freely — refine later…" value={ideaForm.content}
                  onChange={(e) => setIdeaForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Related Chapter / Act</label>
                <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Act 2, Ch. 5" value={ideaForm.relatedChapter}
                  onChange={(e) => setIdeaForm((f) => ({ ...f, relatedChapter: e.target.value }))} />
              </div>
              <button onClick={addIdea} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
                Capture Idea
              </button>
            </div>
          )}

          {/* Pinned */}
          {pinnedIdeas.length > 0 && (
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-2 uppercase tracking-widest">📌 Pinned</p>
              <div className="space-y-2">
                {pinnedIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} onPin={togglePin}
                    onDelete={(id) => setIdeas((arr) => arr.filter((i) => i.id !== id))} onPromote={promoteToOutline} />
                ))}
              </div>
            </div>
          )}

          {/* Type filters */}
          {ideas.length > 3 && (
            <div className="flex flex-wrap gap-2">
              {["All", ...IDEA_TYPES].map((t) => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    filterType === t ? "bg-brand-600 border-brand-500 text-white" : "border-white/10 text-slate-400 hover:text-white"
                  }`}>
                  {IDEA_ICONS[t] ?? ""} {t}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 && !showIdeaForm && pinnedIdeas.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm">
              <div className="text-3xl mb-2">💡</div>
              No ideas yet — capture your first inspiration.
            </div>
          )}
          <div className="space-y-2">
            {filtered.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onPin={togglePin}
                onDelete={(id) => setIdeas((arr) => arr.filter((i) => i.id !== id))} onPromote={promoteToOutline} />
            ))}
          </div>
        </>
      )}

      {/* ── Goals tab ── */}
      {tab === "goals" && (
        <>
          {showGoalForm && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-4 space-y-3">
              <p className="text-xs text-brand-400 font-medium uppercase tracking-widest">New Writing Goal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Goal Title *</label>
                  <input className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="First Draft — Act 1" value={goalForm.title}
                    onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Target *</label>
                    <input type="number" min="1"
                      className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="10000" value={goalForm.target}
                      onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))} />
                  </div>
                  <div className="w-28">
                    <label className="text-xs text-slate-400 block mb-1">Unit</label>
                    <select className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value={goalForm.unit} onChange={(e) => setGoalForm((f) => ({ ...f, unit: e.target.value }))}>
                      <option>words</option>
                      <option>pages</option>
                      <option>chapters</option>
                      <option>scenes</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Deadline</label>
                  <input type="date"
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <button onClick={addGoal} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
                Create Goal
              </button>
            </div>
          )}

          {goals.length === 0 && !showGoalForm && (
            <div className="text-center py-12 text-slate-600 text-sm">
              <div className="text-3xl mb-2">🎯</div>
              No writing goals yet — set a wordcount or deadline target.
            </div>
          )}
          <div className="space-y-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} onUpdate={updateGoal}
                onDelete={(id) => setGoals((arr) => arr.filter((g) => g.id !== id))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
