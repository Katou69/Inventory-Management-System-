export interface StatusCard {
  id: string
  label: string
  value: string
  changeText: string
  changeDirection: "up" | "down"
  icon: "stocks" | "value" | "suppliers" | "revenue" | "lowStock" | "orders"
}

export interface Warehouse {
  id: number
  name: string
  image: string
  lastInspection: string
  warehouseId: string
  location: string
  manager: string
  capacityUsed: number
  capacityTotal: number
}

export interface Product {
  id: number
  name: string
  image: string
  category: string
  quantity: string
  revenue: string
}

export interface ActivityEntry {
  id: number
  name: string
  role: string
  avatar: string
  description: string
  date: string
  time: string
}

export interface InventoryMonth {
  month: string
  stockIn: number
  stockOut: number
  stockValue: number
}

export interface InventoryDataPoint {
  label: string
  stockIn: number
  stockOut: number
  stockValue: number
}

export type InventoryPeriod = "days" | "months" | "years"

export type WarehouseStatus = "Active" | "Under Maintenance" | "Closed"

export type MovementType = "Inbound" | "Outbound" | "Transfer In" | "Transfer Out"

export interface StockMovement {
  id: number
  item: string
  type: MovementType
  qty: number // signed: positive inbound, negative outbound
  date: string
}

export interface DailyMovement {
  day: string
  inbound: number
  outbound: number
}

export type ProductStockStatus = "Normal" | "Low" | "Critical"

export interface WarehouseProduct {
  id: number
  sku: string
  name: string
  category: string
  quantity: number
  status: ProductStockStatus
  lastUpdated: string
}

export type WarehouseActivityCategory = "Stock" | "Inspection" | "User"

export interface WarehouseActivity {
  id: number
  name: string
  role: string
  initials: string
  description: string
  category: WarehouseActivityCategory
  date: string
  time: string
}

// ---------------------------------------------------------------------------
// Warehouse zone layout (see grgi_zone_layout_spec.md)
// ---------------------------------------------------------------------------

export type ViewerRole = "admin" | "manager" | "staff"

/**
 * Two kinds of box on the map:
 *  - "shelf" — a storage unit: label + capacity + live occupancy color.
 *  - "zone"  — a label-only grouping container used to organize shelf blocks;
 *              no capacity, no stock, no occupancy color.
 */
export type SectionKind = "shelf" | "zone"

/** Live layout row — the "true" state, and (for shelves) the storage unit. */
export interface ZoneSection {
  id: number
  warehouseId: number
  kind: SectionKind
  /** Short label (e.g. "A", "COLD"). */
  code: string
  /** Human-readable name (e.g. "Receiving", "Bulk Storage 1"). */
  name: string
  x: number
  y: number
  width: number
  height: number
  /** Max total units a shelf holds; ignored for "zone" boxes. Structural. */
  capacity: number
}

/** A zone can hold a mix of SKUs — one row per SKU per zone. */
export interface ZoneStockEntry {
  id: number
  sectionId: number
  itemName: string
  quantity: number
}

export type ZoneChangeAction = "create" | "update" | "delete"
export type ZoneChangeStatus = "pending" | "approved" | "rejected"

/** Editable zone fields carried in proposed/previous snapshots. */
export type ZoneFields = Partial<Pick<ZoneSection, "kind" | "code" | "name" | "x" | "y" | "width" | "height" | "capacity">>

/**
 * One change inside a proposal batch. A move/resize/field-edit is an "update",
 * a drawn box is a "create", a removal is a "delete".
 */
export interface ZoneChangeItem {
  actionType: ZoneChangeAction
  /** null when actionType = "create" */
  sectionId: number | null
  proposedData: ZoneFields | null
  previousData: ZoneFields | null
}

/**
 * A layout proposal. Managers accumulate several edits into one batch submitted
 * with a single note; admin direct edits are stored as one-item, self-approved
 * batches. Approve/reject act on the whole batch atomically.
 */
export interface ZoneChangeRequest {
  id: number
  warehouseId: number
  requestedBy: string
  items: ZoneChangeItem[]
  requestNote: string
  status: ZoneChangeStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
}

/** Derived at render time from zone_stock totals vs capacity — never stored. */
export type ZoneOccupancy = "empty" | "partial" | "full"

export interface SalesOverview {
  numberOfSales: number
  totalSales: number
  target: number
}

export interface CreateWarehouseInput {
  name: string
  location: string
  manager: string
  capacityTotal: number
  image?: string
}

export interface UpdateWarehouseProfileInput {
  manager: string
  address: string
  phone: string
  email: string
  nextInspection: string
  image?: string
}

export interface SearchIndex {
  products: Product[]
  warehouses: Warehouse[]
}

export type NotificationType = "stock" | "order" | "alert" | "user"

export interface NotificationItem {
  id: number
  type: NotificationType
  title: string
  description: string
  time: string
  unread: boolean
}

export interface WarehouseDetail extends Warehouse {
  status: WarehouseStatus
  phone: string
  email: string
  address: string
  nextInspection: string
  totalSkus: number
  lowStockCount: number
  pendingInbound: number
  throughput: number
  dailyMovement: DailyMovement[]
  movements: StockMovement[]
  products: WarehouseProduct[]
  activities: WarehouseActivity[]
}