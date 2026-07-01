import { InventoryItem } from "@/types/inventory";

export const inventory: InventoryItem[] = [
  {
    id: "1",
    name: "Grand Royal Smooth",
    sku: "GSM-2201",
    price: 10000,
    category: "Alcohol",
    supplier: "Grand Royal Group International",
    supplierId: "SUP-001",
    stock: 142,
    status: "In Stock",
  },
  {
    id: "2",
    name: "Coca-Cola 500ml",
    sku: "CC-0073",
    price: 3000,
    category: "Beverages",
    supplier: "Coca-Cola Inc.",
    supplierId: "SUP-003",
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: "3",
    name: "Office Chair",
    sku: "CHR-001",
    price: 140000,
    category: "Furniture",
    supplier: "Office World",
    supplierId: "SUP-004",
    stock: 10,
    status: "Low Stock",
  },
];