"use client";

import { X } from "lucide-react";
import { PurchaseOrder } from "@/types/purchases";

type Props = {
  purchase: PurchaseOrder | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelPurchaseModal({ purchase, onClose, onConfirm }: Props) {
  if (!purchase) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Cancel Purchase</h2>

          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel purchase{" "}
          <span className="font-semibold text-foreground">{purchase.id}</span>?
        </p>

        <p className="text-sm text-muted-foreground mt-2">
          {purchase.status === "receiving"
            ? "Items have already been received into the Receiving Bay. Cancelling will not automatically remove or return them."
            : "The supplier will need a new purchase order if these products are still needed."}
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            Keep Purchase
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Cancel Purchase
          </button>
        </div>
      </div>
    </div>
  );
}