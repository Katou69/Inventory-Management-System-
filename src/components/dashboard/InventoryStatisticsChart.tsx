import { ChevronDown } from "lucide-react"
import { inventoryData } from "@/data/dashboard-data"

const MAX_VALUE = 40000

function Bar({ value, color }: { value: number; color: string }) {
  const height = Math.round((value / MAX_VALUE) * 100)
  return (
    <div className="flex flex-col items-center justify-end h-full w-3">
      <div
        className={`w-full rounded-t-sm ${color} opacity-85`}
        style={{ height: `${height}%` }}
      />
    </div>
  )
}

export default function InventoryStatisticsChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Inventory Statistics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Stock movements by month</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="size-2 rounded-full bg-amber-400 inline-block" />
            Stock In
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="size-2 rounded-full bg-violet-500 inline-block" />
            Stock Out
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="size-2 rounded-full bg-sky-500 inline-block" />
            Stock Value
          </div>
          <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors">
            Monthly <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative h-[200px] flex items-end gap-2 px-2">
        {/* Y-axis gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0">
          {[40, 30, 20, 10, 0].map((v) => (
            <div key={v} className="flex items-center gap-2 w-full">
              <span className="text-[10px] text-slate-300 w-8 text-right shrink-0">{v}K</span>
              <div className="flex-1 border-t border-slate-100" />
            </div>
          ))}
        </div>

        <div className="flex-1 flex items-end justify-around h-full pl-10">
          {inventoryData.map((d) => (
            <div key={d.month} className="flex items-end gap-0.5 h-full group">
              <Bar value={d.stockIn} color="bg-amber-400" />
              <Bar value={d.stockOut} color="bg-violet-500" />
              <Bar value={d.stockValue} color="bg-sky-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-around mt-2 pl-10">
        {inventoryData.map((d) => (
          <span key={d.month} className="text-[10px] text-slate-400 text-center">{d.month}</span>
        ))}
      </div>
    </div>
  )
}
