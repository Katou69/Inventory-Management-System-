import {
    StatsCards,
    InventoryTable,
    MovementInbox,
    
} from "..";

import { getMovementTasks } from "@/services/inventory-service";


export default async function StaffInventoryContent() {
    const tasks = await getMovementTasks();
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

            <StatsCards />

            <MovementInbox tasks={tasks} />

            <InventoryTable /> 
            {/* Need to remove the edit product for staff later*/}

        </div>

    );

}