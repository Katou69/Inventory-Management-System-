import {
  StatsCards,
  Filters,
  InventoryTable,
} from "@/components/inventory";

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Inventory
          </h1>

          <p className="text-muted-foreground">
            Manage and track all your stock items
          </p>

        </div>


      </div>
      <StatsCards />
      <InventoryTable />
    </div>
  );
}
