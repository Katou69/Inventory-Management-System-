import type { WarehouseDetail } from "@/types/dashboard"

export default function CapacityCard({ wh }: { wh: WarehouseDetail }) {
  const used  = wh.capacityUsed
  const total = wh.capacityTotal

  // A warehouse with no capacity recorded (total = 0) made pct Infinity — the
  // card literally rendered "Infinity%" and a negative free count. And a warehouse
  // over capacity (>100%) drew a donut arc past full circumference.
  const hasCapacity = total > 0
  const pct  = hasCapacity ? (used / total) * 100 : null
  const free = Math.max(0, total - used)
  const over = pct !== null && pct > 100

  // Donut geometry — the arc only ever fills 0..100% of the circle.
  const size = 180
  const stroke = 24
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const fill = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  const usedDash = (fill / 100) * c

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex-1 min-w-0 flex flex-col">
      <h3 className="text-base font-semibold text-foreground">Capacity Overview</h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        {wh.name} • {hasCapacity ? `Total ${total.toLocaleString()} units` : "No capacity recorded"}
      </p>

      <div className="flex flex-1 items-center justify-center gap-8 mt-5 flex-wrap">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-accent" strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={over ? "#ef4444" : "#4f46e5"} strokeWidth={stroke}
              strokeDasharray={`${usedDash} ${c}`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-2xl font-bold leading-none ${over ? "text-red-500" : "text-foreground"}`}>
              {pct === null ? "—" : `${pct.toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{over ? "Over capacity" : "Used"}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <LegendItem color={over ? "#ef4444" : "#4f46e5"} label="Used" pct={pct} units={used} />
          <LegendItem color="#cbd5e1" label="Free" pct={pct === null ? null : Math.max(0, 100 - pct)} units={free} />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, pct, units }: { color: string; label: string; pct: number | null; units: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-3 rounded-sm shrink-0" style={{ background: color }} />
      <div>
        <p className="text-sm font-medium text-foreground">
          {label}{pct === null ? "" : ` — ${pct.toFixed(1)}%`}
        </p>
        <p className="text-xs text-muted-foreground">{units.toLocaleString()} units</p>
      </div>
    </div>
  )
}
