/**
 * Purchase orders data-access layer. Same convention as dashboard-service.ts:
 * read through this function, not `src/data/purchase-data` directly. Flip
 * `NEXT_PUBLIC_USE_MOCK_API=false` and fill in the `apiFetch` branch to go live.
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { purchases } from "@/data/purchase-data"
import type { PurchaseOrder } from "@/types/purchases"
import { inventory } from "@/data/inventory-data";
import { productShelfStock } from "@/data/product-shelf-stock";
import { shelves } from "@/data/inventorymovement-data";

const clone = <T>(value: T): T => structuredClone(value)
export type ShelfAvailability = {
  shelf: string;
  quantity: number;
};


export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (config.useMock) return clone(purchases)
  return apiFetch<PurchaseOrder[]>("/purchase-orders")
}

/**
 * Shelves currently holding stock of a given product, and how much is
 * available on each. Used by the Order "Move to Ship" modal.
 */
export function getShelfStockForProduct(
  productName: string
): ShelfAvailability[] {
  return productShelfStock
    .filter(
      (entry) => entry.productName === productName && entry.quantity > 0
    )
    .map((entry) => ({ shelf: entry.shelfName, quantity: entry.quantity }));
}

/**
 * Deducts the given quantities from the specified shelves, and from the
 * product's overall inventory stock, once staff confirm a Move to Ship
 * action (Order flow). Mutates the mock data in place.
 */
export function deductInventory(
  productName: string,
  allocations: { shelf: string; quantity: number }[]
) {
  allocations.forEach(({ shelf, quantity }) => {
    const shelfEntry = productShelfStock.find(
      (entry) =>
        entry.productName === productName && entry.shelfName === shelf
    );

    if (shelfEntry) {
      shelfEntry.quantity = Math.max(0, shelfEntry.quantity - quantity);
    }
  });

  const totalDeducted = allocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0
  );

  const inventoryItem = inventory.find((item) => item.name === productName);

  if (inventoryItem) {
    inventoryItem.stock = Math.max(0, inventoryItem.stock - totalDeducted);
    recalculateStatus(inventoryItem);
  }
}

export type ShelfCapacity = {
  shelf: string;
  capacity: number;
  currentStock: number;
  free: number;
};

/**
 * All shelves with their remaining free capacity. Used by the Purchase
 * "Place in Inventory" step, since incoming stock can go on any shelf,
 * not just ones that already hold that product.
 */
export function getAllShelves(): ShelfCapacity[] {
  return shelves.map((shelf) => ({
    shelf: shelf.name,
    capacity: shelf.capacity,
    currentStock: shelf.currentStock,
    free: shelf.capacity - shelf.currentStock,
  }));
}

/**
 * Adds the given quantities to the specified shelves (and to the
 * product's overall inventory stock) once staff finish placing a
 * received purchase order into inventory. Mutates the mock data in
 * place — swap this for a real API call once the backend exists.
 */
export function addInventory(
  productName: string,
  allocations: { shelf: string; quantity: number }[]
) {
  allocations.forEach(({ shelf, quantity }) => {
    const shelfStockEntry = productShelfStock.find(
      (entry) =>
        entry.productName === productName && entry.shelfName === shelf
    );

    if (shelfStockEntry) {
      shelfStockEntry.quantity += quantity;
    } else {
      const shelfRecord = shelves.find((s) => s.name === shelf);

      productShelfStock.push({
        productName,
        shelfName: shelf,
        warehouseId: shelfRecord?.warehouseId ?? 1,
        quantity,
      });
    }

    const shelfRecord = shelves.find((s) => s.name === shelf);

    if (shelfRecord) {
      shelfRecord.currentStock += quantity;
    }
  });

  const totalAdded = allocations.reduce((sum, a) => sum + a.quantity, 0);

  let inventoryItem = inventory.find((item) => item.name === productName);

  if (inventoryItem) {
    inventoryItem.stock += totalAdded;
  } else {
    // Product not yet in the inventory master list. This is a mock
    // placeholder — once a real backend/product catalog exists, this
    // should look up real SKU/price/category instead of guessing.
    inventoryItem = {
      id: `NEW-${Date.now()}`,
      name: productName,
      sku: `PENDING-SKU-${inventory.length + 1}`,
      category: "Uncategorized",
      supplier: "Unknown",
      supplierId: "SUP-000",
      warehouseId: allocations[0]
        ? shelves.find((s) => s.name === allocations[0].shelf)?.warehouseId ?? 1
        : 1,
      price: 0,
      stock: totalAdded,
      minStock: 0,
      status: "in-stock",
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    inventory.push(inventoryItem);
  }

  inventoryItem.lastUpdated = new Date().toISOString().split("T")[0];
  recalculateStatus(inventoryItem);
}

function recalculateStatus(item: (typeof inventory)[number]) {
  if (item.stock === 0) {
    item.status = "out-of-stock";
  } else if (item.stock <= item.minStock) {
    item.status = "low-stock";
  } else {
    item.status = "in-stock";
  }
}

