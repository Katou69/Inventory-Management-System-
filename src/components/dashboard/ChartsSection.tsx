"use client"
import dynamic from "next/dynamic"
import SalesGauge from "./SalesGauge"

const InventoryStatisticsChart = dynamic(
  () => import("./InventoryStatisticsChart"),
  { ssr: false }
)

export default function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 w-full">
      <InventoryStatisticsChart />
      <SalesGauge />
    </div>
  )
}