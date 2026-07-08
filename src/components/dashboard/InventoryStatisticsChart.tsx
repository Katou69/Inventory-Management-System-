"use client"
import { useState } from "react"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Customized,
} from "recharts"
import type { InventoryPeriod, InventoryDataPoint } from "@/types/dashboard"

const PERIODS: { key: InventoryPeriod; label: string }[] = [
  { key: "days",   label: "Days"   },
  { key: "months", label: "Months" },
  { key: "years",  label: "Years"  },
]

// Minimal local shapes for the Recharts render-prop payloads we read.
// Recharts 3's own render-prop types are intentionally loose; typing against
// just the fields we use avoids `any` without coupling to library internals.
type GradientBarProps = { x?: number; y?: number; width?: number; height?: number; color: string }
type TooltipDatum = { dataKey?: string | number; value?: number }
type TooltipProps = { active?: boolean; payload?: TooltipDatum[]; label?: string | number }
type AxisView = {
  y?: number
  width?: number
  height?: number
  niceTicks?: unknown
  domain?: unknown
  scale?: ((v: number) => number) & { bandwidth?: () => number; domain?: () => number[] }
}
type CustomizedAxisProps = { xAxisMap?: Record<string, AxisView>; yAxisMap?: Record<string, AxisView> }

function GradientBar(props: GradientBarProps) {
  const { width, height, color } = props
  if (!height || height <= 0 || !width) return null
  const x = props.x ?? 0
  const y = props.y ?? 0
  const capH  = 5
  const bodyH = Math.max(height - capH, 0)
  const id    = `grad-${color.replace("#", "")}`
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <rect x={x} y={y + capH} width={width} height={bodyH} fill={`url(#${id})`} />
      <rect x={x} y={y} width={width} height={capH} rx={2.5} fill={color} />
    </g>
  )
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const stockIn    = payload.find((p: TooltipDatum) => p.dataKey === "stockIn")?.value ?? 0
  const stockOut   = payload.find((p: TooltipDatum) => p.dataKey === "stockOut")?.value ?? 0
  const stockValue = payload.find((p: TooltipDatum) => p.dataKey === "stockValue")?.value ?? 0
  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `$${(v / 1_000).toFixed(0)}k`
    : `$${v}`
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 min-w-[160px]">
      <p className="text-xs font-bold text-slate-800 mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm shrink-0" style={{ background: "#f59e0b" }} />
            <span className="text-xs text-slate-500">Stock In</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">{fmt(stockIn)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm shrink-0" style={{ background: "#8b5cf6" }} />
            <span className="text-xs text-slate-500">Stock Out</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">{fmt(stockOut)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border-2 border-[#3b9eff] bg-white shrink-0" />
            <span className="text-xs text-slate-500">Stock Value</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">{fmt(stockValue)}</span>
        </div>
      </div>
    </div>
  )
}

function AlternatingBackground({ xAxisMap, yAxisMap }: CustomizedAxisProps) {
  const xAxis = xAxisMap ? (Object.values(xAxisMap)[0] as AxisView | undefined) : undefined
  const yAxis = yAxisMap ? (Object.values(yAxisMap)[0] as AxisView | undefined) : undefined
  if (!xAxis?.niceTicks && !xAxis?.domain) return null
  const { y, height, scale } = xAxis
  const width = xAxis.width ?? 0
  if (!scale) return null
  const bandWidth = scale.bandwidth ? scale.bandwidth() : 0
  const slots: number[] = scale.domain ? scale.domain() : []
  return (
    <g>
      {slots.map((slot: number, i: number) => {
        if (i % 2 !== 0) return null
        const sx = scale(slot)
        return (
          <rect
            key={i}
            x={sx - (bandWidth > 0 ? 0 : bandWidth / 2)}
            y={yAxis?.y ?? y}
            width={bandWidth || width / slots.length}
            height={yAxis?.height ?? height}
            fill="#f8fafc"
          />
        )
      })}
    </g>
  )
}

function yTickFormatter(v: number) {
  if (v === 0) return "0"
  if (v >= 1_000_000) return `${v / 1_000_000}M`
  if (v >= 1_000)     return `${v / 1_000}k`
  return String(v)
}

function niceStep(rawStep: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const fraction  = rawStep / magnitude
  const nice      = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return nice * magnitude
}

function buildTicks(data: InventoryDataPoint[]) {
  const max  = Math.max(...data.map(d => Math.max(d.stockIn, d.stockOut, d.stockValue)))
  const step = niceStep(max / 4)
  const top  = Math.ceil(max / step) * step
  return [0, top / 4, top / 2, (top * 3) / 4, top]
}

export default function InventoryStatisticsChart({
  data: dataByPeriod,
}: {
  data: Record<InventoryPeriod, InventoryDataPoint[]>
}) {
  const [period, setPeriod] = useState<InventoryPeriod>("months")
  const data  = dataByPeriod[period]
  const ticks = buildTicks(data)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h3 className="text-base font-semibold text-slate-900">Inventory Statistics</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2 rounded-full inline-block bg-[#f59e0b]" />
              Stock In
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2 rounded-full inline-block bg-[#8b5cf6]" />
              Stock Out
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg width="16" height="8" className="shrink-0">
                <line x1="0" y1="4" x2="16" y2="4" stroke="#3b9eff" strokeWidth="2" strokeDasharray="4,2" />
              </svg>
              <span className="size-2 rounded-full border-2 border-[#3b9eff] bg-white inline-block" />
              Stock Value
            </div>
          </div>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`text-xs px-3 py-1.5 transition-colors ${
                  period === key
                    ? "bg-[#1A6B8A] text-white font-medium"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={data}
          barSize={8}
          barGap={3}
          barCategoryGap="20%"
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <Customized component={AlternatingBackground} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <YAxis
            tickFormatter={yTickFormatter}
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(99,102,241,0.06)", rx: 4 }}
          />
          <Bar
            dataKey="stockIn"
            shape={(props) => <GradientBar {...(props as GradientBarProps)} color="#f59e0b" />}
          />
          <Bar
            dataKey="stockOut"
            shape={(props) => <GradientBar {...(props as GradientBarProps)} color="#8b5cf6" />}
          />
          <Line
            dataKey="stockValue"
            type="monotone"
            stroke="#3b9eff"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3.5, fill: "white", stroke: "#3b9eff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "white", stroke: "#3b9eff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
