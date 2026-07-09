import { Boxes, AlertTriangle, Truck, Activity } from "lucide-react"
import type { WarehouseDetail } from "@/types/dashboard"

export default function QuickStatsRow({ wh }: { wh: WarehouseDetail }) {
  const stats = [
    { label: "Total SKUs stored", value: wh.totalSkus.toLocaleString(), icon: Boxes,         tone: "bg-[#E5F0F5] text-[#1A6B8A] dark:bg-primary/20 dark:text-primary" },
    { label: "Low stock items",   value: String(wh.lowStockCount),      icon: AlertTriangle,  tone: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", alert: wh.lowStockCount > 0 },
    { label: "Pending inbound",   value: String(wh.pendingInbound),     icon: Truck,          tone: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" },
    { label: "Throughput (mo.)",  value: `${wh.throughput.toLocaleString()} u`, icon: Activity, tone: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${s.tone}`}>
            <s.icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-tight truncate">{s.label}</p>
            <p className={`text-lg font-bold leading-tight ${s.alert ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
