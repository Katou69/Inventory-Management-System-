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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Cancel Order</h2>

          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Are you sure you want to cancel order{" "}
          <span className="font-semibold">{order.id}</span>?
        </p>

        <p className="text-sm text-slate-500 mt-2">
          {order.status === "picking"
            ? "This order already has stock allocated from shelves. Cancelling will not automatically return that stock to inventory."
            : "The customer will need to place a new order if they still want these products."}
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
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