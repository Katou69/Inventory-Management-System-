"use client";

export default function WarehouseSelector() {

    return (
        // Need to change these to a dropdown with warehouse options that fetches the warehouse data from backend later, now just hardcoded
        <select
            className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
            defaultValue=""
        >
            <option value="" disabled>
                Select Warehouse
            </option>

            <option value="1">
                Warehouse 1
            </option>

            <option value="2">
                Warehouse 2
            </option>

            <option value="3">
                Warehouse 3
            </option>

            <option value="4">
                Warehouse 4
            </option>

        </select>
    );
}