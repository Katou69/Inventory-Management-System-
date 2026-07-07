/**
 * Orders data-access layer. Same convention as dashboard-service.ts: read
 * through this function, not `src/data/orders-data` directly. Flip
 * `NEXT_PUBLIC_USE_MOCK_API=false` and fill in the `apiFetch` branch to go live.
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { orders } from "@/data/orders-data"
import type { Order } from "@/types/orders"

const clone = <T>(value: T): T => structuredClone(value)

export async function getOrders(): Promise<Order[]> {
  if (config.useMock) return clone(orders)
  return apiFetch<Order[]>("/orders")
}
