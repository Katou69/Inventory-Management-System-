/**
 * Inventory data-access layer. Same convention as dashboard-service.ts: read
 * through this function, not `src/data/inventory-data` directly. Flip
 * `NEXT_PUBLIC_USE_MOCK_API=false` and fill in the `apiFetch` branch to go live.
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { inventory } from "@/data/inventory-data"
import type { InventoryItem } from "@/types/inventory"
import { MovementTask } from "@/types/inventory-movement"
import { movementTasks } from "@/data/inventorymovement-data"
import { productShelfStock } from "@/data/product-shelf-stock";

const clone = <T>(value: T): T => structuredClone(value)

export async function getInventory(): Promise<InventoryItem[]> {
  if (config.useMock) return clone(inventory)
  return apiFetch<InventoryItem[]>("/inventory")
}


export async function getMovementTasks(): Promise<MovementTask[]> {
  if (config.useMock) return clone(movementTasks);
  return apiFetch<MovementTask[]>("/movement");

}

export type ShelfAvailability = {
  shelf: string;
  quantity: number;
};

/**
 * Shelves currently holding stock of a given product, and how much is
 * available on each. Used to populate the "Choose Shelf" dropdown in
 * the Move to Ship modal.
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
 * action. Mutates the mock data in place — swap this for a real API
 * call once the backend exists.
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

    if (inventoryItem.stock === 0) {
      inventoryItem.status = "out-of-stock";
    } else if (inventoryItem.stock <= inventoryItem.minStock) {
      inventoryItem.status = "low-stock";
    } else {
      inventoryItem.status = "in-stock";
    }
  }
}