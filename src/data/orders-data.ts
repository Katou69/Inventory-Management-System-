import { Order } from "@/types/orders";

export const orders: Order[] = [
  { id: "83IHKDH", customer: "The Grand Hotel", warehouseId: 1, items: "Grand Royal Black", quantity: 23000, total: 343000, status: "delivered", date: "2026-06-10" },
  { id: "83IKDH", customer: "City Bar & Grill", warehouseId: 2, items: "Grand Royal Signature", quantity: 20000, total: 834000, status: "cancelled", date: "2026-06-11" },
  { id: "83IHKDH2", customer: "Metro Supermarket", warehouseId: 3, items: "Grand Royal Smooth", quantity: 14000, total: 73000, status: "delivered", date: "2026-06-12" },
  { id: "63IHDH", customer: "Riverside Restaurant", warehouseId: 4, items: "Grand Royal SRW", quantity: 11000, total: 28000, status: "delivered", date: "2026-06-13" },
  { id: "63IHKH", customer: "Downtown Café", warehouseId: 5, items: "Grand Royal Sherry Cask", quantity: 7000, total: 23000, status: "cancelled", date: "2026-06-14" },
  { id: "83IK2DH", customer: "The Lounge Club", warehouseId: 6, items: "Glan Master Double Smooth", quantity: 3500, total: 63000, status: "delivered", date: "2026-06-15" },
  { id: "13IH0H", customer: "Park Inn Hotel", warehouseId: 7, items: "Glan Master Finest", quantity: 1000000, total: 38000, status: "cancelled", date: "2026-06-16" },
];
