// Shared image upload field — supports both file upload (converted to data URL)
// and a plain URL string fallback. Stores as a data URL or https:// URL.
// Props: value (string), onChange (string) => void, label (string)

import { useRef } from "react";

export default function ImageUploadField({ label = "Reference Image", value, onChange }) {
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleUrl(e) {
    onChange(e.target.value);
  }

  const isDataUrl = value?.startsWith("data:");

  return (
    <div className="space-y-2">
      <label className="block text-xs text-slate-400">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-white/5" style={{ maxHeight: "180px" }}>
          <img
            src={value}
            alt="reference"
            className="w-full object-cover"
            style={{ maxHeight: "180px" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => { onChange(""); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-red-700/80 transition-colors"
            title="Remove image"
          >
            ✕
          </button>
          {isDataUrl && (
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-slate-300 px-1.5 py-0.5 rounded">
              Local file
            </span>
          )}
        </div>
      )}

      {/* Upload button */}
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-colors shrink-0"
        >
          📁 Upload file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <span className="text-xs text-slate-600">or paste a URL:</span>
      </div>

      <input
        type="text"
        className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
        placeholder="https://…"
        value={isDataUrl ? "" : (value || "")}
        onChange={handleUrl}
      />
    </div>
  );
}
