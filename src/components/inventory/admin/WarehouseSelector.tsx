"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { getWarehouses, WarehouseOption } from "@/services/inventory-service";

export default function WarehouseSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const selected = searchParams.get("warehouse") ?? "";

  useEffect(() => {
    getWarehouses().then(setWarehouses).catch(() => setWarehouses([]));
  }, []);

  // Once warehouses load, default the URL to the first one if nothing's selected yet.
  useEffect(() => {
    if (!selected && warehouses.length > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("warehouse", String(warehouses[0].id));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [warehouses, selected, pathname, router, searchParams]);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("warehouse", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
      value={selected}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="" disabled>
        Select Warehouse
      </option>

      {warehouses.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}
