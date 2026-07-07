import { products } from "@/data/products-data";
import { suppliers } from "@/data/supplier-data";
import { stockLevels } from "@/data/stockLevel-data";

import { InventoryRow } from "@/types";

export function getInventoryRows(): InventoryRow[] {
  return products.map((product) => {
    const supplier = suppliers.find(
      (s) => s.id === product.supplierId
    );

    const stock = stockLevels.find(
      (s) => s.productId === product.id
    );

    const quantity = stock?.quantity ?? 0;
    const minimumLevel = stock?.minimumLevel ?? 0;

    let status: InventoryRow["status"] = "In Stock";

    if (quantity === 0) {
      status = "Out of Stock";
    } else if (quantity <= minimumLevel) {
      status = "Low Stock";
    }

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      supplierId: supplier?.id ?? "",
      supplierName: supplier?.name ?? "Unknown",
      price: product.price,
      quantity,
      minimumLevel,
      status,
    };
  });
}