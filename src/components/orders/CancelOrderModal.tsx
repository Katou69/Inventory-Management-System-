"use client";

import { Order } from "@/types/orders";
import { X } from "lucide-react";

type Props = {
  order: Order | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelOrderModal({ order, onClose, onConfirm }: Props) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Cancel Order</h2>

          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel order{" "}
          <span className="font-semibold text-foreground">{order.id}</span>?
        </p>

        <p className="text-sm text-muted-foreground mt-2">
          {order.status === "picking"
            ? "This order already has stock allocated from shelves. Cancelling will not automatically return that stock to inventory."
            : "The customer will need to place a new order if they still want these products."}
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            Keep Order
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}