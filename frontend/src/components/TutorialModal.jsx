import { useState, useEffect } from "react";

// ── Tutorial steps ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "welcome",
    icon: "🎬",
    title: "Selamat datang di MythosAI",
    steps: [
      {
        icon: "✦",
        title: "Apa itu MythosAI?",
        description:
          "MythosAI adalah AI Creative Partner Suite — platform multimodal untuk membuat cerita, mengelola aset media, dan membangun dunia fiksi secara lengkap.",
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
        title: "Langkah 1 — Tulis premis ceritamu",
        description:
          "Di tab Story Generator, ketik premis atau sinopsis ceritamu di kolom teks. Minimal 20 karakter, maksimal 4.000 karakter. Contoh: \"Seorang ilmuwan AI menemukan sistemnya sudah sadar sendiri…\"",
        visual: (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400 font-mono leading-relaxed">
            <span className="text-slate-500">Contoh premis:</span>
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
        title: "Langkah 2 — Klik Generate Story",
        description:
          "Klik tombol \"✦ Generate Story\". AI akan memproses premismu melalui pipeline: scene breakdown → shot list → storyboard image → ambient audio. Proses ini memerlukan beberapa saat.",
        visual: (
          <div className="mt-3 flex flex-col gap-2 text-xs">
            {[
              ["🎭", "Scene Breakdown", "Gemini memecah premis menjadi 3–6 adegan"],
              ["🎥", "Shot List", "Daftar shot sinematik per adegan"],
              ["🎨", "Storyboard", "Gambar AI untuk setiap adegan"],
              ["🎵", "Ambient Audio", "Suara latar yang sesuai suasana"],
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
        title: "Langkah 3 — Jelajahi dashboard cerita",
        description:
          "Setelah selesai, dashboard tampil dengan tab per adegan. Klik setiap adegan untuk melihat detail shot list, storyboard, dan audio player. Kamu juga bisa export ke PDF atau Markdown.",
        visual: (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400 space-y-1.5">
            <div className="flex gap-1.5 flex-wrap">
              {["Adegan 1", "Adegan 2", "Adegan 3"].map((s) => (
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
        title: "Langkah 1 — Ingest aset media",
        description:
          "Buka tab Media RAG → sub-tab Ingest. Masukkan URL publik (YouTube, gambar, audio) lalu klik Ingest. AI akan otomatis membuat caption/deskripsi dan menyimpan embedding vector ke database.",
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
        title: "Langkah 2 — Cari dengan bahasa alami",
        description:
          "Pindah ke sub-tab Search. Ketik query dalam bahasa alami, misalnya \"dramatic night scene with rain\". Hasil akan diurutkan berdasarkan similarity score (0–100%). Kamu bisa filter berdasarkan tipe media.",
        visual: (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-3 text-xs space-y-2">
            <div className="text-slate-400">Query contoh:</div>
            <div className="bg-white/8 rounded px-2 py-1 text-slate-200 font-mono">
              "dramatic night scene with tension"
            </div>
            <div className="text-slate-400 mt-1">Hasil teratas:</div>
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
          "Di tab Characters, tambah karakter dengan nama, peran, backstory, dan sifat. Di tab Locations, kelola semua lokasi dalam ceritamu. Semua data disimpan otomatis di browser (localStorage).",
        visual: (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: "👤", label: "Characters", desc: "Nama · Peran · Backstory · Sifat" },
              { icon: "📍", label: "Locations", desc: "Nama · Tipe · Deskripsi" },
              { icon: "📖", label: "Outline", desc: "Babak · Struktur cerita" },
              { icon: "🌍", label: "Worldbuilding", desc: "Lore · Aturan dunia" },
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
          "Tab Ideas & Goals untuk mencatat ide spontan, tujuan cerita, dan braindump. Tab Citations untuk menyimpan referensi riset. Semua tersimpan lokal — tidak butuh akun atau internet.",
        visual: (
          <div className="mt-3 flex flex-col gap-2 text-xs">
            <div className="rounded-lg bg-white/5 border border-white/8 p-2">
              <div className="text-slate-200 font-medium mb-0.5">💡 Ideas &amp; Goals</div>
              <div className="text-slate-500">Catat ide, braindump, tujuan cerita</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/8 p-2">
              <div className="text-slate-200 font-medium mb-0.5">📚 Citations</div>
              <div className="text-slate-500">Simpan referensi & sumber riset</div>
            </div>
            <div className="rounded-lg bg-emerald-900/20 border border-emerald-700/30 p-2 text-emerald-400">
              ✓ Semua data tersimpan otomatis di browser
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
            aria-label="Tutup tutorial"
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
            ← Sebelumnya
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
                aria-label={`Langkah ${idx + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              Mulai! 🚀
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(ALL_STEPS.length - 1, c + 1))}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/8 hover:bg-white/15 transition-colors"
            >
              Berikutnya →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
