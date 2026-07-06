import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "./ConfirmDialog.jsx";
import ImageUploadField from "./ImageUploadField.jsx";

const LOCATION_TYPES = ["City / Town", "Building / Structure", "Wilderness", "Underground", "Celestial / Plane", "Sea / Water", "Other"];

const EMPTY_LOC = {
  name: "",
  type: "Building / Structure",
  region: "",
  climate: "",
  atmosphere: "",
  description: "",
  keyDetails: "",
  sensoryDetails: "",
  inhabitants: "",
  refImageUrl: "",
  tags: "",
};

const TYPE_ICON = {
  "City / Town": "🏙",
  "Building / Structure": "🏛",
  "Wilderness": "🌲",
  "Underground": "⛏",
  "Celestial / Plane": "🌌",
  "Sea / Water": "🌊",
  "Other": "📍",
};

function LocationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_LOC);
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  const Field = ({ label, field, placeholder, multiline }) => (
    <div>
      <label className="text-xs text-slate-400 block mb-1">{label}</label>
      {multiline ? (
        <textarea
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder={placeholder} value={form[field]} onChange={(e) => set(field, e.target.value)}
        />
      ) : (
        <input
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder={placeholder} value={form[field]} onChange={(e) => set(field, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) return; onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Location Name *" field="name" placeholder="The Obsidian Tower" />
        <div>
          <label className="text-xs text-slate-400 block mb-1">Type</label>
          <select
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={form.type} onChange={(e) => set("type", e.target.value)}
          >
            {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Field label="Region / Country" field="region" placeholder="Northern Reaches" />
        <Field label="Climate" field="climate" placeholder="Arctic, arid, temperate…" />
        <Field label="Inhabitants" field="inhabitants" placeholder="Mages, soldiers, spirits…" />
        <Field label="Tags" field="tags" placeholder="dungeon, magic, pivotal" />
      </div>
      <Field label="Atmosphere / Mood" field="atmosphere" placeholder="Oppressive, mysterious, serene…" />
      <Field label="Description" field="description" placeholder="Visual overview of the location…" multiline />
      <Field label="Key Details" field="keyDetails" placeholder="Notable rooms, hazards, secrets…" multiline />
      <Field label="Sensory Details" field="sensoryDetails" placeholder="Sounds, smells, textures to evoke in writing…" multiline />
      <ImageUploadField
        label="Reference Image"
        value={form.refImageUrl}
        onChange={(v) => set("refImageUrl", v)}
      />
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function LocationCard({ loc, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete location?"
        message={`"${loc.name}" will be permanently removed.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(loc.id); }}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
        {/* ── Header row ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          {loc.refImageUrl ? (
            <img
              src={loc.refImageUrl}
              alt={loc.name}
              className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
              {TYPE_ICON[loc.type] ?? "📍"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{loc.name}</div>
            <div className="text-xs text-slate-500">
              {loc.type}{loc.region ? ` · ${loc.region}` : ""}{loc.climate ? ` · ${loc.climate}` : ""}
            </div>
            {loc.atmosphere && <div className="text-xs text-slate-600 italic mt-0.5 truncate">"{loc.atmosphere}"</div>}
          </div>
          <span className="text-slate-500 text-xs ml-2">{open ? "▲" : "▼"}</span>
        </div>

        {/* ── Expanded detail ── */}
        {open && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 text-xs text-slate-300 space-y-2">
            {/* Reference image full size */}
            {loc.refImageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={loc.refImageUrl}
                  alt={loc.name}
                  className="w-full object-cover"
                  style={{ maxHeight: "220px" }}
                  onError={(e) => { e.target.parentElement.style.display = "none"; }}
                />
              </div>
            )}
            {loc.description && <p className="leading-relaxed">{loc.description}</p>}
            {loc.keyDetails && (
              <div><span className="text-slate-500 font-medium">Key Details: </span>{loc.keyDetails}</div>
            )}
            {loc.sensoryDetails && (
              <div><span className="text-slate-500 font-medium">Sensory: </span><em>{loc.sensoryDetails}</em></div>
            )}
            {loc.inhabitants && (
              <div><span className="text-slate-500 font-medium">Inhabitants: </span>{loc.inhabitants}</div>
            )}
            {loc.tags && (
              <div className="flex gap-1 flex-wrap pt-1">
                {loc.tags.split(",").map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{t.trim()}</span>
                ))}
              </div>
            )}
            {/* Action buttons — always visible */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onEdit(loc)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                ✏ Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function LocationManager() {
  const [locations, setLocations] = useLocalStorage("mythos_locations", []);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [filterType, setFilterType] = useState("All");

  function handleSave(form) {
    if (editing) {
      setLocations((l) => l.map((loc) => loc.id === editing.id ? { ...form, id: editing.id } : loc));
    } else {
      setLocations((l) => [{ ...form, id: uuidv4() }, ...l]);
    }
    setView("list");
    setEditing(null);
  }

  const filtered = locations.filter((l) => filterType === "All" || l.type === filterType);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Locations & Settings</h3>
          <p className="text-xs text-slate-500 mt-0.5">{locations.length} location{locations.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setView(view === "new" ? "list" : "new"); }}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          {view === "new" ? "✕ Cancel" : "+ New Location"}
        </button>
      </div>

      {view === "new" && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">New Location</p>
          <LocationForm onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      )}
      {view === "edit" && editing && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">Edit — {editing.name}</p>
          <LocationForm initial={editing} onSave={handleSave} onCancel={() => { setView("list"); setEditing(null); }} />
        </div>
      )}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {["All", ...LOCATION_TYPES].map((t) => (
          <button key={t}
            onClick={() => setFilterType(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterType === t
                ? "bg-brand-600 border-brand-500 text-white"
                : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {TYPE_ICON[t] ?? ""} {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && view === "list" && (
        <div className="text-center py-12 text-slate-600 text-sm">
          <div className="text-3xl mb-2">🏛</div>
          {locations.length === 0 ? "No locations yet — add your first setting." : "No locations match this filter."}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((loc) => (
          <LocationCard
            key={loc.id}
            loc={loc}
            onEdit={(l) => { setEditing(l); setView("edit"); }}
            onDelete={(id) => setLocations((l) => l.filter((loc) => loc.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
