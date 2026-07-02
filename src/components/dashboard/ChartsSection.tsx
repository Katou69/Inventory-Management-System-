"use client"
import dynamic from "next/dynamic"
import SalesGauge from "./SalesGauge"
import type { InventoryDataPoint, InventoryPeriod, SalesOverview } from "@/types/dashboard"

const InventoryStatisticsChart = dynamic(
  () => import("./InventoryStatisticsChart"),
  { ssr: false }
)

export default function ChartsSection({
  inventory,
  salesOverview,
}: {
  inventory: Record<InventoryPeriod, InventoryDataPoint[]>
  salesOverview: SalesOverview
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 w-full">
      <InventoryStatisticsChart data={inventory} />
      <SalesGauge
        numberOfSales={salesOverview.numberOfSales}
        totalSales={salesOverview.totalSales}
        defaultTarget={salesOverview.target}
      />
    </div>
  )
}
