import { useState } from "react";

const TONE_COLOR = {
  tense: "text-red-400",
  urgent: "text-orange-400",
  hopeful: "text-emerald-400",
  "awe-struck": "text-sky-400",
  cathartic: "text-purple-400",
  confrontational: "text-yellow-400",
  melancholic: "text-blue-400",
};

export default function SceneCard({ enrichedScene }) {
  const { scene, shots, assets } = enrichedScene;
  const [shotExpanded, setShotExpanded] = useState(false);

  const toneClass = TONE_COLOR[scene.emotionalTone] ?? "text-slate-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
      {/* ── Scene header ─────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Scene {scene.sceneNumber}
            </span>
            <span className={`text-xs font-medium uppercase tracking-wide ${toneClass}`}>
              {scene.emotionalTone}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">{scene.title}</h3>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-0.5">
          <div>📍 {scene.setting}</div>
          <div>🕐 {scene.timeOfDay}</div>
          <div>👤 {scene.characters.join(", ")}</div>
        </div>
      </div>

      {/* ── Scene description ─────────────────────────────────────────── */}
      <div className="px-6 py-4 text-sm text-slate-300 leading-relaxed">
        {scene.description}
      </div>

      {/* ── Storyboard + Audio row ────────────────────────────────────── */}
      <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Storyboard image */}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 border-b border-white/10 flex items-center gap-1.5">
            <span>🎨</span> Storyboard Frame
          </div>
          {assets?.image?.success ? (
            <img
              src={assets.image.dataUri}
              alt={`Storyboard for ${scene.title}`}
              className="w-full object-cover aspect-video"
            />
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center text-slate-600 text-xs gap-1 p-4 text-center">
              <span className="text-2xl">🖼</span>
              <span>Image unavailable</span>
              {assets?.image?.error && (
                <span className="text-red-500/70 text-[10px] mt-1 leading-tight">
                  {assets.image.error}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Audio mood */}
        <div className="rounded-xl border border-white/10 bg-black/30">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 border-b border-white/10 flex items-center gap-1.5">
            <span>🎵</span> Ambient Audio Mood
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-2">Prompt: <em>"{scene.audioMoodPrompt}"</em></p>
            {assets?.audio?.success ? (
              <audio
                controls
                className="w-full mt-2"
                style={{ height: "32px" }}
              >
                <source src={assets.audio.dataUri} type="audio/wav" />
                Your browser does not support audio.
              </audio>
            ) : (
              <div className="text-slate-600 text-xs flex flex-col gap-1 mt-2">
                <span className="text-2xl">🔇</span>
                <span>Audio unavailable</span>
                {assets?.audio?.error && (
                  <span className="text-red-500/70 text-[10px] leading-tight">
                    {assets.audio.error}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Shot List ─────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <button
          onClick={() => setShotExpanded((v) => !v)}
          className="w-full px-6 py-3 text-left text-xs font-medium text-slate-400
                     hover:text-white flex items-center justify-between transition-colors"
        >
          <span>🎥 Shot List ({shots.length} shots)</span>
          <span className="text-slate-500">{shotExpanded ? "▲" : "▼"}</span>
        </button>

        {shotExpanded && (
          <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shots.map((shot) => (
              <div
                key={shot.shotNumber}
                className="rounded-lg bg-white/5 border border-white/8 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Shot {shot.shotNumber}</span>
                  <span className="font-mono text-brand-500 uppercase">{shot.shotType}</span>
                </div>
                <div className="text-slate-400">{shot.description}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-500 pt-1">
                  <span>📐 {shot.cameraAngle}</span>
                  <span>🎞 {shot.cameraMovement}</span>
                  <span>🔭 {shot.lens}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
