"use client"
import Image from "next/image"
import { useState } from "react"
import { ArrowRight, X } from "lucide-react"
import type { ActivityEntry } from "@/types/dashboard"

function ActivityRow({ a }: { a: ActivityEntry }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
      <Image src={a.avatar} alt="" width={32} height={32} className="size-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{a.name}</p>
            <p className="text-xs text-slate-400 leading-tight">{a.role}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">{a.date}</p>
            <p className="text-xs text-slate-300">{a.time}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.description}</p>
      </div>
    </div>
  )
}

export default function ActivityFeed({ activities }: { activities: ActivityEntry[] }) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-[380px] shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest user actions</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
        {activities.slice(0, 5).map((a) => (
          <ActivityRow key={a.id} a={a} />
        ))}
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
        >
          View all activity <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* View all modal */}
      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAll(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">All Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activities.length} recent actions</p>
              </div>
              <button onClick={() => setShowAll(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="size-4 text-slate-400" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto">
              {activities.map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
