export type PurchaseStatus =
  | "pending"
  | "receiving"
  | "completed"
  | "cancelled";

export interface PlacedShelf {
  shelf: string;
  quantity: number;
}

export interface PurchaseItem {
  product: string;
  quantity: number;
  placedIn?: PlacedShelf[];
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: PurchaseItem[];
  total: number;
  status: PurchaseStatus;
  date: string;
}