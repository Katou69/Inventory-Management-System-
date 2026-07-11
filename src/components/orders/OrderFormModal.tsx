"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/types/orders";
import { Plus, Trash2, X } from "lucide-react";

type FormItem = {
  product: string;
  quantity: number;
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

  const [total, setTotal] = useState(order?.total ?? 0);

  const [items, setItems] = useState<FormItem[]>(
    order?.items ?? [{ product: "", quantity: 0 }]
  );

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
    setItems((currentItems) => [
      ...currentItems,
      {
        product: "",
        quantity: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSave = () => {
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
      alert("Please enter a customer name.");
      return;
    }

    if (!date) {
      alert("Please select an order date.");
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
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditing ? "Edit Order" : "New Order"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Close order form"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="order-customer"
              className="text-sm text-slate-600"
            >
              Customer
            </label>

            <input
              id="order-customer"
              value={customer}
              onChange={(event) =>
                setCustomer(event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label
              htmlFor="order-date"
              className="text-sm text-slate-600"
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
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="order-status"
              className="text-sm text-slate-600"
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
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
              className="text-sm text-slate-600"
            >
              Total Amount
            </label>

            <input
              id="order-total"
              type="number"
              min="0"
              value={total}
              onChange={(event) =>
                setTotal(Number(event.target.value))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              Products
            </h3>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Product name"
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Qty"
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
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}