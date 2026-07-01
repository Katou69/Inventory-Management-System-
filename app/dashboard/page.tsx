import { 
  Header,
  StatusCardGrid, 
  ChartsSection, 
  WarehouseTable, 
  ProductTable, 
  ActivityFeed 
} from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-[30px]">
      <StatusCardGrid />
      <ChartsSection />
      <WarehouseTable />
      <div className="flex items-start justify-between gap-2 flex-wrap lg:flex-nowrap">
        <ProductTable />
        <ActivityFeed />
      </div>
    </div>
  )
}