import {
  ActivityFeed,
  ProductTable,
} from "@/components/dashboard"

import WarehouseProfileCard from "@/components/warehouse/WarehouseProfileCard"
import ZoneLayoutCanvas from "@/components/warehouse/ZoneLayoutCanvas"

import StaffStats from "./StaffStats"

import {
  getWarehouseDetail,
  getTopProducts,
  getRecentActivities,
  getStaffStats,
} from "@/services/dashboard-service"

export default async function StaffDashboardContent() {
  const [
    warehouse,
    products,
    activities,
    stats,
  ] = await Promise.all([
    getWarehouseDetail(1),
    getTopProducts(),
    getRecentActivities(),
    getStaffStats(),
  ])

  if (!warehouse) {
    return (
      <p className="text-red-500">
        Warehouse not found.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <h1 className="text-2xl font-bold">
          Staff Dashboard
        </h1>

        <p className="text-muted-foreground mt-1">
          Overview of your assigned warehouse
        </p>
      </div>

      <StaffStats stats={stats} />

      <ZoneLayoutCanvas
        warehouseId={1}
        role="staff"
        viewerName="Mr Staff"
        />

      <WarehouseProfileCard
        wh={warehouse}
      />

      <div className="flex items-start justify-between gap-2 flex-wrap lg:flex-nowrap">
        <ProductTable
          initialProducts={products}
        />

        <ActivityFeed
          activities={activities}
        />
      </div>
    </div>
  )
}