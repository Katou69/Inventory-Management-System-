import { ProductTable } from "@/components/dashboard"

import WarehouseProfileCard from "@/components/warehouse/WarehouseProfileCard"
import ZoneLayoutCanvas from "@/components/warehouse/ZoneLayoutCanvas"

import StaffStats from "./StaffStats"

import {
  getWarehouseDetail,
  getTopProducts,
  getStaffStats,
} from "@/services/dashboard-service"
import { requireUser } from "@/lib/auth/require-user"

export default async function StaffDashboardContent() {
  const user = await requireUser()

  // Staff are scoped to one warehouse. This used to be a hardcoded `1`, so every
  // staff member saw Main Warehouse regardless of their actual assignment.
  const warehouseId = user.warehouseId === "all" ? 1 : user.warehouseId

  // No ActivityFeed: /activities is admin+manager only, and calling it here made
  // the whole staff dashboard throw a 403 out of the render tree.
  const [warehouse, products, stats] = await Promise.all([
    getWarehouseDetail(warehouseId),
    getTopProducts(),
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
        warehouseId={warehouseId}
        role="staff"
        viewerName={user.name}
      />

      <WarehouseProfileCard
        wh={warehouse}
      />

      <ProductTable
        initialProducts={products}
      />
    </div>
  )
}
