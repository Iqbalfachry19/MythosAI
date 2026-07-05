import { useState } from "react";
import { ragIngestUrl, ragIngest, ragSearch } from "../api/mythosApi.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDIA_TYPES = ["image", "audio", "video"];

const MEDIA_ICONS = { image: "🖼", audio: "🎵", video: "🎬" };

const SCORE_COLOR = (score) => {
  if (score >= 0.85) return "text-emerald-400";
  if (score >= 0.65) return "text-yellow-400";
  return "text-slate-400";
};

const MEDIA_BADGE = {
  image: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  audio: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
  video: "bg-purple-900/40 text-purple-300 border-purple-700/40",
};

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

function SubTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ── Ingest Panel ──────────────────────────────────────────────────────────────

function IngestPanel() {
  const [mode, setMode] = useState("url"); // "url" | "manual"

  // URL mode state
  const [url, setUrl] = useState("");
  const [urlLabel, setUrlLabel] = useState("");
  const [urlOverrideDesc, setUrlOverrideDesc] = useState("");

  // Manual mode state
  const [manualType, setManualType] = useState("image");
  const [manualLabel, setManualLabel] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  function reset() {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  }

  async function handleUrlIngest(e) {
    e.preventDefault();
    if (!url.trim()) return;
    reset();
    setStatus("loading");
    try {
      const payload = { url: url.trim() };
      if (urlLabel.trim()) payload.label = urlLabel.trim();
      if (urlOverrideDesc.trim()) payload.description = urlOverrideDesc.trim();
      const data = await ragIngestUrl(payload);
      setResult(data.data);
      setStatus("ok");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || "Ingest failed.");
      setStatus("error");
    }
  }

  async function handleManualIngest(e) {
    e.preventDefault();
    if (!manualLabel.trim() || !manualDesc.trim()) return;
    reset();
    setStatus("loading");
    try {
      const payload = {
        mediaType: manualType,
        label: manualLabel.trim(),
        description: manualDesc.trim(),
      };
      if (manualUrl.trim()) payload.url = manualUrl.trim();
      const data = await ragIngest(payload);
      setResult(data.data);
      setStatus("ok");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || "Ingest failed.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode switcher */}
      <div className="flex gap-2">
        <SubTab active={mode === "url"} onClick={() => { setMode("url"); reset(); }}>
          🔗 From URL
        </SubTab>
        <SubTab active={mode === "manual"} onClick={() => { setMode("manual"); reset(); }}>
          ✏️ Manual
        </SubTab>
      </div>

      {/* ── URL mode ── */}
      {mode === "url" && (
        <form onSubmit={handleUrlIngest} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Paste a <strong className="text-slate-300">YouTube link</strong>, <strong className="text-slate-300">image URL</strong> (.jpg / .png / .webp…), or
            <strong className="text-slate-300"> audio URL</strong> (.mp3 / .wav / .flac…).
            The backend auto-detects the type and generates a semantic description.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">URL <span className="text-red-400">*</span></label>
              <input
                type="url"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                           px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="https://www.youtube.com/watch?v=… or https://cdn.example.com/photo.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === "loading"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Label override <span className="text-slate-600">(optional)</span></label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                             px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="My awesome video"
                  value={urlLabel}
                  onChange={(e) => setUrlLabel(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description override <span className="text-slate-600">(optional — skips AI captioning)</span></label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                             px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Leave blank to auto-generate"
                  value={urlOverrideDesc}
                  onChange={(e) => setUrlOverrideDesc(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>
            </div>
          </div>

          <SubmitBtn loading={status === "loading"} label="Index Asset" />
        </form>
      )}

      {/* ── Manual mode ── */}
      {mode === "manual" && (
        <form onSubmit={handleManualIngest} className="space-y-4">
          <p className="text-xs text-slate-500">
            Manually describe a media asset. The description is what gets embedded for semantic search.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Media type selector */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Media type <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {MEDIA_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setManualType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      manualType === t
                        ? MEDIA_BADGE[t] + " border"
                        : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {MEDIA_ICONS[t]} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Label / filename <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                           px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. golden_hour_shot.jpg"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description <span className="text-red-400">*</span> — this gets embedded for semantic search</label>
            <textarea
              required
              rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                         px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Describe the content: mood, subject, style, instrumentation, etc."
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              disabled={status === "loading"}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">URL <span className="text-slate-600">(optional)</span></label>
            <input
              type="url"
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                         px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://…"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              disabled={status === "loading"}
            />
          </div>

          <SubmitBtn loading={status === "loading"} label="Index Asset" />
        </form>
      )}

      {/* Result */}
      {status === "ok" && result && (
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-4 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            ✓ Indexed successfully
          </div>
          <div className="text-xs text-slate-400 space-y-0.5 mt-2">
            <div><span className="text-slate-500">ID:</span> <span className="font-mono text-slate-300">{result.id}</span></div>
            <div><span className="text-slate-500">Type:</span> <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${MEDIA_BADGE[result.mediaType]}`}>{MEDIA_ICONS[result.mediaType]} {result.mediaType}</span></div>
            <div><span className="text-slate-500">Label:</span> <span className="text-slate-300">{result.label}</span></div>
            {result.resolvedFrom && <div><span className="text-slate-500">Resolved from:</span> <span className="text-slate-400 break-all">{result.resolvedFrom}</span></div>}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-3 text-red-300 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* URL type hints */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-500 pt-2">
        {[
          ["🎬", "YouTube", "youtu.be · /watch · /shorts"],
          ["🖼", "Images", ".jpg .png .webp .avif .gif"],
          ["🎵", "Audio", ".mp3 .wav .flac .ogg .m4a"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="rounded-lg bg-white/3 border border-white/5 p-3">
            <div className="text-lg mb-1">{icon}</div>
            <div className="font-medium text-slate-300">{title}</div>
            <div className="mt-0.5 font-mono">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Search Panel ──────────────────────────────────────────────────────────────

function SearchPanel() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [filterType, setFilterType] = useState(""); // "" = all

  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("loading");
    setResults(null);
    setErrorMsg("");
    setSearchedQuery(query.trim());
    try {
      const payload = { query: query.trim(), topK: Number(topK) };
      if (filterType) payload.mediaType = filterType;
      const data = await ragSearch(payload);
      setResults(data.data);
      setStatus("ok");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || "Search failed.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <p className="text-xs text-slate-500">
          Search across all indexed media using natural language.
          Results are ranked by <strong className="text-slate-300">cosine similarity</strong> — rank 1 is the most similar to your query.
        </p>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Query <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600
                       px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. dramatic night scene with tension and rain"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={status === "loading"}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* topK */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Top results</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="rounded-lg bg-white/5 border border-white/10 text-white px-2 py-1.5 text-xs
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={status === "loading"}
            >
              {[3, 5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Filter by type */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Filter type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 text-white px-2 py-1.5 text-xs
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={status === "loading"}
            >
              <option value="">All types</option>
              {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <SubmitBtn loading={status === "loading"} label="Search" />
      </form>

      {/* Error */}
      {status === "error" && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-3 text-red-300 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Results */}
      {status === "ok" && results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <span className="text-white font-medium">{results.totalFound}</span> result{results.totalFound !== 1 ? "s" : ""} for&nbsp;
              <em className="text-slate-300">"{searchedQuery}"</em>
              {results.mediaTypeFilter !== "all" && (
                <span className="ml-1 text-slate-500">· filtered to <span className="text-slate-300">{results.mediaTypeFilter}</span></span>
              )}
            </p>
            {results.totalFound === 0 && (
              <span className="text-xs text-slate-600">No indexed assets match this query.</span>
            )}
          </div>

          {results.results.map((r) => (
            <ResultCard key={r.id} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({ result }) {
  const scoreColor = SCORE_COLOR(result.similarityScore);
  const badge = MEDIA_BADGE[result.mediaType] ?? "bg-white/5 text-slate-300 border-white/10";

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4 flex gap-4">
      {/* Rank badge */}
      <div className="shrink-0 flex flex-col items-center justify-start pt-0.5 w-10">
        <span className="text-2xl font-bold text-slate-600 leading-none">#{result.rank}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${badge}`}>
            {MEDIA_ICONS[result.mediaType]} {result.mediaType}
          </span>
          <span className="text-sm font-semibold text-white truncate">{result.label}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{result.description}</p>
        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-brand-400 hover:text-brand-300 truncate block"
          >
            {result.url}
          </a>
        )}
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
            {Object.entries(result.metadata)
              .filter(([, v]) => v && v !== "null")
              .slice(0, 6)
              .map(([k, v]) => (
                <span key={k}><span className="text-slate-500">{k}:</span> {String(v).slice(0, 60)}</span>
              ))}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="shrink-0 flex flex-col items-end justify-start gap-1 pt-0.5">
        <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>{result.similarityPct}</span>
        <span className="text-[10px] text-slate-600">similarity</span>
      </div>
    </div>
  );
}

// ── Shared submit button ──────────────────────────────────────────────────────

function SubmitBtn({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-6 py-2.5 rounded-lg font-semibold text-sm
                 bg-brand-600 hover:bg-brand-500 text-white
                 disabled:opacity-40 disabled:cursor-not-allowed
                 transition-colors flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Processing…
        </>
      ) : label}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MediaRagPage() {
  const [tab, setTab] = useState("ingest"); // "ingest" | "search"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Media RAG</h2>
        <p className="text-slate-400 text-sm mt-1">
          Index images, audio, and video from URLs — then search them semantically using natural language.
        </p>
      </div>

      {/* Sub-tab bar */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <SubTab active={tab === "ingest"} onClick={() => setTab("ingest")}>⬆ Ingest</SubTab>
        <SubTab active={tab === "search"} onClick={() => setTab("search")}>🔍 Search</SubTab>
      </div>

      {tab === "ingest" && <IngestPanel />}
      {tab === "search" && <SearchPanel />}
    </div>
  );
}
