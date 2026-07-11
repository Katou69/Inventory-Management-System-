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

const clone = <T>(value: T): T => structuredClone(value)

export async function getInventory(): Promise<InventoryItem[]> {
  if (config.useMock) return clone(inventory)
  return apiFetch<InventoryItem[]>("/inventory")
}


export async function getMovementTasks(): Promise<MovementTask[]> {
  if (config.useMock) return clone(movementTasks);
  return apiFetch<MovementTask[]>("/movement");

}