"use client"
import { useState } from "react"
import { Eye, ChevronDown, X } from "lucide-react"
import { products } from "@/data/dashboard-data"
import type { Product } from "@/types/dashboard"

const categoryColors: Record<string, string> = {
  "Whisky": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Non-Whiskey": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
}

const PERIODS = ["This week", "This month", "This quarter", "This year"]

export default function ProductTable() {
  const [period, setPeriod] = useState("This month")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Top Ordered Products</h3>
          <p className="text-xs text-slate-400 mt-0.5">By revenue · {period.toLowerCase()}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setPeriodOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            {period}
            <ChevronDown className={`size-3.5 transition-transform ${periodOpen ? "rotate-180" : ""}`} />
          </button>
          {periodOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-20">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setPeriodOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${p === period ? "text-indigo-600 font-medium bg-indigo-50" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 w-10">#</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Product</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Category</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Qty</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Revenue</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 text-slate-400 text-xs">{p.id}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <img src={p.image} alt="" className="size-6 rounded-full object-cover ring-1 ring-slate-200" />
                  <span className="font-medium text-slate-800 text-xs leading-tight">{p.name}</span>
                </div>
              </td>
              <td className="px-3 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[p.category] ?? "bg-slate-100 text-slate-600"}`}>
                  {p.category}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-700 font-medium text-xs">{p.quantity}</td>
              <td className="px-3 py-3 text-emerald-600 font-semibold text-xs">{p.revenue}</td>
              <td className="px-4 py-3">
                <button onClick={() => setSelected(p)} className="p-1 rounded hover:bg-slate-100 transition-colors" aria-label={`View ${p.name}`}>
                  <Eye className="size-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Product detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="size-4 text-slate-400" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <img src={selected.image} alt="" className="size-12 rounded-full object-cover ring-1 ring-slate-200" />
              <div>
                <h3 className="text-base font-semibold text-slate-900 leading-tight">{selected.name}</h3>
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[selected.category] ?? "bg-slate-100 text-slate-600"}`}>
                  {selected.category}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Quantity ordered" value={selected.quantity} />
              <Stat label="Revenue" value={selected.revenue} tone="text-emerald-600" />
              <Stat label="Period" value={period} />
              <Stat label="Rank" value={`#${selected.id}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${tone ?? "text-slate-800"}`}>{value}</p>
    </div>
  )
}
