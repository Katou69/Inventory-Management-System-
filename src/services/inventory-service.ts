/**
 * Inventory data-access layer. Same convention as dashboard-service.ts: read
 * through this function, not `src/data/inventory-data` directly.
 *
 * Two boundary conversions happen here and nowhere else, so every component
 * downstream sees clean, correctly-typed data:
 *   1. status strings: backend "in_stock" -> frontend "in-stock"
 *   2. ids: backend numbers -> frontend strings (InventoryItem.id is string)
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { inventory } from "@/data/inventory-data"
import type { InventoryItem, InventoryStatus } from "@/types/inventory"
import { MovementTask } from "@/types/inventory-movement"
import { movementTasks, shelves } from "@/data/inventorymovement-data"
import { productShelfStock } from "@/data/product-shelf-stock"

const clone = <T>(value: T): T => structuredClone(value)

function toHyphenStatus(status: string): InventoryStatus {
  return status.replace(/_/g, "-") as InventoryStatus
}

// ---- Inventory table ----

type ProductInventoryApiRow = {
  id: number
  name: string
  sku: string
  price: number
  category: string
  supplier: string
  supplierId: number | null
  stock: number
  minStock: number
  status: string
}

export async function getInventory(warehouseId: number): Promise<InventoryItem[]> {
  if (config.useMockInventory) {
    return clone(inventory).filter((i) => i.warehouseId === warehouseId)
  }

  const rows = await apiFetch<ProductInventoryApiRow[]>(`/warehouses/${warehouseId}/inventory`)
  return rows.map((r) => ({
    id: String(r.id),
    sku: r.sku,
    name: r.name,
    category: r.category,
    supplier: r.supplier,
    supplierId: r.supplierId != null ? String(r.supplierId) : "",
    warehouseId,
    price: r.price,
    stock: r.stock,
    minStock: r.minStock,
    status: toHyphenStatus(r.status),
    lastUpdated: "", // backend doesn't return this yet; not rendered by the table today
  }))
}

// ---- Stats cards ----

export type InventoryStats = {
  totalItems: number
  lowStock: number
  outOfStock: number
}

export async function getInventoryStats(warehouseId: number): Promise<InventoryStats> {
  if (config.useMockInventory) {
    const items = inventory.filter((i) => i.warehouseId === warehouseId)
    return {
      totalItems: items.length,
      lowStock: items.filter((i) => i.status === "low-stock").length,
      outOfStock: items.filter((i) => i.status === "out-of-stock").length,
    }
  }
  return apiFetch<InventoryStats>(`/warehouses/${warehouseId}/inventory/stats`)
}

// ---- Edit product ----

export async function updateProduct(
  productId: string,
  body: { name?: string; price?: number; minStock?: number }
): Promise<void> {
  if (config.useMockInventory) {
    const item = inventory.find((i) => i.id === productId)
    if (item) Object.assign(item, body)
    return
  }
  await apiFetch(`/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

// ---- Product history ----

export type HistoryEntry = {
  id: number
  kind: "inbound" | "outbound" | "transfer_in" | "transfer_out" | "adjustment"
  quantity: number
  occurredAt: string
  note: string
}

export async function getProductHistory(
  productId: string,
  warehouseId: number,
  range?: "7d" | "30d"
): Promise<HistoryEntry[]> {
  if (config.useMockInventory) return [] // mock data has no ledger to draw from

  const params = new URLSearchParams({ warehouse_id: String(warehouseId) })
  if (range) params.set("range", range)
  return apiFetch<HistoryEntry[]>(`/items/${productId}/history?${params.toString()}`)
}

// ---- Movement tasks ----

type MovementTaskApiRow = {
  id: number
  productId: number
  productName: string
  quantity: number
  fromShelf: string
  toShelf: string
  requestedBy: string
  reason: string
  status: string
}

function toMovementTask(row: MovementTaskApiRow, warehouseId: number): MovementTask {
  return {
    id: String(row.id),
    productId: String(row.productId),
    productName: row.productName,
    quantity: row.quantity,
    fromShelf: row.fromShelf,
    toShelf: row.toShelf,
    requestedBy: row.requestedBy,
    warehouseId,
    reason: row.reason,
    status: row.status as MovementTask["status"],
  }
}

export async function getMovementTasks(warehouseId: number): Promise<MovementTask[]> {
  if (config.useMockInventory) {
    return clone(movementTasks).filter((t) => t.warehouseId === warehouseId)
  }
  const rows = await apiFetch<MovementTaskApiRow[]>(
    `/warehouses/${warehouseId}/movement-tasks?status=pending`
  )
  return rows.map((r) => toMovementTask(r, warehouseId))
}

export async function createMovementTask(
  warehouseId: number,
  body: {
    productId: string
    quantity: number
    fromShelfId: number
    toShelfId: number
    reason: string
  }
): Promise<MovementTask> {
  if (config.useMockInventory) {
    const product = inventory.find((i) => i.id === body.productId)
    const task: MovementTask = {
      id: crypto.randomUUID(),
      productId: body.productId,
      productName: product?.name ?? "",
      quantity: body.quantity,
      fromShelf: shelves.find((s) => Number(s.id) === body.fromShelfId)?.name ?? "",
      toShelf: shelves.find((s) => Number(s.id) === body.toShelfId)?.name ?? "",
      requestedBy: "Admin",
      warehouseId,
      reason: body.reason,
      status: "pending",
    }
    movementTasks.push(task)
    return clone(task)
  }

  const row = await apiFetch<MovementTaskApiRow>(`/warehouses/${warehouseId}/movement-tasks`, {
    method: "POST",
    body: JSON.stringify({
      productId: Number(body.productId),
      quantity: body.quantity,
      fromShelfId: body.fromShelfId,
      toShelfId: body.toShelfId,
      reason: body.reason,
    }),
  })
  return toMovementTask(row, warehouseId)
}

export async function completeMovementTask(taskId: string): Promise<void> {
  if (config.useMockInventory) {
    const task = movementTasks.find((t) => t.id === taskId)
    if (task) task.status = "completed"
    return
  }
  await apiFetch(`/movement-tasks/${taskId}/complete`, { method: "POST" })
}

// ---- Shelves for the Create Movement modal ----
// Reuses the zones endpoints your teammate already built — no new backend
// routes needed for "From shelf" / "To shelf".

export type ShelfOption = {
  id: number
  name: string
  capacity: number
  /** How much of the SELECTED product sits on this shelf (drives "From shelf"). */
  stockOfProduct: number
  /** Total units of ALL products on this shelf (drives free-capacity math for "To shelf"). */
  totalOccupied: number
}

