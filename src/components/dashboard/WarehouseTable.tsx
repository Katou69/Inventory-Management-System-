import { Plus, ArrowUpRight } from "lucide-react"
import { warehouses } from "@/data/dashboard-data"

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = Math.round((used / total) * 100)
  const color = pct >= 85 ? "bg-red-500" : pct >= 65 ? "bg-amber-400" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 shrink-0 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function WarehouseTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Warehouse Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">{warehouses.length} warehouses total</p>
        </div>
        <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Plus className="size-4" />
          Add Warehouse
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 w-10">#</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Warehouse</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">ID</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Location</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Manager</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Last Inspection</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 min-w-[160px]">Capacity</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map((wh) => (
              <tr key={wh.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-slate-400 text-xs">{wh.id}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <img src={wh.image} alt="" className="size-7 rounded-full object-cover ring-1 ring-slate-200" />
                    <span className="font-medium text-slate-800">{wh.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                    {wh.warehouseId}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600">{wh.location}</td>
                <td className="px-3 py-3 text-slate-600">{wh.manager}</td>
                <td className="px-3 py-3 text-slate-500 text-xs">{wh.lastInspection}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <CapacityBar used={wh.capacityUsed} total={wh.capacityTotal} />
                    <span className="text-xs text-slate-400">{wh.capacityUsed.toLocaleString()} / {wh.capacityTotal.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors">
                    View <ArrowUpRight className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
