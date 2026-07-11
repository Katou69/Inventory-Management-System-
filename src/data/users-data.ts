import { UserType } from "@/types/user";

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
  { id: "u1", name: "Admin User", email: "admin@grandroyal.com", role: "admin", warehouseId: "all", status: "active", joinedDate: "2023-01-10", loginAttempts: 0, lockoutUntil: null },
  { id: "u2", name: "Jordan Blake", email: "j.blake@grandroyal.com", role: "manager", warehouseId: 1, status: "active", joinedDate: "2023-03-15", loginAttempts: 0, lockoutUntil: null },
  { id: "u3", name: "Casey Rowan", email: "c.rowan@grandroyal.com", role: "manager", warehouseId: 2, status: "active", joinedDate: "2023-05-20", loginAttempts: 0, lockoutUntil: null },
  { id: "u4", name: "Riley Quinn", email: "r.quinn@grandroyal.com", role: "staff", warehouseId: 1, status: "active", joinedDate: "2023-07-01", loginAttempts: 0, lockoutUntil: null },
  { id: "u5", name: "Drew Santos", email: "d.santos@grandroyal.com", role: "staff", warehouseId: 3, status: "active", joinedDate: "2023-08-12", loginAttempts: 0, lockoutUntil: null },
  { id: "u6", name: "Avery Kim", email: "a.kim@grandroyal.com", role: "staff", warehouseId: 2, status: "inactive", joinedDate: "2023-09-05", loginAttempts: 0, lockoutUntil: null },
  { id: "u7", name: "Sam Park", email: "s.park@grandroyal.com", role: "manager", warehouseId: 4, status: "active", joinedDate: "2023-11-20", loginAttempts: 0, lockoutUntil: null },
  { id: "u8", name: "Quinn Torres", email: "q.torres@grandroyal.com", role: "staff", warehouseId: 4, status: "active", joinedDate: "2024-01-08", loginAttempts: 0, lockoutUntil: null },
  { id: "u9", name: "Alex Rivera", email: "a.rivera@grandroyal.com", role: "staff", warehouseId: 3, status: "active", joinedDate: "2024-02-14", loginAttempts: 0, lockoutUntil: null },
  { id: "u10", name: "Jamie Chen", email: "j.chen@grandroyal.com", role: "manager", warehouseId: 3, status: "active", joinedDate: "2024-03-01", loginAttempts: 0, lockoutUntil: null },
  { id: "u11", name: "Taylor Kim", email: "taylor.kim@grandroyal.com", role: "staff", warehouseId: 1, status: "pending", joinedDate: "2024-07-09", loginAttempts: 0, lockoutUntil: null },
];

export const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  "in-stock": { label: "In Stock", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "low-stock": { label: "Low Stock", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  "out-of-stock": { label: "Out of Stock", cls: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
  "pending": { label: "Pending", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  "processing": { label: "Processing", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
  "shipped": { label: "Shipped", cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" },
  "completed": { label: "Completed", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
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
