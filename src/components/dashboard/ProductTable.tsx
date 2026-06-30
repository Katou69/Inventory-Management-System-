import { Eye, ChevronDown } from "lucide-react"
import { products } from "@/data/dashboard-data"

const categoryColors: Record<string, string> = {
  "Whisky": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Non-Whiskey": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
}

export default function ProductTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Top Ordered Products</h3>
          <p className="text-xs text-slate-400 mt-0.5">By revenue this month</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
          This month
          <ChevronDown className="size-3.5" />
        </button>
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
                <button className="p-1 rounded hover:bg-slate-100 transition-colors">
                  <Eye className="size-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
