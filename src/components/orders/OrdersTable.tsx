import { getOrders } from "@/services/orders-service";
import OrdersTableClient from "./OrdersTableClient";

export default async function OrdersTable() {
  const orders = await getOrders();

  return <OrdersTableClient orders={orders} />;
}