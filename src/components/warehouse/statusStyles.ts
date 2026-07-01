import type { WarehouseStatus, ProductStockStatus } from "@/types/dashboard"

export const warehouseStatusStyle: Record<WarehouseStatus, string> = {
  "Active":            "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Under Maintenance": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Closed":            "bg-red-50 text-red-700 ring-1 ring-red-200",
}

export const warehouseStatusDot: Record<WarehouseStatus, string> = {
  "Active":            "bg-emerald-500",
  "Under Maintenance": "bg-amber-500",
  "Closed":            "bg-red-500",
}

export const productStatusStyle: Record<ProductStockStatus, string> = {
  "Normal":   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Low":      "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Critical": "bg-red-50 text-red-700 ring-1 ring-red-200",
}
