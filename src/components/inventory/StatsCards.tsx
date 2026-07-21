import { Package, AlertTriangle, CircleX } from "lucide-react";
import { getInventoryStats } from "@/services/inventory-service";

type Props = {
  warehouseId: number;
};

export default async function StatsCards({ warehouseId }: Props) {
  const stats = await getInventoryStats(warehouseId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Package className="text-blue-600 dark:text-blue-400 w-6 h-6" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Total Items</p>
          <h2 className="text-3xl font-bold text-foreground">{stats.totalItems}</h2>
        </div>
      </div>

      {/* Low Stock */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 w-6 h-6" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <h2 className="text-3xl font-bold text-foreground">{stats.lowStock}</h2>
        </div>
      </div>

      {/* Out of Stock */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <CircleX className="text-red-600 dark:text-red-400 w-6 h-6" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <h2 className="text-3xl font-bold text-foreground">{stats.outOfStock}</h2>
        </div>
      </div>
    </div>
  );
}
