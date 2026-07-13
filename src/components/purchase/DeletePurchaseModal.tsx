"use client";

import { X } from "lucide-react";
import { PurchaseOrder } from "@/types/purchases";

type Props = {
  purchase: PurchaseOrder | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeletePurchaseModal({
  purchase,
  onClose,
  onConfirm,
}: Props) {
  if (!purchase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Delete Purchase
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Close delete confirmation"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete purchase{" "}
          <span className="font-semibold text-foreground">
            {purchase.id}
          </span>
          ?
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}