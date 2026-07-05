import { useState } from "react";
import SceneCard from "./SceneCard.jsx";
import { downloadMarkdown, downloadPdf } from "../api/mythosApi.js";

export default function StoryDashboard({ storyData }) {
  const [activeScene, setActiveScene] = useState(0);
  const [exporting, setExporting] = useState(null); // "pdf" | "md" | null

  async function handleExport(type) {
    setExporting(type);
    try {
      if (type === "pdf") await downloadPdf(storyData);
      else await downloadMarkdown(storyData);
    } finally {
      setExporting(null);
    }
  }

  const scene = storyData.scenes[activeScene];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Story header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{storyData.title}</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl line-clamp-2">{storyData.premise}</p>
          <p className="text-slate-600 text-xs mt-1">
            {storyData.scenes.length} scenes · Generated {new Date(storyData.generatedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport("md")}
            disabled={!!exporting}
            className="px-4 py-2 rounded-lg border border-white/10 text-xs text-slate-300
                       hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            {exporting === "md" ? "…" : "⬇ Markdown"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs text-white
                       disabled:opacity-40 transition-colors"
          >
            {exporting === "pdf" ? "…" : "⬇ PDF"}
          </button>
        </div>
      </div>

      {/* Scene tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {storyData.scenes.map(({ scene: s }, idx) => (
          <button
            key={s.sceneNumber}
            onClick={() => setActiveScene(idx)}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              idx === activeScene
                ? "bg-brand-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {s.sceneNumber}. {s.title}
          </button>
        ))}
      </div>

      {/* Active scene card */}
      {scene && <SceneCard key={scene.scene.sceneNumber} enrichedScene={scene} />}
    </div>
  );
}
