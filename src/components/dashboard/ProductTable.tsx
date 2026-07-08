"use client"
import Image from "next/image"
import { useState } from "react"
import { Eye, ChevronDown, X } from "lucide-react"
import type { Product } from "@/types/dashboard"

const categoryColors: Record<string, string> = {
  "Whisky": "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800",
  "Non-Whiskey": "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:ring-sky-800",
}

const PERIODS = ["This week", "This month", "This quarter", "This year"]

export default function ProductTable({ initialProducts }: { initialProducts: Product[] }) {
  const products = initialProducts
  const [period, setPeriod] = useState("This month")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex-1 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Top Ordered Products</h3>
          <p className="text-xs text-muted-foreground mt-0.5">By revenue · {period.toLowerCase()}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setPeriodOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors"
          >
            {period}
            <ChevronDown className={`size-3.5 transition-transform ${periodOpen ? "rotate-180" : ""}`} />
          </button>
          {periodOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg border border-border shadow-lg py-1 z-20">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setPeriodOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${p === period ? "text-primary font-medium bg-[#E5F0F5] dark:bg-primary/20" : "text-muted-foreground hover:bg-accent"}`}
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
          <tr className="bg-accent border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3 w-10">#</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Product</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Category</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Qty</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Revenue</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-accent transition-colors">
              <td className="px-5 py-3 text-muted-foreground text-xs">{p.id}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <Image src={p.image} alt="" width={24} height={24} className="size-6 rounded-full object-cover ring-1 ring-border" />
                  <span className="font-medium text-foreground text-xs leading-tight">{p.name}</span>
                </div>
              </td>
              <td className="px-3 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[p.category] ?? "bg-accent text-muted-foreground"}`}>
                  {p.category}
                </span>
              </td>
              <td className="px-3 py-3 text-muted-foreground font-medium text-xs">{p.quantity}</td>
              <td className="px-3 py-3 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">{p.revenue}</td>
              <td className="px-4 py-3">
                <button onClick={() => setSelected(p)} className="p-1 rounded hover:bg-accent transition-colors" aria-label={`View ${p.name}`}>
                  <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
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
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-accent transition-colors">
              <X className="size-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <Image src={selected.image} alt="" width={48} height={48} className="size-12 rounded-full object-cover ring-1 ring-border" />
              <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">{selected.name}</h3>
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[selected.category] ?? "bg-accent text-muted-foreground"}`}>
                  {selected.category}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Quantity ordered" value={selected.quantity} />
              <Stat label="Revenue" value={selected.revenue} tone="text-emerald-600 dark:text-emerald-400" />
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
    <div className="bg-accent rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-semibold ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  )
}