type ZoneSectionApi = { id: number; name: string; capacity: number }
// NOTE: ZoneStockEntryOut has no productId — only a joined `itemName` string.
// Matching has to be by product NAME, not id, on the live path.
type ZoneStockEntryApi = { sectionId: number; itemName: string; quantity: number }

export async function getShelvesForProduct(
  warehouseId: number,
  productName: string
): Promise<ShelfOption[]> {
  if (config.useMockInventory) {
    return shelves
      .filter((s) => s.warehouseId === warehouseId)
      .map((s) => ({
        id: Number(s.id),
        name: s.name,
        capacity: s.capacity,
        totalOccupied: s.currentStock,
        stockOfProduct:
          productShelfStock.find((p) => p.shelfName === s.name && p.productName === productName)
            ?.quantity ?? 0,
      }))
  }

  const [zones, zoneStock] = await Promise.all([
    apiFetch<ZoneSectionApi[]>(`/warehouses/${warehouseId}/zones`),
    apiFetch<ZoneStockEntryApi[]>(`/warehouses/${warehouseId}/zone-stock`),
  ])

  return zones.map((z) => {
    const entriesForSection = zoneStock.filter((e) => e.sectionId === z.id)
    return {
      id: z.id,
      name: z.name,
      capacity: z.capacity,
      totalOccupied: entriesForSection.reduce((sum, e) => sum + e.quantity, 0),
      stockOfProduct: entriesForSection.find((e) => e.itemName === productName)?.quantity ?? 0,
    }
  })
}

