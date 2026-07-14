import { AdminInventoryContent } from "@/components/inventory/admin";
import { StaffInventoryContent } from "@/components/inventory/staff";
import { ManagerInventoryContent } from "@/components/inventory/manager";
import { requireUser } from "@/lib/auth/require-user";

export default async function InventoryPage() {
  const { role } = await requireUser();

  switch (role) {
    case "admin":
      return <AdminInventoryContent />;

    case "manager":
      return <ManagerInventoryContent />;

    case "staff":
      return <StaffInventoryContent />;

    default:
      return null;
  }
}
