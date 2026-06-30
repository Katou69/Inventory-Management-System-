"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronDown } from "lucide-react"
import { inventoryData } from "@/data/dashboard-data"

const COLORS = { stockIn: "#f5b942", stockOut: "#9b51e0", stockValue: "#3b9eff" }
const NAMES = { stockIn: "Stock in", stockOut: "Stock Out", stockValue: "Stock value" }

function StripedBar({ x, y, width, height, capColor }: {
  x: number; y: number; width: number; height: number; capColor: string
}) {
  if (!height || height <= 0) return <g />
  const capH = 3
  const bodyH = Math.max(height - capH, 0)
  return (
    <g>
      <rect x={x} y={y + capH} width={width} height={bodyH} fill="url(#inv-stripes)" />
      <rect x={x} y={y} width={width} height={capH} fill={capColor} rx={1} />
    </g>
  )
}

const barShapes = {
  stockIn:    (props: any) => <StripedBar {...props} capColor={COLORS.stockIn} />,
  stockOut:   (props: any) => <StripedBar {...props} capColor={COLORS.stockOut} />,
  stockValue: (props: any) => <StripedBar {...props} capColor={COLORS.stockValue} />,
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const top = [...payload].sort((a: any, b: any) => b.value - a.value)[0]
  const color = COLORS[top.dataKey as keyof typeof COLORS]
  const name = NAMES[top.dataKey as keyof typeof NAMES]
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 min-w-[150px]">
      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
        <span className="size-2.5 rounded-full shrink-0" style={{ background: color }} />
        {name}
      </div>
      <p className="text-2xl font-bold text-slate-900">${top.value.toLocaleString()}</p>
    </div>
  )
}

export default function InventoryStatisticsChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h3 className="text-base font-semibold text-slate-900">Inventory Statistics</h3>
        <div className="flex items-center gap-4">
          {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map((key) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2 rounded-full inline-block" style={{ background: COLORS[key] }} />
              {NAMES[key]}
            </div>
          ))}
          <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors">
            Monthly <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={inventoryData} barSize={10} barGap={2} barCategoryGap="35%">
          <defs>
            <pattern id="inv-stripes" x="0" y="0" width="5" height="10" patternUnits="userSpaceOnUse">
              <line x1="1.5" y1="0" x2="1.5" y2="10" stroke="#cbd5e1" strokeWidth="1.5" />
            </pattern>
          </defs>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tickFormatter={(v) => v === 0 ? "0k" : `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} ticks={[0, 10000, 20000, 30000, 40000]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 158, 255, 0.06)" }} />
          <Bar dataKey="stockIn"    shape={barShapes.stockIn} />
          <Bar dataKey="stockOut"   shape={barShapes.stockOut} />
          <Bar dataKey="stockValue" shape={barShapes.stockValue} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}