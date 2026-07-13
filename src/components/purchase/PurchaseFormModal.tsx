"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  PurchaseItem,
  PurchaseOrder,
  PurchaseStatus,
} from "@/types/purchases";

type Props = {
  purchase: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
  onSave: (purchase: PurchaseOrder) => void;
};

const statuses: PurchaseStatus[] = [
  "pending",
  "completed",
  "cancelled",
];

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function PurchaseFormModal({
  purchase,
  open,
  onClose,
  onSave,
}: Props) {
  const [supplier, setSupplier] = useState(purchase?.supplier ?? "");
  const [date, setDate] = useState(
    purchase?.date ?? getTodayDate()
  );
  const [status, setStatus] = useState<PurchaseStatus>(
    purchase?.status ?? "pending"
  );
  const [total, setTotal] = useState(purchase?.total ?? 0);
  const [items, setItems] = useState<PurchaseItem[]>(
    purchase?.items ?? [{ product: "", quantity: 0 }]
  );

  if (!open) return null;

  const isEditing = Boolean(purchase);

  const updateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      { product: "", quantity: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSave = () => {
    const cleanedSupplier = supplier.trim();

    const validItems = items
      .map((item) => ({
        product: item.product.trim(),
        quantity: item.quantity,
      }))
      .filter(
        (item) =>
          item.product.length > 0 && item.quantity > 0
      );

    if (!cleanedSupplier) {
      alert("Please enter a supplier name.");
      return;
    }

    if (!date) {
      alert("Please select a purchase date.");
      return;
    }

    if (validItems.length === 0) {
      alert("Please add at least one valid product.");
      return;
    }

    if (total < 0) {
      alert("Total amount cannot be negative.");
      return;
    }

    const savedPurchase: PurchaseOrder = {
      id: purchase?.id ?? `PO-${Date.now()}`,
      supplier: cleanedSupplier,
      items: validItems,
      total,
      status,
      date,
    };

    onSave(savedPurchase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? "Edit Purchase" : "New Purchase"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Close purchase form"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="purchase-supplier"
              className="text-sm text-muted-foreground"
            >
              Supplier
            </label>

            <input
              id="purchase-supplier"
              value={supplier}
              onChange={(event) =>
                setSupplier(event.target.value)
              }
              placeholder="Supplier name"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label
              htmlFor="purchase-date"
              className="text-sm text-muted-foreground"
            >
              Purchase Date
            </label>

            <input
              id="purchase-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label
              htmlFor="purchase-status"
              className="text-sm text-muted-foreground"
            >
              Status
            </label>

            <select
              id="purchase-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as PurchaseStatus
                )
              }
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {statuses.map((purchaseStatus) => (
                <option
                  key={purchaseStatus}
                  value={purchaseStatus}
                >
                  {purchaseStatus.charAt(0).toUpperCase() +
                    purchaseStatus.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="purchase-total"
              className="text-sm text-muted-foreground"
            >
              Total Amount
            </label>

            <input
              id="purchase-total"
              type="number"
              min="0"
              value={total}
              onChange={(event) =>
                setTotal(Number(event.target.value))
              }
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Products
            </h3>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_140px_40px] gap-3"
              >
                <input
                  value={item.product}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "product",
                      event.target.value
                    )
                  }
                  placeholder="Product name"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "quantity",
                      Number(event.target.value)
                    )
                  }
                  placeholder="Qty"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="flex items-center justify-center rounded-lg hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Remove product ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

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
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Save Purchase
          </button>
        </div>
      </div>
    </div>
  );
}