import type { StatusCard, Warehouse, Product, ActivityEntry, InventoryMonth } from "@/types/dashboard"

export const statusCards: StatusCard[] = [
  {
    id: "total-stocks",
    label: "Total Stocks Among all Warehouses",
    value: "3,842",
    changeText: "increased 215 than last month",
    changeDirection: "up",
    icon: "stocks",
  },
  {
    id: "total-value",
    label: "Total Stock Value",
    value: "$41,111",
    changeText: "increased 215 than last month",
    changeDirection: "up",
    icon: "value",
  },
  {
    id: "total-suppliers",
    label: "Total Suppliers",
    value: "187",
    changeText: "increased 215 than last month",
    changeDirection: "up",
    icon: "suppliers",
  },
  {
    id: "total-revenue",
    label: "Total Revenue Generated",
    value: "187K",
    changeText: "increased 12K than last month",
    changeDirection: "up",
    icon: "revenue",
  },
  {
    id: "low-stock",
    label: "Low Stock Items",
    value: "56",
    changeText: "from this month",
    changeDirection: "up",
    icon: "lowStock",
  },
  {
    id: "orders-completed",
    label: "Total Order Completed",
    value: "230",
    changeText: "this month",
    changeDirection: "up",
    icon: "orders",
  },
]

export const warehouses: Warehouse[] = [
  { id: 1, name: "Yangon Central WH", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-001", location: "Yangon", manager: "Hein Htet Aung", capacityUsed: 8500, capacityTotal: 10000 },
  { id: 2, name: "Mandalay Cold Store", image: "/images/ellipse-3.png", lastInspection: "18-06-2026", warehouseId: "WH-002", location: "Mandalay", manager: "Thaw Thaw Tun", capacityUsed: 2100, capacityTotal: 3000 },
  { id: 3, name: "Taunggyi Distribution", image: "/images/ellipse-4.png", lastInspection: "18-06-2026", warehouseId: "WH-003", location: "Taunggyi", manager: "Aung Htoo Pyae", capacityUsed: 4300, capacityTotal: 6000 },
  { id: 4, name: "Naypyidaw Returns Hub", image: "/images/ellipse-5.png", lastInspection: "18-06-2026", warehouseId: "WH-004", location: "Naypyidaw", manager: "Soe Yadanar", capacityUsed: 950, capacityTotal: 2000 },
  { id: 5, name: "Bago Main Store", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-005", location: "Bago", manager: "Kyaw Ko Htike", capacityUsed: 5600, capacityTotal: 7500 },
  { id: 6, name: "Mawlamyaing Distribution", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-006", location: "Mawlamyaing", manager: "Hein Thu Aung", capacityUsed: 3200, capacityTotal: 5000 },
  { id: 7, name: "Yangon Cold Store 2", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-007", location: "Yangon", manager: "Bhone Wint Kyaw", capacityUsed: 1800, capacityTotal: 2500 },
  { id: 8, name: "Mandalay Distribution", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-008", location: "Mandalay", manager: "Aung Than Lwin Oo", capacityUsed: 4900, capacityTotal: 6000 },
  { id: 9, name: "Yangon Returns Hub", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-009", location: "Yangon", manager: "Billy Jeans", capacityUsed: 700, capacityTotal: 1500 },
  { id: 10, name: "Taunggyi Main Store", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-010", location: "Taunggyi", manager: "John Doe", capacityUsed: 6100, capacityTotal: 8000 },
]

export const products: Product[] = [
  { id: 1, name: "Grand Royal Signature", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 2, name: "Grand Royal Smooth", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 3, name: "Grand Royal Black", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 4, name: "Grand Royal Special Reserve Double Cask", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 5, name: "Chingu Soju (Yogurt)", image: "/images/ellipse-6.png", category: "Non-Whiskey", quantity: "120 units", revenue: "$13,945" },
  { id: 6, name: "Chingu Soju (Peach)", image: "/images/ellipse-6.png", category: "Non-Whiskey", quantity: "120 units", revenue: "$13,945" },
]

export const activities: ActivityEntry[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: "Aung Htoo Pyae",
  role: "Manager of Yangon Central Warehouse",
  avatar: "/images/ellipse-9.png",
  description: "Approved a stock transfer request for WH-001 to WH-003.",
  date: "26 Jun 2026",
  time: "3:45 PM",
}))

export const inventoryData: InventoryMonth[] = [
  { month: "Jan", stockIn: 23000, stockOut: 17000, stockValue: 23500 },
  { month: "Feb", stockIn: 32000, stockOut: 21000, stockValue: 25000 },
  { month: "Mar", stockIn: 19000, stockOut: 28000, stockValue: 23500 },
  { month: "Apr", stockIn: 14000, stockOut: 20000, stockValue: 10500 },
  { month: "May", stockIn: 37000, stockOut: 28000, stockValue: 23000 },
  { month: "Jun", stockIn: 17000, stockOut: 22000, stockValue: 37534 },
  { month: "Jul", stockIn: 16000, stockOut: 28000, stockValue: 13500 },
  { month: "Aug", stockIn: 18000, stockOut: 24000, stockValue: 14000 },
  { month: "Sep", stockIn: 26000, stockOut: 19000, stockValue: 29500 },
]