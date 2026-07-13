import { getPurchaseOrders } from "@/services/purchase-service";
import PurchaseTableClient from "./PurchaseTableClient";

export default async function PurchaseTable() {
  const purchases = await getPurchaseOrders();

  return <PurchaseTableClient purchases={purchases} />;
}