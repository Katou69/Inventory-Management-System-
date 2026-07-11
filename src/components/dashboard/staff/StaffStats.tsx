import type { StaffStat } from "@/types/dashboard"

const cardColors = {
  blue: "border-sky-200 bg-sky-50",
  green: "border-lime-200 bg-lime-50",
  amber: "border-violet-200 bg-violet-50",
  red: "border-orange-200 bg-orange-50",
}

export default function StaffStats({
  stats,
}: {
  stats: StaffStat[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`rounded-xl border p-5 shadow-sm ${cardColors[stat.color]}`}
        >
          <p className="text-sm font-medium text-slate-600">
            {stat.title}
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            {stat.value}
          </h2>

          <p className="text-xs text-slate-500 mt-3">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  )
}