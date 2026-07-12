import { AdminOrderContent } from "@/components/orders/admin";
import { StaffOrderContent } from "@/components/orders/staff";
import { role } from "../page";
import { ManagerOrderContent } from "@/components/orders/manager";

export default function OrdersPage() {
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