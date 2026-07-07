export type Role = "admin" | "manager" | "staff";
export type Page = "dashboard" | "inventory" | "orders" | "purchase" | "users" | "settings";
export type Theme = "light" | "dark";

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: Role;
  warehouseId: number | "all";
  status: "active" | "inactive";
  joinedDate: string;
}
