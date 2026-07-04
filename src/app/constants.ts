import { InventoryItem, Order, PurchaseOrder, UserType } from "./types";

export const WAREHOUSES = ["North Depot", "South Hub", "East Storage", "West Facility"];
export const CATEGORIES = [
  "Grand Royal Black",
  "Grand Royal Signature",
  "Grand Royal Smooth",
  "Grand Royal Special Reserve Whisky Sherry Cask",
  "Grand Royal Special Reserve Whisky",
  "Glan Master Double Smooth",
  "Glan Master Finest",
  "Royal Club Green"
];

export const MOCK_USERS: UserType[] = [
  { id: "u1", name: "Morgan Lee", email: "morgan.lee@grandroyal.com", role: "admin", warehouse: "All", status: "active", joinedDate: "Jan 10, 2023" },
  { id: "u2", name: "Jordan Blake", email: "j.blake@grandroyal.com", role: "manager", warehouse: "North Depot", status: "active", joinedDate: "Mar 15, 2023" },
  { id: "u3", name: "Casey Rowan", email: "c.rowan@grandroyal.com", role: "manager", warehouse: "South Hub", status: "active", joinedDate: "May 20, 2023" },
  { id: "u4", name: "Riley Quinn", email: "r.quinn@grandroyal.com", role: "staff", warehouse: "North Depot", status: "active", joinedDate: "Jul 1, 2023" },
  { id: "u5", name: "Drew Santos", email: "d.santos@grandroyal.com", role: "staff", warehouse: "East Storage", status: "active", joinedDate: "Aug 12, 2023" },
  { id: "u6", name: "Avery Kim", email: "a.kim@grandroyal.com", role: "staff", warehouse: "South Hub", status: "inactive", joinedDate: "Sep 5, 2023" },
  { id: "u7", name: "Sam Park", email: "s.park@grandroyal.com", role: "manager", warehouse: "West Facility", status: "active", joinedDate: "Nov 20, 2023" },
  { id: "u8", name: "Quinn Torres", email: "q.torres@grandroyal.com", role: "staff", warehouse: "West Facility", status: "active", joinedDate: "Jan 8, 2024" },
  { id: "u9", name: "Alex Rivera", email: "a.rivera@grandroyal.com", role: "staff", warehouse: "East Storage", status: "active", joinedDate: "Feb 14, 2024" },
  { id: "u10", name: "Jamie Chen", email: "j.chen@grandroyal.com", role: "manager", warehouse: "East Storage", status: "active", joinedDate: "Mar 1, 2024" },
];

export const MOCK_INVENTORY_BASE: InventoryItem[] = [
  { id: "i1", sku: "BEV-001", name: "Pale Ale 330ml", category: "Beer", warehouse: "North Depot", stock: 1250, unit: "Cases", minStock: 200, price: 18.5, status: "in-stock", lastUpdated: "Jun 15, 2024" },
  { id: "i2", sku: "BEV-002", name: "Pinot Noir 750ml", category: "Wine", warehouse: "South Hub", stock: 85, unit: "Cases", minStock: 100, price: 142.0, status: "low-stock", lastUpdated: "Jun 14, 2024" },
  { id: "i3", sku: "BEV-003", name: "Premium Vodka 1L", category: "Spirits", warehouse: "East Storage", stock: 0, unit: "Cases", minStock: 50, price: 280.0, status: "out-of-stock", lastUpdated: "Jun 13, 2024" },
  { id: "i4", sku: "BEV-004", name: "Cola Classic 2L", category: "Soft Drinks", warehouse: "North Depot", stock: 3400, unit: "Cases", minStock: 500, price: 12.0, status: "in-stock", lastUpdated: "Jun 15, 2024" },
  { id: "i5", sku: "BEV-005", name: "Spring Water 500ml", category: "Water", warehouse: "West Facility", stock: 6200, unit: "Cases", minStock: 1000, price: 6.8, status: "in-stock", lastUpdated: "Jun 15, 2024" },
  { id: "i6", sku: "BEV-006", name: "Orange Juice 1L", category: "Juice", warehouse: "South Hub", stock: 420, unit: "Cases", minStock: 150, price: 22.4, status: "in-stock", lastUpdated: "Jun 14, 2024" },
  { id: "i7", sku: "BEV-007", name: "Dark Lager 500ml", category: "Beer", warehouse: "East Storage", stock: 78, unit: "Cases", minStock: 100, price: 24.0, status: "low-stock", lastUpdated: "Jun 12, 2024" },
  { id: "i8", sku: "BEV-008", name: "Champagne 750ml", category: "Wine", warehouse: "West Facility", stock: 310, unit: "Cases", minStock: 50, price: 210.0, status: "in-stock", lastUpdated: "Jun 11, 2024" },
  { id: "i9", sku: "BEV-009", name: "Single Malt Whisky", category: "Spirits", warehouse: "North Depot", stock: 42, unit: "Cases", minStock: 60, price: 580.0, status: "low-stock", lastUpdated: "Jun 10, 2024" },
  { id: "i10", sku: "BEV-010", name: "Energy Drink 250ml", category: "Soft Drinks", warehouse: "West Facility", stock: 1890, unit: "Cases", minStock: 300, price: 28.0, status: "in-stock", lastUpdated: "Jun 15, 2024" },
  { id: "i11", sku: "BEV-011", name: "Sparkling Water 330ml", category: "Water", warehouse: "East Storage", stock: 2100, unit: "Cases", minStock: 400, price: 9.5, status: "in-stock", lastUpdated: "Jun 14, 2024" },
  { id: "i12", sku: "BEV-012", name: "Apple Juice 200ml", category: "Juice", warehouse: "North Depot", stock: 890, unit: "Cases", minStock: 200, price: 14.2, status: "in-stock", lastUpdated: "Jun 13, 2024" },
];

