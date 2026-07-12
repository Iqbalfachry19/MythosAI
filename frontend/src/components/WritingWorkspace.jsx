import { useState } from "react";
import MilanoteBoard from "./MilanoteBoard.jsx";

const TABS = [
  { id: "board", icon: "🎨", label: "Board", short: "Board" },
  { id: "characters", icon: "👤", label: "Characters", short: "Characters" },
  { id: "outline", icon: "📖", label: "Outline", short: "Outline" },
  { id: "world", icon: "🌍", label: "Worldbuilding", short: "World" },
  { id: "locations", icon: "📍", label: "Locations", short: "Locations" },
  { id: "braindump", icon: "💡", label: "Ideas & Goals", short: "Ideas" },
  { id: "citations", icon: "📚", label: "Citations", short: "Citations" },
];



export default function WritingWorkspace() {
  const [activeTab, setActiveTab] = useState("board");

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page header — only show when not on board to save space */}


      {/* Panel */}
      <div>
        {activeTab === "board" && <MilanoteBoard />}
      </div>
    </div>
  );
}
