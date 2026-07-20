// Save as: app/dashboard/inventory/page.tsx
import { AdminInventoryContent } from "@/components/inventory/admin";
import { StaffInventoryContent } from "@/components/inventory/staff";
import { ManagerInventoryContent } from "@/components/inventory/manager";
import { requireUser } from "@/lib/auth/require-user";

type Props = {
  searchParams: Promise<{ warehouse?: string }>;
};

export default async function InventoryPage({ searchParams }: Props) {
  const user = await requireUser();
  const { warehouse } = await searchParams;

  // Admin: pick any warehouse via the dropdown (URL-driven), default to 1.
  // Manager/staff: always pinned to their own assignment, URL is ignored.
  const warehouseId =
    user.role === "admin"
      ? Number(warehouse ?? 1)
      : Number(user.warehouseId); // never "all" for non-admins in practice

  switch (user.role) {
    case "admin":
      return <AdminInventoryContent warehouseId={warehouseId} />;

    case "manager":
      return <ManagerInventoryContent warehouseId={warehouseId} />;

    case "staff":
      return <StaffInventoryContent warehouseId={warehouseId} />;

    default:
      return null;
  }
}