export const MOCK_ORDERS: Order[] = [
  { id: "ORD-2847", customer: "The Grand Hotel", items: "Pale Ale × 50, Cola Classic × 30", warehouse: "North Depot", status: "delivered", date: "Jun 14, 2024", total: 1285 },
  { id: "ORD-2848", customer: "City Bar & Grill", items: "Pinot Noir × 20, Champagne × 10", warehouse: "South Hub", status: "shipped", date: "Jun 15, 2024", total: 4940 },
  { id: "ORD-2849", customer: "Metro Supermarket", items: "Spring Water 500ml × 200", warehouse: "West Facility", status: "processing", date: "Jun 15, 2024", total: 1360 },
  { id: "ORD-2850", customer: "Riverside Restaurant", items: "Orange Juice × 40, Apple Juice × 60", warehouse: "South Hub", status: "pending", date: "Jun 15, 2024", total: 1748 },
  { id: "ORD-2851", customer: "Downtown Café", items: "Energy Drink × 100", warehouse: "West Facility", status: "pending", date: "Jun 15, 2024", total: 2800 },
  { id: "ORD-2852", customer: "The Lounge Club", items: "Single Malt Whisky × 5", warehouse: "North Depot", status: "cancelled", date: "Jun 13, 2024", total: 2900 },
  { id: "ORD-2853", customer: "Park Inn Hotel", items: "Dark Lager × 30, Pale Ale × 20", warehouse: "East Storage", status: "delivered", date: "Jun 12, 2024", total: 1090 },
  { id: "ORD-2854", customer: "Green Grocers Co.", items: "Spring Water × 500, Sparkling Water × 200", warehouse: "West Facility", status: "shipped", date: "Jun 15, 2024", total: 5290 },
];

export const MOCK_PURCHASES: PurchaseOrder[] = [
  { id: "PO-5021", supplier: "Brew Masters Inc.", items: "Pale Ale 330ml × 500 cases", warehouse: "North Depot", status: "received", date: "Jun 10, 2024", total: 9250 },
  { id: "PO-5022", supplier: "Valley Vines", items: "Pinot Noir 750ml × 200 cases", warehouse: "South Hub", status: "approved", date: "Jun 12, 2024", total: 28400 },
  { id: "PO-5023", supplier: "Global Spirits Co.", items: "Premium Vodka 1L × 100 cases", warehouse: "East Storage", status: "submitted", date: "Jun 14, 2024", total: 28000 },
  { id: "PO-5024", supplier: "City Sodas", items: "Cola Classic × 1000 + Energy Drink × 500", warehouse: "North Depot", status: "received", date: "Jun 8, 2024", total: 26000 },
  { id: "PO-5025", supplier: "Fresh Waters Ltd.", items: "Spring Water 500ml × 2000 cases", warehouse: "West Facility", status: "draft", date: "Jun 15, 2024", total: 13600 },
  { id: "PO-5026", supplier: "Brew Masters Inc.", items: "Dark Lager 500ml × 300 cases", warehouse: "East Storage", status: "approved", date: "Jun 13, 2024", total: 7200 },
];

export const MONTHLY_FLOW = [
  { month: "Jan", inflow: 45200, outflow: 38400 },
  { month: "Feb", inflow: 38900, outflow: 42100 },
  { month: "Mar", inflow: 52400, outflow: 48700 },
  { month: "Apr", inflow: 61800, outflow: 55200 },
  { month: "May", inflow: 58300, outflow: 62800 },
  { month: "Jun", inflow: 71200, outflow: 58900 },
];

export const WAREHOUSE_STATS = [
  { name: "North Depot", capacity: 5000, used: 3582, manager: "Jordan Blake" },
  { name: "South Hub", capacity: 4000, used: 2815, manager: "Casey Rowan" },
  { name: "East Storage", capacity: 6000, used: 2178, manager: "Jamie Chen" },
  { name: "West Facility", capacity: 8000, used: 8400, manager: "Sam Park" },
];

export const CATEGORY_BARS = [
  { name: "Beer", value: 1328 },
  { name: "Wine", value: 395 },
  { name: "Spirits", value: 42 },
  { name: "Soft Drinks", value: 5290 },
  { name: "Water", value: 8300 },
  { name: "Juice", value: 1310 },
];

export const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  "in-stock": { label: "In Stock", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "low-stock": { label: "Low Stock", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  "out-of-stock": { label: "Out of Stock", cls: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
  "pending": { label: "Pending", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  "processing": { label: "Processing", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
  "shipped": { label: "Shipped", cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" },
  "delivered": { label: "Delivered", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "cancelled": { label: "Cancelled", cls: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
  "draft": { label: "Draft", cls: "bg-secondary text-muted-foreground" },
  "submitted": { label: "Submitted", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
  "approved": { label: "Approved", cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" },
  "received": { label: "Received", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "active": { label: "Active", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "inactive": { label: "Inactive", cls: "bg-secondary text-muted-foreground" },
  "admin": { label: "Admin", cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" },
  "manager": { label: "Manager", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
  "staff": { label: "Staff", cls: "bg-secondary text-muted-foreground" },
};
