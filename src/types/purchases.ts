export type PurchaseStatus = "draft" | "submitted" | "approved" | "received"

export interface PurchaseOrder {
  id: string
  supplier: string
  warehouseId: number
  items: string
  quantity: number
  total: number
  status: PurchaseStatus
  date: string
}
