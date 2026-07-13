"use client";

import type { PurchaseItem } from "@/types/purchases";

type Props = {
  item: PurchaseItem;
  checked: boolean;
  onToggle: () => void;
};

export default function ReceivingItem({ item, checked, onToggle }: Props) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-foreground">{item.product}</h4>

          <p className="text-sm text-muted-foreground mt-1">Expected Quantity</p>

          <p className="font-medium text-foreground">
            {item.quantity.toLocaleString()}
          </p>

          <p className="text-sm text-muted-foreground mt-3">Destination</p>

          <p className="font-medium text-foreground">Receiving Bay</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-5 w-5"
          />

          <span className="text-sm font-medium text-foreground">
            Confirm received
          </span>
        </label>
      </div>
    </div>
  );
}