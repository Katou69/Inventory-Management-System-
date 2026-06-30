import InventoryStatisticsChart from "./InventoryStatisticsChart"
import SalesGauge from "./SalesGauge"

export default function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 w-full">
      <InventoryStatisticsChart />
      <SalesGauge />
    </div>
  )
}