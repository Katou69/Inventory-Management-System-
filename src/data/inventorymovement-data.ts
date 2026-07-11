import { MovementTask } from "@/types/inventory-movement";
import { Shelf } from "@/types/inventory";

export const movementTasks: MovementTask[] = [

  {
    id: "MOV-001",
    productId: "PROD-001",
    productName: "Grand Royal Black",
    quantity: 20,
    fromShelf: "A3",

    toShelf: "A1",
    requestedBy: "Manager A",
    warehouseId: 1,
    status: "pending",
    reason: "Consolidate stock from A3 to A1 for better accessibility",
  },

  {
    id: "MOV-002",
    productId: "PROD-002",
    productName: "Coca-Cola 500ml",
    quantity: 10,
    fromShelf: "B2",
    toShelf: "B1",
    requestedBy: "Manager A",
    warehouseId: 1,
    status: "pending",
    reason: "Move stock from B2 to B1 for reorganization",
  },

];


export const shelves: Shelf[] = [
  {
    id: "1",
    warehouseId: 1,
    name: "A1",
    capacity: 200,
    currentStock: 150,
  },
  {
    id: "2",
    warehouseId: 1,
    name: "B2",
    capacity: 100,
    currentStock: 20,
  },
  {
    id: "3",
    warehouseId: 1,
    name: "C1",
    capacity: 300,
    currentStock: 250,
  },
];