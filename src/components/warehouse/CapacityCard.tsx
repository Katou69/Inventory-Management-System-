import type { WarehouseDetail } from "@/types/dashboard"

export default function CapacityCard({ wh }: { wh: WarehouseDetail }) {
  const used  = wh.capacityUsed
  const total = wh.capacityTotal
  const free  = total - used
  const pct   = (used / total) * 100

  // Donut geometry
  const size = 180
  const stroke = 24
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const usedDash = (pct / 100) * c

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 min-w-0 flex flex-col">
      <h3 className="text-base font-semibold text-slate-900">Capacity Overview</h3>
      <p className="text-xs text-slate-400 mt-0.5">{wh.name} • Total {total.toLocaleString()} units</p>

      <div className="flex flex-1 items-center justify-center gap-8 mt-5 flex-wrap">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke="#4f46e5" strokeWidth={stroke}
              strokeDasharray={`${usedDash} ${c}`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-slate-900 leading-none">{pct.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 mt-1">Used</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <LegendItem color="#4f46e5" label="Used"  pct={pct}       units={used} />
          <LegendItem color="#cbd5e1" label="Free"  pct={100 - pct} units={free} />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, pct, units }: { color: string; label: string; pct: number; units: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-3 rounded-sm shrink-0" style={{ background: color }} />
      <div>
        <p className="text-sm font-medium text-slate-800">{label} — {pct.toFixed(1)}%</p>
        <p className="text-xs text-slate-400">{units.toLocaleString()} units</p>
      </div>
    </div>
  )
}
