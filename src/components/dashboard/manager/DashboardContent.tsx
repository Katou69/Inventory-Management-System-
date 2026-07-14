import {
  StatusCardGrid,
  ChartsSection,
  ProductTable,
  ActivityFeed,
} from "@/components/dashboard";

import {
  getStatusCards,
  getInventoryStatistics,
  getSalesOverview,
  getTopProducts,
  getRecentActivities,
  getWarehouseDetail,
} from "@/services/dashboard-service";
import WarehouseProfileCard from "@/components/warehouse/WarehouseProfileCard"
import ZoneLayoutCanvas from "@/components/warehouse/ZoneLayoutCanvas"
import { requireUser } from "@/lib/auth/require-user"

export default async function ManagerDashboardContent() {
  const user = await requireUser();

  // Was hardcoded to warehouse 1, so a manager of North Depot saw Main Warehouse.
  const warehouseId = user.warehouseId === "all" ? 1 : user.warehouseId;

  const [
    warehouse,
    statusCards,
    inventory,
    salesOverview,
    products,
    activities,
  ] = await Promise.all([
    getWarehouseDetail(warehouseId),
    getStatusCards(),
    getInventoryStatistics(),
    getSalesOverview(),
    getTopProducts(),
    getRecentActivities(),
  ]);

  if (!warehouse) {
    return (
      <p className="text-red-500">
        Warehouse not found.
      </p>
    )
  }



  return (
    
    <div className="flex flex-col gap-[30px]">
      <StatusCardGrid cards={statusCards} />
      
      <ChartsSection
        inventory={inventory}
        salesOverview={salesOverview}
      />
      <WarehouseProfileCard 
        wh={warehouse} 
      />

      <ZoneLayoutCanvas
            warehouseId={warehouseId}
            role="manager"
            viewerName={user.name}
        />

      
      <div className="flex items-start justify-between gap-2 flex-wrap lg:flex-nowrap">
        <ProductTable initialProducts={products} />

        <ActivityFeed activities={activities} />
      </div>

    </div>
  );
}