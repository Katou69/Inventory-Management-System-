export type PurchaseStatus =
  | "pending"
  | "completed"
  | "cancelled";

export interface PurchaseItem {
  product: string;
  quantity: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: PurchaseItem[];
  total: number;
  status: PurchaseStatus;
  date: string;
}