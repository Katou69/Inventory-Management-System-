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
          <h1 className="text-3xl font-bold">
            Inventory
          </h1>

          <p className="text-muted-foreground">
            Manage and track all your stock items
          </p>

        </div>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Add Item
        </button>

      </div>
      <StatsCards />
      <Filters />
      <InventoryTable />
    </div>
  );
}
