import { getOrders } from "@/services/orders-service";
import OrdersTableClient from "./OrdersTableClient";
import type { Role } from "./OrderActionsMenu";

type Props = {
  role: Role;
};

export default async function OrdersTable({ role }: Props) {
  const orders = await getOrders();

  return <OrdersTableClient orders={orders} role={role} />;
}