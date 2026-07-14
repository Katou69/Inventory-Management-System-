import { AdminPurchaseContent } from "@/components/purchase/admin";
import { StaffPurchaseContent } from "@/components/purchase/staff";
import { ManagerPurchaseContent } from "@/components/purchase/manager";
import { requireUser } from "@/lib/auth/require-user";

export default async function PurchasePage() {
  const { role } = await requireUser();

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
