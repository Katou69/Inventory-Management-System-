import { ClipboardCheck, Truck, AlertTriangle, ArrowLeftRight } from "lucide-react"
import type { StaffStat } from "@/types/dashboard"

// Same recipe as StatusCard: the card body stays neutral (bg-card/border-border,
// which flip themselves via the theme tokens) and the colour lives in the icon
// chip as an explicit light/dark pair. This component predated the dark theme
// and tinted the whole card instead, which left it unreadable in dark mode.
//
// The keys are the backend's StatColor literal ("blue" | "green" | "amber" |
// "red") -- they name the API's slot, not the hue. The hues follow the stat's
// MEANING, matching QuickStatsRow, which shows these same four figures:
// low stock is amber there, throughput is teal, inbound is sky.
const statStyles: Record<StaffStat["color"], { chip: string; icon: React.ElementType }> = {
  blue:  { chip: "bg-[#E5F0F5] text-[#1A6B8A] dark:bg-primary/20 dark:text-primary", icon: ClipboardCheck },   // Orders Pending
  green: { chip: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400", icon: Truck },                // Purchase Deliveries (inbound)
  amber: { chip: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle }, // Low Stock Alerts
  red:   { chip: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400", icon: ArrowLeftRight },    // Today's Movements (throughput)
}

export default function StaffStats({
  stats,
}: {
  stats: StaffStat[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((stat) => {
        const { chip, icon: Icon } = statStyles[stat.color]
        return (
          <div
            key={stat.id}
            className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground leading-snug">
                {stat.title}
              </p>
              <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${chip}`}>
                <Icon className="size-4.5" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-foreground tracking-tight mt-2">
              {stat.value}
            </h2>

            <p className="text-xs text-muted-foreground mt-3">
              {stat.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
