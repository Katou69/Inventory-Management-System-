export type InventoryStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock";

export interface InventoryRow {
  productId: string;

  sku: string;

  name: string;

  category: string;

  supplierName: string;

  supplierId: string;

  price: number;

  quantity: number;

  minimumLevel: number;

  status: InventoryStatus;
}