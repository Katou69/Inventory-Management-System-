export default function InventoryStatisticsChart() {
  return (
    <div className="bg-white rounded-2xl p-6 w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h3 className="text-base font-semibold text-gray-900">
          Inventory Statistics
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#f5b942]" />
            Stock in
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#9b51e0]" />
            Stock out
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#3b9eff]" />
            Stock value
          </div>
          <button className="flex items-center gap-1 text-sm text-gray-400 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50">
            Monthly
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 h-[350px] flex items-center justify-center border border-gray-200 relative">
        <img src="/images/ellipse-2.png" alt="Chart placeholder" className="max-w-full max-h-full opacity-50" />
        <span className="absolute text-gray-400 text-sm">Inventory Statistics Chart</span>
      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m) => (
          <span key={m} className="flex-1 text-center">
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}