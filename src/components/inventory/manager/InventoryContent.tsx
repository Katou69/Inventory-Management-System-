import { getMovementTasks, getInventory } from "@/services/inventory-service";
import {
    StatsCards,
    InventoryTable,
    MovementInbox,
} from "..";
import CreateMovementModal from "../CreateMovementModal";
import CreateProductModal from "../CreateProductModal";

type Props = {
    warehouseId: number;
};

export default async function ManagerInventoryContent({ warehouseId }: Props) {
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
            <div className="flex flex-wrap items-center gap-3">
                <CreateMovementModal inventory={inventory} warehouseId={warehouseId} />
                <CreateProductModal warehouseId={warehouseId} />
            </div>

            <MovementInbox tasks={tasks} />
            <InventoryTable warehouseId={warehouseId} />
            {/* Can add view history later for all roles*/}

        </div>

    );

}
