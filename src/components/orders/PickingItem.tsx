"use client";

import type { OrderItem } from "@/types/orders";

type Props = {
  item: OrderItem;
  checked: boolean;
  onToggle: () => void;
};

export default function PickingItem({
  item,
  checked,
  onToggle,
}: Props) {
  return (
    <div className="rounded-lg border p-4">

      <div className="flex items-start justify-between">

        <div>

          <h4 className="font-semibold">
            {item.product}
          </h4>

          <p className="text-sm text-slate-500 mt-1">
            Required Quantity
          </p>

          <p className="font-medium">
            {item.quantity.toLocaleString()}
          </p>

          <p className="text-sm text-slate-500 mt-3">
            Pick From
          </p>

          {item.pickedFrom?.length ? (
            <div className="space-y-0.5">
              {item.pickedFrom.map((pick) => (
                <p key={pick.shelf} className="font-medium">
                  {pick.shelf} ({pick.quantity.toLocaleString()})
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not assigned</p>
          )}

          <p className="text-sm text-slate-500 mt-3">
            Destination
          </p>

          <p className="font-medium">
            Shipping Bay
          </p>

        </div>

        <label className="flex items-center gap-2 cursor-pointer">

          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-5 w-5"
          />

          <span className="text-sm font-medium">
            Confirm moved
          </span>

        </label>

      </div>

    </div>
  );
}