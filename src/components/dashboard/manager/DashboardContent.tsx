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

export default async function ManagerDashboardContent() {
  const [
    warehouse,
    statusCards,
    inventory,
    salesOverview,
    products,
    activities,
  ] = await Promise.all([
    getWarehouseDetail(1),
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
            warehouseId={1}
            role="manager"
            viewerName="Mr Staff"
        />

      
      <div className="flex items-start justify-between gap-2 flex-wrap lg:flex-nowrap">
        <ProductTable initialProducts={products} />

        <ActivityFeed activities={activities} />
      </div>

    </div>
  );
}