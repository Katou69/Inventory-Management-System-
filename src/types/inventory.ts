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

// NEW — per-product stock broken down by shelf. Needed for the
// "Move to Ship" picking modal (Order flow), since Shelf/InventoryItem
// alone don't tell you how much of a *specific* product sits on a
// *specific* shelf.
export interface ProductShelfStock {
  productName: string; // must match Order.items[].product exactly
  shelfName: string;   // must match Shelf.name
  warehouseId: number;
  quantity: number;
}