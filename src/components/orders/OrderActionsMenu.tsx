"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Order } from "@/types/orders";

type Props = {
  order: Order;
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
};

export default function OrderActionsMenu({
  order,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="hover:bg-slate-100 p-2 rounded-lg"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-40 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          <button
            onClick={() => {
              onView(order);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>

          <button
            onClick={() => {
              onEdit(order);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" />
            Edit Order
          </button>

          <button
            onClick={() => {
              onDelete(order);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Order
          </button>
        </div>
      )}
    </div>
  );
}