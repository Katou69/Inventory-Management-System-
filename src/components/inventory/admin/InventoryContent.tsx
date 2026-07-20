import {
    StatsCards,
    InventoryTable,
    MovementInbox,
} from "..";
import CreateMovementModal from "../CreateMovementModal";
import { getMovementTasks, getInventory } from "@/services/inventory-service";
import WarehouseSelector from "./WarehouseSelector";

type Props = {
    warehouseId: number;
};

export default async function AdminInventoryContent({ warehouseId }: Props) {
    const [tasks, inventory] = await Promise.all([
        getMovementTasks(warehouseId),
        getInventory(warehouseId),
    ]);

    return (

        <div className="flex flex-col gap-[30px]">

            <div>

                <h1 className="text-2xl font-bold">
                    Inventory
                </h1>

                <p className="text-muted-foreground">
                    Manage inventory across all warehouses
                </p>

            </div>

            <StatsCards warehouseId={warehouseId} />
            <div className="flex flex-wrap items-center justify-between gap-4">

                <CreateMovementModal inventory={inventory} warehouseId={warehouseId} />
                <WarehouseSelector />

            </div>


            <MovementInbox tasks={tasks} />
            <InventoryTable warehouseId={warehouseId} />
            {/* Can add view history later for all roles*/}

        </div>

    );

}
