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