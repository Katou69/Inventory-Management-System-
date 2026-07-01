import { MoreVertical, TrendingUp } from "lucide-react"

interface SalesGaugeProps {
  percent?: number
  numberOfSales?: number
  totalSales?: number
}

const W       = 220
const H       = 130
const CX      = 110   // centre x
const CY      = 118   // centre y — sits near bottom so arc arches above
const R_INNER = 52    // inner ring radius
const R_OUTER = 100   // outer ring radius
const N_LINES = 120   // number of radial spokes

function getCenterColor(percent: number): string {
  const t = percent / 100
  const r = Math.round(191 - t * 162)
  const g = Math.round(219 - t * 141)
  const b = Math.round(254 - t * 38)
  return `rgb(${r},${g},${b})`
}

function buildSpokes(percent: number) {
  const spokes = []
  for (let i = 0; i < N_LINES; i++) {
    // t: 0 = leftmost (180°), 1 = rightmost (0°)
    const t     = i / (N_LINES - 1)
    const angle = Math.PI - t * Math.PI          // π → 0 (left to right)
    const cos   = Math.cos(angle)
    const sin   = Math.sin(angle)
    const x1 = CX + R_INNER * cos
    const y1 = CY - R_INNER * sin
    const x2 = CX + R_OUTER * cos
    const y2 = CY - R_OUTER * sin
    const filled = t <= percent / 100
    // Blue intensity: richer blue at centre of arc (t≈0.5), lighter at edges
    spokes.push({ x1, y1, x2, y2, filled, t })
  }
  return spokes
}

export default function SalesGauge({
  percent = 71.3,
  numberOfSales = 1233,
  totalSales = 15233,
}: SalesGaugeProps) {
  const spokes = buildSpokes(percent)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Sales Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Monthly goal progress</p>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <MoreVertical className="size-4 text-slate-400" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 py-2">
        <div className="relative w-full">
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Symmetric gradient: richer blue at centre, lighter at edges */}
              <linearGradient id="spokeGrad" gradientUnits="userSpaceOnUse"
                x1={CX - R_OUTER} y1="0" x2={CX + R_OUTER} y2="0">
                <stop offset="0%"   stopColor="#bfdbfe" />
                <stop offset="50%"  stopColor={getCenterColor(percent)} />
                <stop offset="100%" stopColor="#bfdbfe" />
              </linearGradient>
              {/* Clip to only show the filled (blue) spokes */}
              <clipPath id="filledClip">
                <rect x="0" y="0" width={CX + R_OUTER * Math.cos(Math.PI - (percent / 100) * Math.PI) + 2} height={H} />
              </clipPath>
            </defs>

            {/* Render all spokes grey first */}
            {spokes.map((s, i) => (
              <line
                key={i}
                x1={s.x1} y1={s.y1}
                x2={s.x2} y2={s.y2}
                stroke="#e2e8f0"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            ))}

            {/* Render filled spokes on top with gradient colour */}
            {spokes.filter(s => s.filled).map((s, i) => (
              <line
                key={i}
                x1={s.x1} y1={s.y1}
                x2={s.x2} y2={s.y2}
                stroke="url(#spokeGrad)"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Centred label */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <p className="text-3xl font-bold text-slate-900 leading-none">{percent}%</p>
            <p className="text-xs text-slate-400 mt-1">Sales Goal</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1 text-emerald-600 text-xs font-medium">
          <TrendingUp className="size-3.5" />
          On track for this month
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400 mb-1">Number of sales</p>
          <p className="text-lg font-bold text-slate-900">{numberOfSales.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-1">Total Sales</p>
          <p className="text-lg font-bold text-slate-900">${totalSales.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
