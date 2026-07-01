import type { WarehouseDetail } from "@/types/dashboard"
import { productStatusStyle } from "./statusStyles"

const categoryColors: Record<string, string> = {
  "Whisky":      "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Non-Whiskey": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
}

export default function WarehouseProductsTable({ wh }: { wh: WarehouseDetail }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Products in this Warehouse</h3>
          <p className="text-xs text-slate-400 mt-0.5">{wh.products.length} SKUs stored</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">SKU</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Product</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Category</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Quantity</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {wh.products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                    {p.sku}
                  </span>
                </td>
                <td className="px-3 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[p.category] ?? "bg-slate-100 text-slate-600"}`}>
                    {p.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-slate-700">{p.quantity.toLocaleString()}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${productStatusStyle[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">{p.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
