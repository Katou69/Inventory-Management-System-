export type OrderStatus =
  | "pending"
  | "completed"
  | "cancelled";

export interface OrderItem {
  product: string;
  quantity: number;
}

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
}