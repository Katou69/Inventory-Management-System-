export type OrderStatus =
  | "pending"
  | "picking"
  | "completed"
  | "cancelled";

export interface PickedShelf {
  shelf: string;
  quantity: number;
}

export interface OrderItem {
  product: string;
  quantity: number;
  pickedFrom?: PickedShelf[];
}

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
}