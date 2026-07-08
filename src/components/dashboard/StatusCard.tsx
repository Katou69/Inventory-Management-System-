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
  stocks: "bg-[#E5F0F5] text-[#1A6B8A] dark:bg-primary/20 dark:text-primary",
  value: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  suppliers: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  revenue: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  lowStock: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  orders: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
}

export default function StatusCard({ card }: { card: StatusCardType }) {
  const Icon = iconMap[card.icon]
  const isUp = card.changeDirection === "up"
  const isAlert = card.icon === "lowStock"

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground leading-snug max-w-[160px]">
          {card.label}
        </p>
        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${iconColors[card.icon]}`}>
          <Icon className="size-4.5" />
        </div>
      </div>

      <p className="text-2xl font-bold text-foreground tracking-tight">
        {card.value}
      </p>

      <div className={`flex items-center gap-1 text-xs font-medium ${isAlert ? "text-amber-600 dark:text-amber-400" : isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
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
