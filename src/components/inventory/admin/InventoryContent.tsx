import {
    StatsCards,
    InventoryTable,
    MovementInbox,
    
} from "..";
import CreateMovementModal from "./CreateMovementModal";
import { getMovementTasks } from "@/services/inventory-service";


export default async function AdminInventoryContent() {
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
            <CreateMovementModal />

            {/* Warehouse selector later */}

            <MovementInbox tasks={tasks} />
            <InventoryTable />

        </div>

    );

}