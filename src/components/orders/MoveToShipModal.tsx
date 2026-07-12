"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import type { Order, OrderItem, PickedShelf } from "@/types/orders";
import { getShelfStockForProduct, deductInventory } from "@/services/inventory-service";

type AllocationRow = {
  shelf: string;
  quantity: number;
};

type Props = {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (order: Order) => void;
};

export default function MoveToShipModal({
  open,
  order,
  onClose,
  onConfirm,
}: Props) {
  const [allocations, setAllocations] = useState<Record<string, AllocationRow[]>>(() => {
    const initial: Record<string, AllocationRow[]> = {};

    order?.items.forEach((item) => {
      initial[item.product] = [{ shelf: "", quantity: 0 }];
    });

    return initial;
  });

  if (!open || !order) return null;

  const getRows = (product: string) => allocations[product] ?? [];

  const getAllocated = (item: OrderItem) =>
    getRows(item.product).reduce((sum, row) => sum + (row.quantity || 0), 0);

  const getRemaining = (item: OrderItem) =>
    item.quantity - getAllocated(item);

  const getAvailableShelves = (item: OrderItem, rowIndex: number) => {
    const rows = getRows(item.product);

    const chosenElsewhere = rows
      .filter((_, index) => index !== rowIndex)
      .map((row) => row.shelf);

    return getShelfStockForProduct(item.product).filter(
      (option) => !chosenElsewhere.includes(option.shelf)
    );
  };

  const updateShelf = (product: string, rowIndex: number, shelf: string) => {
    setAllocations((current) => ({
      ...current,
      [product]: getRows(product).map((row, index) =>
        index === rowIndex ? { shelf, quantity: 0 } : row
      ),
    }));
  };

  const updateQuantity = (
    product: string,
    rowIndex: number,
    quantity: number,
    max: number
  ) => {
    const safeQuantity = Math.max(0, Math.min(quantity, max));

    setAllocations((current) => ({
      ...current,
      [product]: getRows(product).map((row, index) =>
        index === rowIndex ? { ...row, quantity: safeQuantity } : row
      ),
    }));
  };

  const addRow = (product: string) => {
    setAllocations((current) => ({
      ...current,
      [product]: [...getRows(product), { shelf: "", quantity: 0 }],
    }));
  };

  const removeRow = (product: string, rowIndex: number) => {
    setAllocations((current) => ({
      ...current,
      [product]: getRows(product).filter((_, index) => index !== rowIndex),
    }));
  };

  const allItemsFullyAllocated = order.items.every(
    (item) => getRemaining(item) === 0
  );

  const handleConfirm = () => {
    if (!allItemsFullyAllocated) {
      alert(
        "Please allocate the full required quantity for every product before continuing."
      );
      return;
    }

    const updatedItems: OrderItem[] = order.items.map((item) => {
      const rows = getRows(item.product).filter(
        (row) => row.shelf && row.quantity > 0
      );

      const pickedFrom: PickedShelf[] = rows.map((row) => ({
        shelf: row.shelf,
        quantity: row.quantity,
      }));

      return { ...item, pickedFrom };
    });

    order.items.forEach((item) => {
      const rows = getRows(item.product).filter(
        (row) => row.shelf && row.quantity > 0
      );

      if (rows.length > 0) {
        deductInventory(item.product, rows);
      }
    });

    onConfirm({ ...order, items: updatedItems, status: "picking" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold">
              Move Order to Shipping Bay
            </h2>
            <p className="text-sm text-slate-500">{order.id}</p>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {order.items.map((item) => {
            const rows = getRows(item.product);
            const remaining = getRemaining(item);

            return (
              <div key={item.product} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.product}</p>

                  <p className="text-sm text-slate-500">
                    Need{" "}
                    <span className="font-medium text-slate-700">
                      {item.quantity.toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {rows.map((row, rowIndex) => {
                    const shelfOptions = getAvailableShelves(item, rowIndex);

                    const selectedOption = shelfOptions.find(
                      (option) => option.shelf === row.shelf
                    );

                    const maxQuantity = Math.min(
                      selectedOption ? selectedOption.quantity : 0,
                      remaining + row.quantity
                    );

                    return (
                      <div
                        key={rowIndex}
                        className="grid grid-cols-[1fr_120px_32px] items-center gap-2"
                      >
                        <select
                          value={row.shelf}
                          onChange={(event) =>
                            updateShelf(item.product, rowIndex, event.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Choose Shelf</option>

                          {shelfOptions.map((option) => (
                            <option key={option.shelf} value={option.shelf}>
                              {option.shelf} ({option.quantity.toLocaleString()})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min={0}
                          max={maxQuantity}
                          value={row.quantity}
                          disabled={!row.shelf}
                          onChange={(event) =>
                            updateQuantity(
                              item.product,
                              rowIndex,
                              Number(event.target.value),
                              maxQuantity
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        />

                        <button
                          type="button"
                          onClick={() => removeRow(item.product, rowIndex)}
                          disabled={rows.length === 1}
                          className="flex items-center justify-center rounded-lg p-2 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => addRow(item.product)}
                    disabled={remaining === 0}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add shelf
                  </button>

                  <p
                    className={`text-sm font-medium ${
                      remaining === 0 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    Remaining: {remaining.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 border-t p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allItemsFullyAllocated}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Move Products
          </button>
        </div>
      </div>
    </div>
  );
}