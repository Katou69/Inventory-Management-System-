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