export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface Order {
  id: string
  customer: string
  warehouseId: number
  items: string
  quantity: number
  total: number
  status: OrderStatus
  date: string
}
