"use client";

import { useMemo, useState } from "react";

import type { Order } from "@/types/orders";

import PickingItem from "./PickingItem";

type Props = {
  order: Order;
  onComplete: () => void;
};

export default function PickingChecklist({
  order,
  onComplete,
}: Props) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const allCompleted = useMemo(() => {
    return order.items.every(
      (item) => completed[item.product]
    );
  }, [completed, order.items]);

  function toggle(product: string) {
    setCompleted((current) => ({
      ...current,
      [product]: !current[product],
    }));
  }

  function completePicking() {
    alert("Order marked as completed and shipped.");
    onComplete();

    // Later, once inventory has a real backend:
    // updateOrderStatus(order.id, "completed")
    // (inventory was already deducted when the order moved to "picking")
  }

  return (
    <div className="rounded-xl border p-5">

      <div className="mb-5">

        <h3 className="font-semibold">
          Picking Checklist
        </h3>

        <p className="text-sm text-slate-500">
          Move every item from its shelf to the Shipping Bay.
        </p>

      </div>

      <div className="space-y-4">

        {order.items.map((item) => (

          <PickingItem
            key={item.product}
            item={item}
            checked={completed[item.product] ?? false}
            onToggle={() => toggle(item.product)}
          />

        ))}

      </div>

      <div className="mt-6 flex justify-end">

        <button
          disabled={!allCompleted}
          onClick={completePicking}
          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50"
        >
          Complete Picking
        </button>

      </div>

    </div>
  );
}