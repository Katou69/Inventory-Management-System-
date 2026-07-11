"use client";

import { Order } from "@/types/orders";
import { X } from "lucide-react";

type Props = {
  order: Order | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteOrderModal({ order, onClose, onConfirm }: Props) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Delete Order
          </h2>

          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Are you sure you want to delete order{" "}
          <span className="font-semibold">{order.id}</span>?
        </p>

        <p className="text-sm text-slate-500 mt-2">
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}