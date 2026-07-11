import { useState } from "react";
import CharacterManager from "./CharacterManager.jsx";
import OutlineBoard from "./OutlineBoard.jsx";
import WorldbuildingPanel from "./WorldbuildingPanel.jsx";
import LocationManager from "./LocationManager.jsx";
import BraindumpBoard from "./BraindumpBoard.jsx";
import CitationTracker from "./CitationTracker.jsx";
import MilanoteBoard from "./MilanoteBoard.jsx";

const TABS = [
  { id: "board",      icon: "🎨", label: "Board",         short: "Board" },
  { id: "characters", icon: "👤", label: "Characters",    short: "Characters" },
  { id: "outline",    icon: "📖", label: "Outline",       short: "Outline" },
  { id: "world",      icon: "🌍", label: "Worldbuilding", short: "World" },
  { id: "locations",  icon: "📍", label: "Locations",     short: "Locations" },
  { id: "braindump",  icon: "💡", label: "Ideas & Goals", short: "Ideas" },
  { id: "citations",  icon: "📚", label: "Citations",     short: "Citations" },
];

function WorkspaceTab({ tab, active, onClick }) {
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? tab.id === "board"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "bg-brand-600 text-white"
          : "text-slate-400 hover:text-white hover:bg-white/8"
      }`}
    >
      <span>{tab.icon}</span>
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="sm:hidden">{tab.short}</span>
    </button>
  );
}

export default function WritingWorkspace() {
  const [activeTab, setActiveTab] = useState("board");

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page header — only show when not on board to save space */}
      {activeTab !== "board" && (
        <div>
          <h2 className="text-2xl font-bold text-white">Writing Workspace</h2>
          <p className="text-slate-400 text-sm mt-1">
            Characters · Outline · Worldbuilding · Locations · Ideas · Citations — all saved locally in your browser.
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap border-b border-white/10 pb-3">
        {TABS.map((tab) => (
          <WorkspaceTab key={tab.id} tab={tab} active={activeTab === tab.id} onClick={setActiveTab} />
        ))}
      </div>

      {/* Panel */}
      <div>
        {activeTab === "board"      && <MilanoteBoard />}
        {activeTab === "characters" && <CharacterManager />}
        {activeTab === "outline"    && <OutlineBoard />}
        {activeTab === "world"      && <WorldbuildingPanel />}
        {activeTab === "locations"  && <LocationManager />}
        {activeTab === "braindump"  && <BraindumpBoard />}
        {activeTab === "citations"  && <CitationTracker />}
      </div>
    </div>
  );
}
