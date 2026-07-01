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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">User Activities</h3>
          <p className="text-xs text-slate-400 mt-0.5">Recent actions in {warehouseName}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                filter === tab ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {shown.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">No {filter.toLowerCase()} activity yet.</p>
        )}
        {shown.map((a) => (
          <div key={a.id} className="flex items-start gap-3.5 py-3.5">
            <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="text-indigo-600 text-xs font-semibold">{a.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                <span className="text-xs text-slate-400">{a.role}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{a.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400">{a.date}</p>
              <p className="text-xs text-slate-300">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
