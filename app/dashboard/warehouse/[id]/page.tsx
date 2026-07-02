import { notFound } from "next/navigation"
import { getWarehouseDetail, getWarehouses } from "@/services/dashboard-service"
import WarehouseHeader from "@/components/warehouse/WarehouseHeader"
import WarehouseProfileCard from "@/components/warehouse/WarehouseProfileCard"
import QuickStatsRow from "@/components/warehouse/QuickStatsRow"
import CapacityCard from "@/components/warehouse/CapacityCard"
import StockMovementCard from "@/components/warehouse/StockMovementCard"
import WarehouseProductsTable from "@/components/warehouse/WarehouseProductsTable"
import WarehouseActivitiesCard from "@/components/warehouse/WarehouseActivitiesCard"

export async function generateStaticParams() {
  const warehouses = await getWarehouses()
  return warehouses.map((w) => ({ id: String(w.id) }))
}

export default async function WarehouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const wh = await getWarehouseDetail(Number(id))
  if (!wh) notFound()

  return (
    <div className="flex flex-col gap-6">
      <WarehouseHeader name={wh.name} />
      <WarehouseProfileCard wh={wh} />
      <QuickStatsRow wh={wh} />
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <CapacityCard wh={wh} />
        <StockMovementCard wh={wh} />
      </div>
      <WarehouseProductsTable wh={wh} />
      <WarehouseActivitiesCard activities={wh.activities} warehouseName={wh.name} />
    </div>
  )
}
