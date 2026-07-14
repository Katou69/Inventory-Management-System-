"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { PlacedShelf, PurchaseItem, PurchaseOrder } from "@/types/purchases";
import { addInventory, getAllShelves } from "@/services/inventory-service";

type AllocationRow = {
  shelf: string;
  quantity: number;
};

type Props = {
  purchase: PurchaseOrder;
  onComplete: (purchase: PurchaseOrder) => void;
};

export default function PlaceInInventoryChecklist({ purchase, onComplete }: Props) {
  const [allocations, setAllocations] = useState<Record<string, AllocationRow[]>>(
    () => {
      const initial: Record<string, AllocationRow[]> = {};
      purchase.items.forEach((item) => {
        initial[item.product] = [{ shelf: "", quantity: 0 }];
      });
      return initial;
    }
  );

  const getRows = (product: string) => allocations[product] ?? [];

  const getAllocated = (item: PurchaseItem) =>
    getRows(item.product).reduce((sum, row) => sum + (row.quantity || 0), 0);

  const getRemaining = (item: PurchaseItem) => item.quantity - getAllocated(item);

  const shelves = getAllShelves();

  const getAvailableShelves = (item: PurchaseItem, rowIndex: number) => {
    const rows = getRows(item.product);
    const chosenElsewhere = rows
      .filter((_, index) => index !== rowIndex)
      .map((row) => row.shelf);

    return shelves.filter((shelf) => !chosenElsewhere.includes(shelf.shelf));
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

  const allItemsFullyAllocated = purchase.items.every(
    (item) => getRemaining(item) === 0
  );

  // A row that overflows its shelf would push that shelf's currentStock past
  // capacity, leaving free space negative for every later allocation.
  const shelfFree = (name: string) =>
    shelves.find((shelf) => shelf.shelf === name)?.free ?? 0;

  // Totalled per shelf ACROSS products: two products each within a shelf's free
  // space can still overflow it together (30 + 30 onto a shelf with 40 free).
  const demandByShelf = purchase.items.reduce<Record<string, number>>(
    (totals, item) => {
      getRows(item.product).forEach((row) => {
        if (row.shelf) {
          totals[row.shelf] = (totals[row.shelf] ?? 0) + (row.quantity || 0);
        }
      });
      return totals;
    },
    {}
  );

  const overCapacityShelves = Object.entries(demandByShelf).filter(
    ([shelf, demand]) => demand > shelfFree(shelf)
  );

  const canComplete = allItemsFullyAllocated && overCapacityShelves.length === 0;

  const handleComplete = () => {
    if (!canComplete) {
      alert(
        overCapacityShelves.length > 0
          ? `Over capacity: ${overCapacityShelves
              .map(([shelf]) => shelf)
              .join(", ")}. Reduce those quantities before completing.`
          : "Please allocate the full received quantity for every product before completing."
      );
      return;
    }

    const updatedItems = purchase.items.map((item) => {
      const rows = getRows(item.product).filter(
        (row) => row.shelf && row.quantity > 0
      );

      const placedIn: PlacedShelf[] = rows.map((row) => ({
        shelf: row.shelf,
        quantity: row.quantity,
      }));

      return { ...item, placedIn };
    });

    purchase.items.forEach((item) => {
      const rows = getRows(item.product).filter(
        (row) => row.shelf && row.quantity > 0
      );

      if (rows.length > 0) {
        addInventory(item.product, rows);
      }
    });

    onComplete({ ...purchase, items: updatedItems, status: "completed" });
  };

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="mb-5">
        <h3 className="font-semibold text-foreground">Place Items in Inventory</h3>
        <p className="text-sm text-muted-foreground">
          Move every item from the Receiving Bay onto a shelf.
        </p>
      </div>

      <div className="space-y-4">
        {purchase.items.map((item) => {
          const rows = getRows(item.product);
          const remaining = getRemaining(item);

          return (
            <div key={item.product} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{item.product}</p>
                <p className="text-sm text-muted-foreground">
                  Received{" "}
                  <span className="font-medium text-foreground">
                    {item.quantity.toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {rows.map((row, rowIndex) => {
                  const shelfOptions = getAvailableShelves(item, rowIndex);
                  const selected = shelfOptions.find((s) => s.shelf === row.shelf);
                  const maxQuantity = remaining + row.quantity;
                  // Judged on the shelf's TOTAL demand across products, not this
                  // row alone — otherwise two in-range rows can still overflow.
                  const shelfDemand = row.shelf ? demandByShelf[row.shelf] ?? 0 : 0;
                  const exceedsCapacity =
                    selected && shelfDemand > shelfFree(row.shelf);

                  return (
                    <div key={rowIndex} className="space-y-1">
                      <div className="grid grid-cols-[1fr_120px_32px] items-center gap-2">
                        <select
                          value={row.shelf}
                          onChange={(event) =>
                            updateShelf(item.product, rowIndex, event.target.value)
                          }
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        >
                          <option value="">Choose Shelf</option>
                          {shelfOptions.map((option) => (
                            <option key={option.shelf} value={option.shelf}>
                              {option.shelf} ({option.free.toLocaleString()} free)
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
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-accent"
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

                      {exceedsCapacity && (
                        <p className="text-xs text-red-600">
                          {row.shelf} is over capacity by{" "}
                          {(shelfDemand - shelfFree(row.shelf)).toLocaleString()}{" "}
                          (allocating {shelfDemand.toLocaleString()} into{" "}
                          {shelfFree(row.shelf).toLocaleString()} free). Reduce to
                          continue.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addRow(item.product)}
                  disabled={remaining === 0}
                  className="flex items-center gap-1 text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
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

      <div className="mt-6 flex justify-end">
        <button
          disabled={!canComplete}
          onClick={handleComplete}
          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50"
        >
          Complete Receiving
        </button>
      </div>
    </div>
  );
}