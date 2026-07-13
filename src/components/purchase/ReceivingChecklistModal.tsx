"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { PurchaseOrder } from "@/types/purchases";
import ReceivingItem from "./ReceivingItem";

type Props = {
  open: boolean;
  purchase: PurchaseOrder | null;
  onClose: () => void;
  onConfirm: (purchase: PurchaseOrder) => void;
};

export default function ReceivingChecklistModal({
  open,
  purchase,
  onClose,
  onConfirm,
}: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!open || !purchase) return null;

  const allChecked = purchase.items.every((item) => checked[item.product]);

  const toggle = (product: string) => {
    setChecked((current) => ({
      ...current,
      [product]: !current[product],
    }));
  };

  const handleConfirm = () => {
    if (!allChecked) {
      alert("Please confirm every item has been received before continuing.");
      return;
    }

    onConfirm({ ...purchase, status: "receiving" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Receive Purchase Order
            </h2>
            <p className="text-sm text-muted-foreground">{purchase.id}</p>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Check off each product as it&apos;s counted and placed in the Receiving Bay.
          </p>

          {purchase.items.map((item) => (
            <ReceivingItem
              key={item.product}
              item={item}
              checked={checked[item.product] ?? false}
              onToggle={() => toggle(item.product)}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allChecked}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm All Received
          </button>
        </div>
      </div>
    </div>
  );
}