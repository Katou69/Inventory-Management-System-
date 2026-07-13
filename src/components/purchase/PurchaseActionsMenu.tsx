"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PurchaseOrder } from "@/types/purchases";

type Props = {
  purchase: PurchaseOrder;
  onView: (purchase: PurchaseOrder) => void;
  onEdit: (purchase: PurchaseOrder) => void;
  onDelete: (purchase: PurchaseOrder) => void;
};

export default function PurchaseActionsMenu({
  purchase,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg p-2 transition hover:bg-accent"
        aria-label={`Open actions for ${purchase.id}`}
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-40 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onView(purchase);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>

          <button
            type="button"
            onClick={() => {
              onEdit(purchase);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
            Edit Purchase
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(purchase);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Purchase
          </button>
        </div>
      )}
    </div>
  );
}