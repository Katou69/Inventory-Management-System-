import { ArrowRight } from "lucide-react"
import { activities } from "@/data/dashboard-data"

export default function ActivityFeed() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-[380px] shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest user actions</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <img src={a.avatar} alt="" className="size-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5" />
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
        ))}
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <button className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors">
          View all activity <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
