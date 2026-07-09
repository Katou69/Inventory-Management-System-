import type { WarehouseStatus, ProductStockStatus } from "@/types/dashboard"

export const warehouseStatusStyle: Record<WarehouseStatus, string> = {
  "Active":            "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-900",
  "Under Maintenance": "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-900",
  "Closed":            "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-900",
}

export const warehouseStatusDot: Record<WarehouseStatus, string> = {
  "Active":            "bg-emerald-500",
  "Under Maintenance": "bg-amber-500",
  "Closed":            "bg-red-500",
}

export const productStatusStyle: Record<ProductStockStatus, string> = {
  "Normal":   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-900",
  "Low":      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-900",
  "Critical": "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-900",
}
