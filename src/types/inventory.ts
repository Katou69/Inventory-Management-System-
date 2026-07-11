export type InventoryStatus = "in-stock" | "low-stock" | "out-of-stock"

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  supplier: string
  supplierId: string
  warehouseId: number
  price: number
  stock: number
  minStock: number
  status: InventoryStatus
  lastUpdated: string
}

export interface Shelf {
    id: string;
    warehouseId: number;
    name: string;
    capacity: number;
    currentStock: number;
}