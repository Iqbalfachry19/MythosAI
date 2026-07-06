import { useState, useEffect } from "react";
import PremiseForm from "./components/PremiseForm.jsx";
import StoryDashboard from "./components/StoryDashboard.jsx";
import MediaRagPage from "./components/MediaRagPage.jsx";
import WritingWorkspace from "./components/WritingWorkspace.jsx";
import TutorialModal from "./components/TutorialModal.jsx";
import { generateStory } from "./api/mythosApi.js";

// ── Nav tab component ─────────────────────────────────────────────────────────

function NavTab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "text-slate-400 hover:text-white hover:bg-white/8"
      }`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("story"); // "story" | "rag" | "workspace"

  // Tutorial modal state
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Auto-show tutorial on first visit
  useEffect(() => {
    const seen = localStorage.getItem("mythosai_tutorial_seen");
    if (!seen) {
      setTutorialOpen(true);
      localStorage.setItem("mythosai_tutorial_seen", "1");
    }
  }, []);

  // Story page state
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [storyData, setStoryData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(premise) {
    setStatus("loading");
    setStoryData(null);
    setErrorMsg("");

    try {
      const data = await generateStory(premise);
      setStoryData(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setStoryData(null);
    setErrorMsg("");
  }

  function switchPage(p) {
    setPage(p);
    if (p !== "story") handleReset();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl">🎬</span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Mythos<span className="text-brand-500">AI</span>
          </h1>
          <span className="text-xs text-slate-500 hidden md:block">Creative Partner Suite</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavTab
            active={page === "story"}
            onClick={() => switchPage("story")}
            icon="✦"
            label="Story Generator"
          />
          <NavTab
            active={page === "rag"}
            onClick={() => switchPage("rag")}
            icon="🔍"
            label="Media RAG"
          />
          <NavTab
            active={page === "workspace"}
            onClick={() => switchPage("workspace")}
            icon="✍"
            label="Writing Workspace"
          />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Back button when story is loaded */}
          {page === "story" && storyData && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← New Story
            </button>
          )}
          {/* Tutorial button */}
          <button
            onClick={() => setTutorialOpen(true)}
            title="Lihat tutorial"
            className="w-7 h-7 flex items-center justify-center rounded-full border border-white/15 text-slate-400 hover:text-white hover:border-white/30 text-xs font-bold transition-colors"
          >
            ?
          </button>
        </div>
      </header>

      {/* ── Tutorial Modal ─────────────────────────────────────────────── */}
      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full">
        {/* ── Story page ── */}
        {page === "story" && (
          <>
            {status !== "success" && (
              <PremiseForm onSubmit={handleSubmit} isLoading={status === "loading"} />
            )}
            {status === "error" && (
              <div className="mt-6 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-red-300 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}
            {status === "success" && storyData && (
              <StoryDashboard storyData={storyData} />
            )}
          </>
        )}

        {/* ── Media RAG page ── */}
        {page === "rag" && <MediaRagPage />}

        {/* ── Writing Workspace page ── */}
        {page === "workspace" && <WritingWorkspace />}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-white/5">
        MythosAI — AI Creative Partner Suite &nbsp;·&nbsp; Multimodal Storytelling + Media RAG
      </footer>
    </div>
  );
}
