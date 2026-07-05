import { useState } from "react";
import PremiseForm from "./components/PremiseForm.jsx";
import StoryDashboard from "./components/StoryDashboard.jsx";
import { generateStory } from "./api/mythosApi.js";

export default function App() {
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Mythos<span className="text-brand-500">AI</span>
          </h1>
          <span className="text-xs text-slate-400 hidden sm:block">Creative Partner Suite</span>
        </div>
        {storyData && (
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← New Story
          </button>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full">
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
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-white/5">
        MythosAI — AI Creative Partner Suite &nbsp;·&nbsp; Multimodal Storytelling Platform
      </footer>
    </div>
  );
}
