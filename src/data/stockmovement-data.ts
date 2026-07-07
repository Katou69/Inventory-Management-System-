import { StockMovement } from "@/types";

export const stockMovements: StockMovement[] = [
  {
    id: "MOV001",
    productId: "PROD001",
    warehouseId: "WH001",
    quantity: 50,
    type: "IN",
    date: "2026-07-01",
    reason: "Purchase Order",
    userId: "USR001",
  },
  {
    id: "MOV002",
    productId: "PROD001",
    warehouseId: "WH001",
    quantity: 20,
    type: "OUT",
    date: "2026-07-03",
    reason: "Customer Sale",
    userId: "USR002",
  },
  {
    id: "MOV003",
    productId: "PROD002",
    warehouseId: "WH001",
    quantity: 10,
    type: "OUT",
    date: "2026-07-04",
    reason: "Customer Sale",
    userId: "USR001",
  },
  {
    id: "MOV004",
    productId: "PROD003",
    warehouseId: "WH001",
    quantity: 15,
    type: "IN",
    date: "2026-06-28",
    reason: "Purchase Order",
    userId: "USR003",
  },
];