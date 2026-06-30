import { Package, DollarSign, Truck, TrendingUp, AlertTriangle, ClipboardCheck, TrendingDown } from "lucide-react"
import type { StatusCard as StatusCardType } from "@/types/dashboard"

const iconMap = {
  stocks: Package,
  value: DollarSign,
  suppliers: Truck,
  revenue: TrendingUp,
  lowStock: AlertTriangle,
  orders: ClipboardCheck,
}

const iconColors: Record<string, string> = {
  stocks: "bg-indigo-100 text-indigo-600",
  value: "bg-emerald-100 text-emerald-600",
  suppliers: "bg-sky-100 text-sky-600",
  revenue: "bg-violet-100 text-violet-600",
  lowStock: "bg-amber-100 text-amber-600",
  orders: "bg-teal-100 text-teal-600",
}

export default function StatusCard({ card }: { card: StatusCardType }) {
  const Icon = iconMap[card.icon]
  const isUp = card.changeDirection === "up"
  const isAlert = card.icon === "lowStock"

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 leading-snug max-w-[160px]">
          {card.label}
        </p>
        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${iconColors[card.icon]}`}>
          <Icon className="size-4.5" />
        </div>
      </div>

      <p className="text-2xl font-bold text-slate-900 tracking-tight">
        {card.value}
      </p>

      <div className={`flex items-center gap-1 text-xs font-medium ${isAlert ? "text-amber-600" : isUp ? "text-emerald-600" : "text-red-500"}`}>
        {isAlert ? (
          <AlertTriangle className="size-3.5" />
        ) : isUp ? (
          <TrendingUp className="size-3.5" />
        ) : (
          <TrendingDown className="size-3.5" />
        )}
        <span>{card.changeText}</span>
      </div>
    </div>
  )
}
