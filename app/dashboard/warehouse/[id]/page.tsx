import { notFound } from "next/navigation"
import { getWarehouseDetail } from "@/services/dashboard-service"
import WarehouseProfileSection from "@/components/warehouse/WarehouseProfileSection"
import QuickStatsRow from "@/components/warehouse/QuickStatsRow"
import CapacityCard from "@/components/warehouse/CapacityCard"
import StockMovementCard from "@/components/warehouse/StockMovementCard"
import WarehouseProductsTable from "@/components/warehouse/WarehouseProductsTable"
import WarehouseActivitiesCard from "@/components/warehouse/WarehouseActivitiesCard"
import ZoneLayoutCanvas from "@/components/warehouse/ZoneLayoutCanvas"
import { requireUser } from "@/lib/auth/require-user"

// Rendered per-request, not prebuilt: the warehouse list lives behind the
// auth cookie, so a build-time fetch has no session and 401s.
export const dynamic = "force-dynamic"

export default async function WarehouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, wh] = await Promise.all([
    requireUser(),
    getWarehouseDetail(Number(id)),
  ])
  if (!wh) notFound()

  return (
    <div className="flex flex-col gap-6">
      <WarehouseProfileSection wh={wh} />
      <QuickStatsRow wh={wh} />
      {/* The role comes from the session, same as the manager/staff dashboards.
          This used to render a ZoneLayoutSection wrapper whose only job was a
          demo role switcher -- three buttons letting anyone grant themselves
          admin edit tools. It predated auth ("once auth lands, delete the
          switcher"); auth landed. */}
      <ZoneLayoutCanvas warehouseId={wh.id} role={user.role} viewerName={user.name} />
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <CapacityCard wh={wh} />
        <StockMovementCard wh={wh} />
      </div>
      <WarehouseProductsTable wh={wh} />
      <WarehouseActivitiesCard activities={wh.activities} warehouseName={wh.name} />
    </div>
  )
}