// ---- Warehouse dropdown ----

export type WarehouseOption = { id: number; name: string }

export async function getWarehouses(): Promise<WarehouseOption[]> {
  if (config.useMockInventory) {
    return [1, 2, 3, 4].map((id) => ({ id, name: `Warehouse ${id}` }))
  }
  return apiFetch<WarehouseOption[]>("/warehouses")
}

// ---- Existing "Move to Ship" picking helpers (Orders flow) — unchanged ----

export type ShelfAvailability = { shelf: string; quantity: number }
export type ShelfFreeSpace = { shelf: string; free: number }

export function getShelfStockForProduct(productName: string): ShelfAvailability[] {
  return productShelfStock
    .filter((entry) => entry.productName === productName && entry.quantity > 0)
    .map((entry) => ({ shelf: entry.shelfName, quantity: entry.quantity }))
}

export function getAllShelves(): ShelfFreeSpace[] {
  return shelves.map((shelf) => ({
    shelf: shelf.name,
    free: shelf.capacity - shelf.currentStock,
  }))
}

export function deductInventory(
  productName: string,
  allocations: { shelf: string; quantity: number }[]
) {
  allocations.forEach(({ shelf, quantity }) => {
    const shelfEntry = productShelfStock.find(
      (entry) => entry.productName === productName && entry.shelfName === shelf
    )
    if (shelfEntry) {
      shelfEntry.quantity = Math.max(0, shelfEntry.quantity - quantity)
    }
  })

  const totalDeducted = allocations.reduce((sum, allocation) => sum + allocation.quantity, 0)
  const inventoryItem = inventory.find((item) => item.name === productName)

  if (inventoryItem) {
    inventoryItem.stock = Math.max(0, inventoryItem.stock - totalDeducted)
    if (inventoryItem.stock === 0) {
      inventoryItem.status = "out-of-stock"
    } else if (inventoryItem.stock <= inventoryItem.minStock) {
      inventoryItem.status = "low-stock"
    } else {
      inventoryItem.status = "in-stock"
    }
  }
}

export function addInventory(
  productName: string,
  allocations: { shelf: string; quantity: number }[]
) {
  const overflow = allocations.find(({ shelf, quantity }) => {
    const shelfData = shelves.find((entry) => entry.name === shelf)
    return shelfData && shelfData.currentStock + quantity > shelfData.capacity
  })

  if (overflow) {
    throw new Error(
      `Cannot place ${overflow.quantity} units on ${overflow.shelf}: exceeds free capacity.`
    )
  }

  allocations.forEach(({ shelf, quantity }) => {
    const shelfData = shelves.find((entry) => entry.name === shelf)
    if (shelfData) {
      shelfData.currentStock += quantity
    }

    const productShelf = productShelfStock.find(
      (entry) => entry.productName === productName && entry.shelfName === shelf
    )
    if (productShelf) {
      productShelf.quantity += quantity
    } else {
      productShelfStock.push({
        productName,
        shelfName: shelf,
        warehouseId: shelfData?.warehouseId ?? 1,
        quantity,
      })
    }
  })

  const totalAdded = allocations.reduce((sum, allocation) => sum + allocation.quantity, 0)
  const inventoryItem = inventory.find((item) => item.name === productName)
  if (!inventoryItem) return

  inventoryItem.stock += totalAdded
  if (inventoryItem.stock === 0) {
    inventoryItem.status = "out-of-stock"
  } else if (inventoryItem.stock <= inventoryItem.minStock) {
    inventoryItem.status = "low-stock"
  } else {
    inventoryItem.status = "in-stock"
  }
}