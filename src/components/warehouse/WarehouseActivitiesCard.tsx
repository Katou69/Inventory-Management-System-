"use client"
import { useState } from "react"
import type { WarehouseActivity, WarehouseActivityCategory } from "@/types/dashboard"

type Filter = "All" | WarehouseActivityCategory

const TABS: Filter[] = ["All", "Stock", "Inspection", "User"]

export default function WarehouseActivitiesCard({
  activities, warehouseName,
}: { activities: WarehouseActivity[]; warehouseName: string }) {
  const [filter, setFilter] = useState<Filter>("All")

  const shown = filter === "All"
    ? activities
    : activities.filter((a) => a.category === filter)

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">User Activities</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Recent actions in {warehouseName}</p>
        </div>
        <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                filter === tab ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 divide-y divide-border">
        {shown.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No {filter.toLowerCase()} activity yet.</p>
        )}
        {shown.map((a) => (
          <div key={a.id} className="flex items-start gap-3.5 py-3.5">
            <div className="size-10 rounded-full bg-[#E5F0F5] dark:bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[#1A6B8A] dark:text-primary text-xs font-semibold">{a.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{a.name}</p>
                <span className="text-xs text-muted-foreground">{a.role}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">{a.date}</p>
              <p className="text-xs text-muted-foreground/70">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
