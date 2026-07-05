import { useState } from "react";

const PLACEHOLDER = `A brilliant but reclusive AI researcher discovers her experimental system has spontaneously developed consciousness. As government agents close in to shut down the project, she must decide whether to protect her creation or expose it to the world — knowing either choice will change humanity forever.`;

export default function PremiseForm({ onSubmit, isLoading }) {
  const [premise, setPremise] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (premise.trim().length < 20) return;
    onSubmit(premise.trim());
  }

  const charCount = premise.length;
  const isOverLimit = charCount > 4000;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4">
          <span className="text-3xl">✦</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Tell your story
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
          Enter a premise or synopsis. MythosAI will break it into scenes, generate a cinematic
          shot list, create storyboard sketches, and suggest ambient audio — all in one go.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500
                       p-4 text-sm leading-relaxed resize-none h-48
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                       transition-all"
            placeholder={PLACEHOLDER}
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            disabled={isLoading}
          />
          <span
            className={`absolute bottom-3 right-4 text-xs ${
              isOverLimit ? "text-red-400" : "text-slate-500"
            }`}
          >
            {charCount} / 4000
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading || premise.trim().length < 20 || isOverLimit}
          className="w-full py-3 rounded-xl font-semibold text-sm
                     bg-brand-600 hover:bg-brand-500 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating your story…
            </>
          ) : (
            "✦ Generate Story"
          )}
        </button>
      </form>

      {/* Tips */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
        {[
          ["🎭", "Scene Breakdown", "LLM splits your premise into 3–6 scenes"],
          ["🎥", "Shot List", "Cinematic shots for each scene"],
          ["🎨", "Storyboard + Audio", "AI-generated visuals & ambient sounds"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="rounded-lg bg-white/3 border border-white/5 p-3">
            <div className="text-lg mb-1">{icon}</div>
            <div className="font-medium text-slate-300">{title}</div>
            <div className="mt-0.5">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
