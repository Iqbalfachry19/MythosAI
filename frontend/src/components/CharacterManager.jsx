import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { v4 as uuidv4 } from "uuid";

const EMPTY_CHAR = {
  name: "",
  role: "",
  age: "",
  gender: "",
  appearance: "",
  hairStyle: "",
  eyeColor: "",
  clothing: "",
  personality: "",
  motivation: "",
  backstory: "",
  quirks: "",
  refImageUrl: "",
  tags: "",
};

function CharacterForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_CHAR);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  const Field = ({ label, field, placeholder, multiline }) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {multiline ? (
        <textarea
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder={placeholder}
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
        />
      ) : (
        <input
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder={placeholder}
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name *" field="name" placeholder="Elara Voss" />
        <Field label="Role / Archetype" field="role" placeholder="Protagonist, Mentor…" />
        <Field label="Age" field="age" placeholder="28" />
        <Field label="Gender" field="gender" placeholder="Female" />
        <Field label="Hair Style" field="hairStyle" placeholder="Short silver bob" />
        <Field label="Eye Color" field="eyeColor" placeholder="Amber" />
      </div>
      <Field label="Clothing / Outfit" field="clothing" placeholder="Worn leather duster, utility belt…" />
      <Field label="Physical Appearance" field="appearance" placeholder="Tall, angular features, scar above left brow…" multiline />
      <Field label="Personality" field="personality" placeholder="Calculated, dry humor, fiercely loyal…" multiline />
      <Field label="Motivation / Goal" field="motivation" placeholder="What drives them? What do they fear?" multiline />
      <Field label="Backstory" field="backstory" placeholder="Key past events…" multiline />
      <Field label="Quirks / Habits" field="quirks" placeholder="Always hums when nervous…" />
      <Field label="Reference Image URL" field="refImageUrl" placeholder="https://…" />
      <Field label="Tags (comma-separated)" field="tags" placeholder="hero, magic, warrior" />
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          Save Character
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CharacterCard({ char, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {char.refImageUrl ? (
          <img
            src={char.refImageUrl}
            alt={char.name}
            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
            {char.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{char.name}</div>
          <div className="text-xs text-slate-500 truncate">{[char.role, char.age && `Age ${char.age}`].filter(Boolean).join(" · ")}</div>
        </div>
        {char.tags && (
          <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[160px]">
            {char.tags.split(",").slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-600/20 text-brand-400 border border-brand-500/20">
                {t.trim()}
              </span>
            ))}
          </div>
        )}
        <span className="text-slate-500 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3 text-xs text-slate-300">
          {char.appearance && <Detail label="Appearance" value={char.appearance} />}
          {char.hairStyle && <Detail label="Hair" value={char.hairStyle} />}
          {char.eyeColor && <Detail label="Eyes" value={char.eyeColor} />}
          {char.clothing && <Detail label="Clothing" value={char.clothing} />}
          {char.personality && <Detail label="Personality" value={char.personality} />}
          {char.motivation && <Detail label="Motivation" value={char.motivation} />}
          {char.backstory && <Detail label="Backstory" value={char.backstory} />}
          {char.quirks && <Detail label="Quirks" value={char.quirks} />}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onEdit(char)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              ✏ Edit
            </button>
            <button
              onClick={() => onDelete(char.id)}
              className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-slate-500 font-medium">{label}: </span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}

export default function CharacterManager() {
  const [characters, setCharacters] = useLocalStorage("mythos_characters", []);
  const [view, setView] = useState("list"); // "list" | "new" | "edit"
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  function handleSave(form) {
    if (editing) {
      setCharacters((c) => c.map((ch) => (ch.id === editing.id ? { ...form, id: editing.id } : ch)));
    } else {
      setCharacters((c) => [{ ...form, id: uuidv4() }, ...c]);
    }
    setView("list");
    setEditing(null);
  }

  function handleEdit(char) {
    setEditing(char);
    setView("edit");
  }

  function handleDelete(id) {
    setCharacters((c) => c.filter((ch) => ch.id !== id));
  }

  const filtered = characters.filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) || (c.tags || "").toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-white">Characters</h3>
          <p className="text-xs text-slate-500 mt-0.5">{characters.length} character{characters.length !== 1 ? "s" : ""} · click to expand details</p>
        </div>
        <button
          onClick={() => { setEditing(null); setView(view === "new" ? "list" : "new"); }}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
        >
          {view === "new" ? "✕ Cancel" : "+ New Character"}
        </button>
      </div>

      {view === "new" && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">New Character</p>
          <CharacterForm onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      )}

      {view === "edit" && editing && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
          <p className="text-xs text-brand-400 font-medium mb-4 uppercase tracking-widest">Edit — {editing.name}</p>
          <CharacterForm initial={editing} onSave={handleSave} onCancel={() => { setView("list"); setEditing(null); }} />
        </div>
      )}

      {characters.length > 3 && (
        <input
          className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Search by name or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {filtered.length === 0 && view === "list" && (
        <div className="text-center py-12 text-slate-600 text-sm">
          <div className="text-3xl mb-2">👤</div>
          {characters.length === 0 ? "No characters yet — create your first one." : "No characters match your search."}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((char) => (
          <CharacterCard key={char.id} char={char} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
