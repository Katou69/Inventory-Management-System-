import type { WarehouseDetail, MovementType } from "@/types/dashboard"

const movementDot: Record<MovementType, string> = {
  "Inbound":      "bg-emerald-500",
  "Outbound":     "bg-red-500",
  "Transfer In":  "bg-sky-500",
  "Transfer Out": "bg-amber-500",
}

export default function StockMovementCard({ wh }: { wh: WarehouseDetail }) {
  const days = wh.dailyMovement
  const max  = Math.max(...days.flatMap((d) => [d.inbound, d.outbound]), 1)

  // mini chart geometry
  const H = 90
  const slotW = 44
  const barW = 8

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Stock Movement</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />In</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-red-400" />Out</span>
        </div>
      </div>

      {/* Mini bar chart */}
      <svg width="100%" height={H + 20} viewBox={`0 0 ${slotW * days.length} ${H + 20}`} className="mt-4">
        {days.map((d, i) => {
          const inH  = (d.inbound / max) * H
          const outH = (d.outbound / max) * H
          const cx   = i * slotW + slotW / 2
          return (
            <g key={d.day}>
              <rect x={cx - barW - 1} y={H - inH}  width={barW} height={inH}  rx={2} fill="#10b981" />
              <rect x={cx + 1}        y={H - outH} width={barW} height={outH} rx={2} fill="#f87171" />
              <text x={cx} y={H + 14} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{d.day}</text>
            </g>
          )
        })}
      </svg>

      {/* Recent list */}
      <div className="mt-4 pt-4 border-t border-border divide-y divide-border">
        {wh.movements.slice(0, 4).map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2.5">
            <span className={`size-2 rounded-full shrink-0 ${movementDot[m.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.item}</p>
              <p className="text-xs text-muted-foreground">{m.type} • {m.date}</p>
            </div>
            <span className={`text-sm font-bold shrink-0 ${m.qty >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
              {m.qty >= 0 ? "+" : ""}{m.qty} units
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
