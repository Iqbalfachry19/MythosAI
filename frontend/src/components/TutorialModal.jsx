import { useState, useEffect } from "react";

// ── Tutorial steps ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "welcome",
    icon: "🎬",
    title: "Welcome to MythosAI",
    steps: [
      {
        icon: "✦",
        title: "What is MythosAI?",
        description:
          "MythosAI is an AI Creative Partner Suite — a multimodal platform for crafting stories, managing media assets, and building fictional worlds end-to-end.",
        visual: (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { icon: "✦", label: "Story Generator", color: "bg-brand-600/20 border-brand-500/30" },
              { icon: "🔍", label: "Media RAG", color: "bg-purple-600/20 border-purple-500/30" },
              { icon: "✍", label: "Writing Workspace", color: "bg-teal-600/20 border-teal-500/30" },
            ].map((f) => (
              <div
                key={f.label}
                className={`rounded-lg border ${f.color} p-3 text-center`}
              >
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="text-xs text-slate-300 font-medium">{f.label}</div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: "story",
    icon: "✦",
    title: "Story Generator",
    steps: [
      {
        icon: "📝",
        title: "Step 1 — Write your story premise",
        description:
          "In the Story Generator tab, type a premise or synopsis in the text box. Minimum 20 characters, maximum 4,000 characters. Example: \"An AI researcher discovers her experimental system has spontaneously developed consciousness…\"",
        visual: (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400 font-mono leading-relaxed">
            <span className="text-slate-500">Example premise:</span>
            <br />
            <span className="text-slate-300">
              "A space explorer crash-lands on an alien world and must earn the
              trust of its inhabitants before a solar storm destroys both civilisations."
            </span>
          </div>
        ),
      },
      {
        icon: "⚡",
        title: "Step 2 — Click Generate Story",
        description:
          "Click the \"✦ Generate Story\" button. The AI will process your premise through the full pipeline: scene breakdown → shot list → storyboard images → ambient audio. This may take a few moments.",
        visual: (
          <div className="mt-3 flex flex-col gap-2 text-xs">
            {[
              ["🎭", "Scene Breakdown", "Gemini splits your premise into 3–6 scenes"],
              ["🎥", "Shot List", "Cinematic shots for each scene"],
              ["🎨", "Storyboard", "AI-generated visuals per scene"],
              ["🎵", "Ambient Audio", "Mood-matching background sound"],
            ].map(([ico, t, d]) => (
              <div key={t} className="flex items-start gap-2 rounded-lg bg-white/5 p-2 border border-white/8">
                <span className="text-base shrink-0">{ico}</span>
                <div>
                  <div className="text-slate-200 font-medium">{t}</div>
                  <div className="text-slate-500">{d}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        icon: "📊",
        title: "Step 3 — Explore the story dashboard",
        description:
          "Once complete, a tabbed dashboard appears with one tab per scene. Click any scene to view its shot list, storyboard, and audio player. You can also export the full story to PDF or Markdown.",
        visual: (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400 space-y-1.5">
            <div className="flex gap-1.5 flex-wrap">
              {["Scene 1", "Scene 2", "Scene 3"].map((s) => (
                <span key={s} className="px-2 py-0.5 rounded bg-brand-600/30 border border-brand-500/30 text-brand-300 text-xs">
                  {s}
                </span>
              ))}
            </div>
            <div className="text-slate-300">▸ Shot list · Storyboard · Audio player</div>
            <div className="text-slate-300">▸ Export: PDF | Markdown</div>
          </div>
        ),
      },
    ],
  },
  {
    id: "rag",
    icon: "🔍",
    title: "Media RAG",
    steps: [
      {
        icon: "📥",
        title: "Step 1 — Ingest media assets",
        description:
          "Open the Media RAG tab → Ingest sub-tab. Paste a public URL (YouTube, image, or audio) and click Ingest. The AI will automatically generate a caption or description and store its vector embedding in the database.",
        visual: (
          <div className="mt-3 space-y-2 text-xs">
            {[
              ["🎬", "YouTube URL", "youtube.com/watch?v=..."],
              ["🖼", "Image URL", "cdn.example.com/hero.jpg"],
              ["🎵", "Audio URL", "cdn.example.com/track.mp3"],
            ].map(([ico, t, ex]) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/8 p-2">
                <span>{ico}</span>
                <div>
                  <div className="text-slate-200">{t}</div>
                  <div className="text-slate-500 font-mono">{ex}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        icon: "🔎",
        title: "Step 2 — Search with natural language",
        description:
          "Switch to the Search sub-tab. Type a query in plain English, e.g. \"dramatic night scene with rain\". Results are ranked by cosine similarity score (0–100%). You can filter by media type.",
        visual: (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-3 text-xs space-y-2">
            <div className="text-slate-400">Example query:</div>
            <div className="bg-white/8 rounded px-2 py-1 text-slate-200 font-mono">
              "dramatic night scene with tension"
            </div>
            <div className="text-slate-400 mt-1">Top result:</div>
            <div className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5 border border-white/8">
              <span className="text-slate-300">chase_scene.mp4</span>
              <span className="text-green-400 font-semibold">93.5%</span>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "workspace",
    icon: "✍",
    title: "Writing Workspace",
    steps: [
      {
        icon: "👤",
        title: "Characters & Locations",
        description:
          "In the Characters tab, add characters with a name, role, backstory, and traits. In the Locations tab, manage every location in your story. All data is saved automatically in your browser (localStorage).",
        visual: (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: "👤", label: "Characters", desc: "Name · Role · Backstory · Traits" },
              { icon: "📍", label: "Locations", desc: "Name · Type · Description" },
              { icon: "📖", label: "Outline", desc: "Acts · Story structure" },
              { icon: "🌍", label: "Worldbuilding", desc: "Lore · World rules" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/5 border border-white/8 p-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span>{item.icon}</span>
                  <span className="text-slate-200 font-medium">{item.label}</span>
                </div>
                <div className="text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        ),
      },
      {
        icon: "💡",
        title: "Ideas & Citations",
        description:
          "Use the Ideas & Goals tab to capture spontaneous ideas, story goals, and braindumps. Use the Citations tab to store research references. Everything is saved locally — no account or internet required.",
        visual: (
          <div className="mt-3 flex flex-col gap-2 text-xs">
            <div className="rounded-lg bg-white/5 border border-white/8 p-2">
              <div className="text-slate-200 font-medium mb-0.5">💡 Ideas &amp; Goals</div>
              <div className="text-slate-500">Capture ideas, braindumps, and story goals</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/8 p-2">
              <div className="text-slate-200 font-medium mb-0.5">📚 Citations</div>
              <div className="text-slate-500">Store references and research sources</div>
            </div>
            <div className="rounded-lg bg-emerald-900/20 border border-emerald-700/30 p-2 text-emerald-400">
              ✓ All data is saved automatically in your browser
            </div>
          </div>
        ),
      },
    ],
  },
];

// ── Flatten all steps with section metadata ────────────────────────────────────

function buildSteps() {
  const all = [];
  SECTIONS.forEach((section) => {
    section.steps.forEach((step, i) => {
      all.push({ ...step, sectionId: section.id, sectionIcon: section.icon, sectionTitle: section.title, stepIndex: i, totalInSection: section.steps.length });
    });
  });
  return all;
}
const ALL_STEPS = buildSteps();

// ── TutorialModal ──────────────────────────────────────────────────────────────

export default function TutorialModal({ open, onClose }) {
  const [current, setCurrent] = useState(0);

  // Reset to first step whenever modal opens
  useEffect(() => {
    if (open) setCurrent(0);
  }, [open]);

  if (!open) return null;

  const step = ALL_STEPS[current];
  const isFirst = current === 0;
  const isLast = current === ALL_STEPS.length - 1;

  // Section progress bar segments
  const sectionIndex = SECTIONS.findIndex((s) => s.id === step.sectionId);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onMouseDown={handleBackdrop}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "#0f1117" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="text-xl">{step.sectionIcon}</span>
            <span className="text-sm font-semibold text-white">{step.sectionTitle}</span>
            <span className="text-xs text-slate-500 ml-1">
              {step.stepIndex + 1} / {step.totalInSection}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-lg leading-none"
            aria-label="Close tutorial"
          >
            ✕
          </button>
        </div>

        {/* ── Section progress dots ── */}
        <div className="flex gap-1.5 px-5 pt-3">
          {SECTIONS.map((s, idx) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx < sectionIndex
                  ? "bg-brand-500"
                  : idx === sectionIndex
                  ? "bg-brand-400"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* ── Step content ── */}
        <div className="px-5 py-5 flex-1 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl shrink-0">{step.icon}</span>
            <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
          {step.visual}
        </div>

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/8">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={isFirst}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {/* Step dots */}
          <div className="flex gap-1">
            {ALL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === current ? "bg-brand-400" : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              Get Started! 🚀
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(ALL_STEPS.length - 1, c + 1))}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/8 hover:bg-white/15 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
