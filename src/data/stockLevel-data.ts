import { StockLevel } from "@/types";

export const stockLevels: StockLevel[] = [
  {
    id: "SL001",
    productId: "PROD001",
    warehouseId: "WH001",
    quantity: 120,
    minimumLevel: 30,
  },
  {
    id: "SL002",
    productId: "PROD002",
    warehouseId: "WH001",
    quantity: 18,
    minimumLevel: 20,
  },
  {
    id: "SL003",
    productId: "PROD003",
    warehouseId: "WH001",
    quantity: 0,
    minimumLevel: 10,
  },
  {
    id: "SL004",
    productId: "PROD004",
    warehouseId: "WH002",
    quantity: 65,
    minimumLevel: 15,
  },
  {
    id: "SL005",
    productId: "PROD005",
    warehouseId: "WH002",
    quantity: 8,
    minimumLevel: 10,
  },
];