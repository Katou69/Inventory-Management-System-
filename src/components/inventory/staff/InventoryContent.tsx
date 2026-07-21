import {
    StatsCards,
    InventoryTable,
    MovementInbox,
} from "..";

import { getMovementTasks } from "@/services/inventory-service";

type Props = {
    warehouseId: number;
};

export default async function StaffInventoryContent({ warehouseId }: Props) {
    const tasks = await getMovementTasks(warehouseId);

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

            <MovementInbox tasks={tasks} />

            {/* canEdit=false hides "Edit Product" in the row menu for staff.
                Backend already blocks the PATCH for this role regardless. */}
            <InventoryTable warehouseId={warehouseId} canEdit={false} />

        </div>

    );

}
