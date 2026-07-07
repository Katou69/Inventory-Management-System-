import { getInventory } from "@/services/inventory-service";
import InventoryTableContent from "./InventoryTableContent";

export default async function InventoryTable() {
  const inventory = await getInventory();

  return <InventoryTableContent inventory={inventory} />;
}