import {
    StatsCards,
    InventoryTable,
    MovementInbox,
    
} from "..";
import CreateMovementModal from "../CreateMovementModal";
import { getMovementTasks } from "@/services/inventory-service";
import WarehouseSelector from "./WarehouseSelector";
import { inventory } from "@/data/inventory-data";


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
            <div className="flex flex-wrap items-center justify-between gap-4">

                <CreateMovementModal inventory={inventory} />
                <WarehouseSelector /> 

            </div>
            

            <MovementInbox tasks={tasks} />
            <InventoryTable />
            {/* Can add view history later for all roles*/}

        </div>

    );

}