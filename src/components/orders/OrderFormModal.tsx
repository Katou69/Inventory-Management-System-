"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/types/orders";
import { Plus, Trash2, X } from "lucide-react";

type FormItem = {
  product: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
};

const statuses: OrderStatus[] = [
  "pending",
  "completed",
  "cancelled",
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function OrderFormModal({
  order,
  open,
  onClose,
  onSave,
}: Props) {
  const [customer, setCustomer] = useState(order?.customer ?? "");

  const [date, setDate] = useState(
    order?.date ?? getTodayDate()
  );

  const [status, setStatus] = useState<OrderStatus>(
    order?.status ?? "pending"
  );

  const [error, setError] = useState<string | null>(null);

  // unitPrice doesn't exist on the persisted OrderItem (no per-line price is
  // stored anywhere yet -- see ISSUES.md), so editing an existing order
  // always starts each row's price at 0 and total recomputes from there.
  const [items, setItems] = useState<FormItem[]>(
    order?.items.map((item) => ({ ...item, unitPrice: 0 })) ?? [
      {
        product: "",
        quantity: 0,
        unitPrice: 0,
      },
    ]
  );

  // Total Amount is derived, not typed -- it must always equal what the
  // rows below actually add up to, never a value someone entered separately.
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  if (!open) return null;

  const isEditing = Boolean(order);

  const updateItem = (
    index: number,
    field: keyof FormItem,
    value: string | number
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        product: "",
        quantity: 0,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSave = () => {
    setError(null);
    const cleanedCustomer = customer.trim();

    const validItems = items
      .map((item) => ({
        product: item.product.trim(),
        quantity: item.quantity,
      }))
      .filter(
        (item) =>
          item.product.length > 0 &&
          item.quantity > 0
      );

    if (!cleanedCustomer) {
      setError("Please enter a customer name.");
      return;
    }

    if (!date) {
      setError("Please select an order date.");
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

    const savedOrder: Order = {
      id: order?.id ?? `ORD-${Date.now()}`,
      customer: cleanedCustomer,
      items: validItems,
      total,
      status,
      date,
    };

    onSave(savedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? "Edit Order" : "New Order"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Close order form"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="order-customer"
              className="text-sm text-muted-foreground"
            >
              Customer
            </label>

            <input
              id="order-customer"
              value={customer}
              onChange={(event) =>
                setCustomer(event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label
              htmlFor="order-date"
              className="text-sm text-muted-foreground"
            >
              Order Date
            </label>

            <input
              id="order-date"
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
              htmlFor="order-status"
              className="text-sm text-muted-foreground"
            >
              Status
            </label>

            <select
              id="order-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as OrderStatus
                )
              }
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {statuses.map((orderStatus) => (
                <option
                  key={orderStatus}
                  value={orderStatus}
                >
                  {orderStatus
                    .charAt(0)
                    .toUpperCase() +
                    orderStatus.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="order-total"
              className="text-sm text-muted-foreground"
            >
              Total Amount
            </label>

            {/* Derived from the rows below (qty × unit price) -- never typed
                directly, so it can't drift from what the order actually contains. */}
            <input
              id="order-total"
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
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Product name"
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
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Qty"
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
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="0.00"
                  aria-label={`Product ${index + 1} unit price`}
                />

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40"
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
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}