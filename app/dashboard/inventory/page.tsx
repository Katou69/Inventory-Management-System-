import {AdminInventoryContent,} from "@/components/inventory/admin";

// temporary
const role: string = "admin";

export default function InventoryPage() {
  switch (role) {
    case "admin":
      return <AdminInventoryContent />;

    case "manager":
      // return <ManagerInventoryContent />;
      return null;

    case "staff":
      // return <StaffInventoryContent />;
      return null;

    default:
      return null;
  }
}