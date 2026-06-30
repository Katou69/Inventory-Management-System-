import { MoreVertical, TrendingUp } from "lucide-react"

interface SalesGaugeProps {
  percent?: number
  numberOfSales?: number
  totalSales?: number
}

export default function SalesGauge({
  percent = 71.3,
  numberOfSales = 1233,
  totalSales = 15233,
}: SalesGaugeProps) {
  const radius = 70
  const circumference = Math.PI * radius
  const progress = (percent / 100) * circumference

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Sales Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Monthly goal progress</p>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <MoreVertical className="size-4 text-slate-400" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className="relative">
          <svg width="180" height="100" viewBox="0 0 180 100">
            {/* Background arc */}
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(percent / 100) * 251.2} 251.2`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <p className="text-3xl font-bold text-slate-900">{percent}%</p>
            <p className="text-xs text-slate-400">of monthly goal</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-emerald-600 text-xs font-medium">
          <TrendingUp className="size-3.5" />
          On track for this month
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Number of Sales</p>
          <p className="text-lg font-bold text-slate-900">{numberOfSales.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Total Sales</p>
          <p className="text-lg font-bold text-slate-900">${totalSales.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
