import { MoreVertical } from "lucide-react"

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
  return (
    <div className="bg-white rounded-2xl p-6 w-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">
          Sales Overview
        </h3>
        <button className="text-gray-300 hover:text-gray-500">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        <div className="bg-gray-50 rounded-xl p-8 h-[250px] flex items-center justify-center border border-gray-200 w-full">
          <img src="/images/ellipse-6.png" alt="Gauge placeholder" className="max-w-full max-h-full opacity-50" />
          <div className="absolute text-center text-gray-400">
            <p className="font-medium">Chart Placeholder</p>
            <p className="text-sm">Sales Gauge Chart</p>
            <p className="text-xs mt-1">(recharts implementation pending)</p>
            <div className="mt-4 text-3xl font-bold text-gray-900">{percent}%</div>
            <div className="text-sm text-gray-400 mt-1">Sales Goal</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <div>
          <div className="text-sm text-gray-400 mb-1">Number of sales</div>
          <div className="font-semibold text-gray-900">
            {numberOfSales.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-1">Total Sales</div>
          <div className="font-semibold text-gray-900">
            ${totalSales.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}