/**
 * Purchase orders data-access layer. Same convention as dashboard-service.ts:
 * read through this function, not `src/data/purchase-data` directly. Flip
 * `NEXT_PUBLIC_USE_MOCK_API=false` and fill in the `apiFetch` branch to go live.
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { purchases } from "@/data/purchase-data"
import type { PurchaseOrder } from "@/types/purchases"

const clone = <T>(value: T): T => structuredClone(value)

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (config.useMock) return clone(purchases)
  return apiFetch<PurchaseOrder[]>("/purchase-orders")
}
