"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  PurchaseOrder,
  PurchaseStatus,
} from "@/types/purchases";

type FormItem = {
  product: string;
  quantity: number;
  unitPrice: number;
};

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
  const [error, setError] = useState<string | null>(null);
  // unitPrice doesn't exist on the persisted PurchaseItem (no per-line price
  // is stored anywhere yet -- see ISSUES.md), so editing an existing
  // purchase always starts each row's price at 0 and total recomputes from there.
  const [items, setItems] = useState<FormItem[]>(
    purchase?.items.map((item) => ({ ...item, unitPrice: 0 })) ?? [
      { product: "", quantity: 0, unitPrice: 0 },
    ]
  );

  // Derived, not typed -- must always equal what the rows below add up to.
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  if (!open) return null;

  const isEditing = Boolean(purchase);

  const updateItem = (
    index: number,
    field: keyof FormItem,
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
      { product: "", quantity: 0, unitPrice: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSave = () => {
    setError(null);
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
      setError("Please enter a supplier name.");
      return;
    }

    if (!date) {
      setError("Please select a purchase date.");
      return;
    }

    if (validItems.length === 0) {
      setError("Please add at least one valid product.");
      return;
    }

    if (total < 0) {
      setError("Total amount cannot be negative.");
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

            {/* Derived from the rows below (qty × unit price) -- never typed
                directly, so it can't drift from what the purchase actually contains. */}
            <input
              id="purchase-total"
              type="text"
              readOnly
              value={total.toFixed(2)}
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
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

          <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_90px_110px_40px] gap-3 px-0.5 text-xs text-muted-foreground">
            <span>Product</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span />
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_90px_110px_40px] gap-3"
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
                  aria-label={`Product ${index + 1} name`}
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
                  aria-label={`Product ${index + 1} quantity`}
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "unitPrice",
                      Number(event.target.value)
                    )
                  }
                  placeholder="0.00"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  aria-label={`Product ${index + 1} unit price`}
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

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

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