"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

const tabs = ["All Purchases", "Completed", "Cancelled"];

export default function Filters() {
  const [activeTab, setActiveTab] = useState("All Purchases");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              activeTab === tab
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground bg-card">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          13-03-2023
        </button>
        <span className="text-sm text-muted-foreground">To</span>
        <button className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground bg-card">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          13-03-2023
        </button>
      </div>
    </div>
  );
}