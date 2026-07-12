import { ProductShelfStock } from "@/types/inventory";

/**
 * Mock per-shelf breakdown of stock for every product referenced in
 * data/orders-data.ts. Sums match each product's `stock` in
 * inventory-data.ts. Replace with real per-shelf inventory once the
 * backend exists.
 */
export const productShelfStock: ProductShelfStock[] = [
  { productName: "Grand Royal Black", shelfName: "A1", warehouseId: 1, quantity: 3000 },
  { productName: "Grand Royal Black", shelfName: "C1", warehouseId: 1, quantity: 3000 },

  { productName: "Grand Royal Signature", shelfName: "B2", warehouseId: 1, quantity: 5000 },

  { productName: "Grand Royal Smooth", shelfName: "A1", warehouseId: 1, quantity: 5000 },

  { productName: "Grand Royal Sherry Cask", shelfName: "B2", warehouseId: 1, quantity: 4000 },
  { productName: "Grand Royal Sherry Cask", shelfName: "C1", warehouseId: 1, quantity: 4000 },

  { productName: "Grand Royal SRW", shelfName: "A1", warehouseId: 1, quantity: 4000 },
  { productName: "Grand Royal SRW", shelfName: "B2", warehouseId: 1, quantity: 3000 },

  { productName: "Glan Master Finest", shelfName: "C1", warehouseId: 1, quantity: 2000 },

  { productName: "Glan Master Double Smooth", shelfName: "A1", warehouseId: 1, quantity: 1500 },
  { productName: "Glan Master Double Smooth", shelfName: "B2", warehouseId: 1, quantity: 1000 },
];