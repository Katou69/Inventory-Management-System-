// Save as: src/components/inventory/InventoryTable.tsx
import { getInventory } from "@/services/inventory-service";
import InventoryTableContent from "./InventoryTableContent";

type Props = {
  warehouseId: number;
  canEdit?: boolean;
};

export default async function InventoryTable({ warehouseId, canEdit = true }: Props) {
  const inventory = await getInventory(warehouseId);

  return <InventoryTableContent inventory={inventory} warehouseId={warehouseId} canEdit={canEdit} />;
}
