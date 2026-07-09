/**
 * Dashboard data-access layer.
 *
 * Every component and page reads/writes through these functions instead of
 * importing static data directly. Today each function returns in-memory mock
 * data; to integrate a backend, flip `NEXT_PUBLIC_USE_MOCK_API=false` and fill
 * in the `apiFetch` branch of each function. The signatures already match a
 * REST-style API, so the UI layer does not change.
 */
import { config } from "@/lib/config"
import { apiFetch, ApiError } from "@/lib/api-client"
import {
  statusCards,
  inventoryByPeriod,
  warehouses,
  products,
  activities,
  notifications,
  buildWarehouseDetail,
} from "@/data/dashboard-data"
import type {
  StatusCard,
  InventoryDataPoint,
  InventoryPeriod,
  Warehouse,
  WarehouseDetail,
  Product,
  ActivityEntry,
  NotificationItem,
  SalesOverview,
  SearchIndex,
  CreateWarehouseInput,
  UpdateWarehouseProfileInput,
} from "@/types/dashboard"

// Deep clone so callers can safely mutate their own copy of mock data.
const clone = <T>(value: T): T => structuredClone(value)

const defaultSalesOverview: SalesOverview = {
  numberOfSales: 1233,
  totalSales: 15233,
  target: 21365,
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getStatusCards(): Promise<StatusCard[]> {
  if (config.useMock) return clone(statusCards)
  return apiFetch<StatusCard[]>("/status-cards")
}

export async function getInventoryStatistics(): Promise<Record<InventoryPeriod, InventoryDataPoint[]>> {
  if (config.useMock) return clone(inventoryByPeriod)
  return apiFetch<Record<InventoryPeriod, InventoryDataPoint[]>>("/inventory-statistics")
}

export async function getWarehouses(): Promise<Warehouse[]> {
  if (config.useMock) return clone(warehouses)
  return apiFetch<Warehouse[]>("/warehouses")
}

export async function getWarehouseDetail(id: number): Promise<WarehouseDetail | null> {
  if (config.useMock) return buildWarehouseDetail(id) ?? null
  return apiFetch<WarehouseDetail | null>(`/warehouses/${id}`)
}

export async function getTopProducts(period = "This month"): Promise<Product[]> {
  if (config.useMock) return clone(products)
  return apiFetch<Product[]>(`/products/top?period=${encodeURIComponent(period)}`)
}

export async function getRecentActivities(): Promise<ActivityEntry[]> {
  if (config.useMock) return clone(activities)
  return apiFetch<ActivityEntry[]>("/activities")
}

export async function getNotifications(): Promise<NotificationItem[]> {
  if (config.useMock) return clone(notifications)
  return apiFetch<NotificationItem[]>("/notifications")
}

export async function getSalesOverview(): Promise<SalesOverview> {
  if (config.useMock) return clone(defaultSalesOverview)
  return apiFetch<SalesOverview>("/sales/overview")
}

/** Data used to power the header search box. */
export async function getSearchIndex(): Promise<SearchIndex> {
  if (config.useMock) return { products: clone(products), warehouses: clone(warehouses) }
  return apiFetch<SearchIndex>("/search-index")
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
  if (config.useMock) {
    const nextId = Math.max(0, ...warehouses.map((w) => w.id)) + 1
    return {
      id: nextId,
      name: input.name,
      image: input.image ?? "/images/ellipse-2.png",
      lastInspection: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      warehouseId: `WH-${String(nextId).padStart(3, "0")}`,
      location: input.location,
      manager: input.manager,
      capacityUsed: 0,
      capacityTotal: input.capacityTotal,
    }
  }
  return apiFetch<Warehouse>("/warehouses", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/**
 * Uploads a warehouse image and returns its URL.
 *
 * In mock mode there is no backend to store the file, so it's kept as a local
 * object URL for this session's preview only (not persisted across reloads,
 * same limitation as the rest of the mock layer).
 */
export async function uploadWarehouseImage(file: File): Promise<string> {
  if (config.useMock) return URL.createObjectURL(file)

  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${config.apiBaseUrl}/uploads/warehouse-image`, {
    method: "POST",
    credentials: "include",
    body: form,
  })
  if (!res.ok) throw new ApiError(res.status, "Image upload failed")
  const { url } = (await res.json()) as { url: string }
  return `${config.apiBaseUrl}${url}`
}

export async function markAllNotificationsRead(): Promise<void> {
  if (config.useMock) return
  await apiFetch<void>("/notifications/read-all", { method: "POST" })
}

export async function markNotificationRead(id: number): Promise<void> {
  if (config.useMock) return
  await apiFetch<void>(`/notifications/${id}/read`, { method: "POST" })
}

export async function updateSalesGoal(target: number): Promise<SalesOverview> {
  if (config.useMock) return { ...defaultSalesOverview, target }
  return apiFetch<SalesOverview>("/sales/goal", {
    method: "PUT",
    body: JSON.stringify({ target }),
  })
}

export async function updateWarehouseProfile(
  id: number,
  input: UpdateWarehouseProfileInput,
): Promise<UpdateWarehouseProfileInput> {
  if (config.useMock) return input
  return apiFetch<UpdateWarehouseProfileInput>(`/warehouses/${id}/profile`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}
