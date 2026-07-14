import { AdminOrderContent } from "@/components/orders/admin";
import { StaffOrderContent } from "@/components/orders/staff";
import { ManagerOrderContent } from "@/components/orders/manager";
import { requireUser } from "@/lib/auth/require-user";

export default async function OrdersPage() {
  const { role } = await requireUser();

  switch (role) {
    case "admin":
      return <AdminOrderContent />;

    case "manager":
      return <ManagerOrderContent />;

    case "staff":
      return <StaffOrderContent />;

    default:
      return null;
  }
}
