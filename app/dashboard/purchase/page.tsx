import { AdminPurchaseContent } from "@/components/purchase/admin";
import { StaffPurchaseContent } from "@/components/purchase/staff";
import { ManagerPurchaseContent } from "@/components/purchase/manager";
import { role } from "../page";

export default function PurchasePage() {
  switch (role) {
    case "admin":
      return <AdminPurchaseContent />;

    case "manager":
      return <ManagerPurchaseContent />;

    case "staff":
      return <StaffPurchaseContent />;

    default:
      return null;
  }
}