import {
  StatusCardGrid,
  ChartsSection,
  WarehouseTable,
  ProductTable,
  ActivityFeed,
} from "@/components/dashboard"
import {
  getStatusCards,
  getInventoryStatistics,
  getSalesOverview,
  getWarehouses,
  getTopProducts,
  getRecentActivities,
} from "@/services/dashboard-service"

export default async function DashboardPage() {
  const [statusCards, inventory, salesOverview, warehouses, products, activities] = await Promise.all([
    getStatusCards(),
    getInventoryStatistics(),
    getSalesOverview(),
    getWarehouses(),
    getTopProducts(),
    getRecentActivities(),
  ])

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your inventory and sales</p>
        </div>
      </div>
      <StatusCardGrid cards={statusCards} />
      <ChartsSection inventory={inventory} salesOverview={salesOverview} />
      <WarehouseTable initialWarehouses={warehouses} />
      <div className="flex items-start justify-between gap-2 flex-wrap lg:flex-nowrap">
        <ProductTable initialProducts={products} />
        <ActivityFeed activities={activities} />
      </div>
    </div>
  )
}
