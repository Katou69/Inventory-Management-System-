import { getPurchaseOrders } from "@/services/purchase-service";
import PurchaseTableClient from "./PurchaseTableClient";
import type { Role } from "./PurchaseActionsMenu";

type Props = {
  role: Role;
};

export default async function PurchaseTable({ role }: Props) {
  const purchases = await getPurchaseOrders();

  return <PurchaseTableClient purchases={purchases} role={role} />;
}