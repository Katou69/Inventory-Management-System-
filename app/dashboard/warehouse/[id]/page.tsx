import { notFound } from "next/navigation"
import { getWarehouseDetail } from "@/services/dashboard-service"
import WarehouseProfileSection from "@/components/warehouse/WarehouseProfileSection"
import QuickStatsRow from "@/components/warehouse/QuickStatsRow"
import CapacityCard from "@/components/warehouse/CapacityCard"
import StockMovementCard from "@/components/warehouse/StockMovementCard"
import WarehouseProductsTable from "@/components/warehouse/WarehouseProductsTable"
import WarehouseActivitiesCard from "@/components/warehouse/WarehouseActivitiesCard"
import ZoneLayoutSection from "@/components/warehouse/ZoneLayoutSection"

// Rendered per-request, not prebuilt: the warehouse list lives behind the
// auth cookie, so a build-time fetch has no session and 401s.
export const dynamic = "force-dynamic"

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
      <WarehouseProfileSection wh={wh} />
      <QuickStatsRow wh={wh} />
      <ZoneLayoutSection warehouseId={wh.id} />
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <CapacityCard wh={wh} />
        <StockMovementCard wh={wh} />
      </div>
      <WarehouseProductsTable wh={wh} />
      <WarehouseActivitiesCard activities={wh.activities} warehouseName={wh.name} />
    </div>
  )
}
