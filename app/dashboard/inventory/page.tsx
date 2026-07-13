import {AdminInventoryContent} from "@/components/inventory/admin";
import {StaffInventoryContent} from "@/components/inventory/staff";
import {ManagerInventoryContent} from "@/components/inventory/manager";
import {role} from "../page"; // import the role from dashboard/page.tsx (need to remove when backend is implemented)
// temporary (change this later to get the role from auth/session)
// const role: string = "admin";

export default function InventoryPage() {
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