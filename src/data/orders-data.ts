export type OrderStatus = "Delivered" | "Cancelled" | "Pending";

export interface Order {
  id: number;
  orderId: string;
  orderName: string;
  stockValue: string;
  quantity: string;
  status: OrderStatus;
}

export const orders: Order[] = [
  { id: 1, orderId: "83IHKDH", orderName: "Grand Royal Black", stockValue: "343K", quantity: "23K", status: "Delivered" },
  { id: 2, orderId: "83IKDH", orderName: "Grand Royal Signature", stockValue: "834K", quantity: "20K", status: "Cancelled" },
  { id: 3, orderId: "83IHKDH", orderName: "Grand Royal Smooth", stockValue: "73K", quantity: "14K", status: "Delivered" },
  { id: 4, orderId: "63IHDH", orderName: "Grand Royal SRW", stockValue: "28K", quantity: "11K", status: "Delivered" },
  { id: 5, orderId: "63IHKH", orderName: "Grand Royal Sherry Cask", stockValue: "23K", quantity: "7K", status: "Cancelled" },
  { id: 6, orderId: "83IK2DH", orderName: "Glan Master Double Smooth", stockValue: "63K", quantity: "3.5K", status: "Delivered" },
  { id: 7, orderId: "13IH0H", orderName: "Glan Master Finest", stockValue: "38K", quantity: "1000K", status: "Cancelled" },
];