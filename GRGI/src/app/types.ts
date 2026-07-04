export type Role = "admin" | "manager" | "staff";
export type Page = "dashboard" | "inventory" | "orders" | "purchase" | "users" | "settings";
export type Theme = "light" | "dark";

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: Role;
  warehouse: string;
  status: "active" | "inactive";
  joinedDate: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  stock: number;
  unit: string;
  minStock: number;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  lastUpdated: string;
}

export interface Order {
  id: string;
  customer: string;
  items: string;
  warehouse: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: string;
  warehouse: string;
  status: "draft" | "submitted" | "approved" | "received";
  date: string;
  total: number;
}
