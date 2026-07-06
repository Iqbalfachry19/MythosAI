// Reusable confirmation dialog — renders as a modal overlay.
// Usage: <ConfirmDialog open={bool} title="..." message="..." onConfirm={fn} onCancel={fn} />

export default function ConfirmDialog({ open, title = "Are you sure?", message, confirmLabel = "Delete", onConfirm, onCancel }) {
  if (!open) return null;

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}
      onMouseDown={handleBackdrop}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-6 space-y-4"
        style={{ background: "#0f1117" }}
      >
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {message && <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
