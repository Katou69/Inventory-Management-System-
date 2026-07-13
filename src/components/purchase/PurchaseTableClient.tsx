"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, X } from "lucide-react";

import { PurchaseOrder } from "@/types/purchases";
import { Badge } from "@/components/ui";
import Filters, { PurchaseFilterStatus } from "./Filters";
import PurchaseActionsMenu from "./PurchaseActionsMenu";
import PurchaseFormModal from "./PurchaseFormModal";
import DeletePurchaseModal from "./DeletePurchaseModal";

const headers = [
  "No",
  "Purchase ID",
  "Supplier",
  "Products",
  "Total Qty",
  "Total Amount",
  "Status",
  "Purchase Date",
];

type Props = {
  purchases: PurchaseOrder[];
};

export default function PurchaseTableClient({
  purchases,
}: Props) {
  const [purchaseList, setPurchaseList] =
    useState<PurchaseOrder[]>(purchases);

  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseOrder | null>(null);

  const [editingPurchase, setEditingPurchase] =
    useState<PurchaseOrder | null>(null);

  const [deletingPurchase, setDeletingPurchase] =
    useState<PurchaseOrder | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [activeStatus, setActiveStatus] =
    useState<PurchaseFilterStatus>("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredPurchases = useMemo(() => {
    return purchaseList.filter((purchase) => {
      const matchesStatus =
        activeStatus === "all" ||
        purchase.status === activeStatus;

      const matchesStartDate =
        !startDate || purchase.date >= startDate;

      const matchesEndDate =
        !endDate || purchase.date <= endDate;

      return (
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    purchaseList,
    activeStatus,
    startDate,
    endDate,
  ]);

  const handleAddPurchase = () => {
    setEditingPurchase(null);
    setIsFormOpen(true);
  };

  const handleEditPurchase = (
    purchase: PurchaseOrder
  ) => {
    setEditingPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleSavePurchase = (
    savedPurchase: PurchaseOrder
  ) => {
    setPurchaseList((currentPurchases) => {
      const exists = currentPurchases.some(
        (purchase) =>
          purchase.id === savedPurchase.id
      );

      if (exists) {
        return currentPurchases.map((purchase) =>
          purchase.id === savedPurchase.id
            ? savedPurchase
            : purchase
        );
      }

      return [savedPurchase, ...currentPurchases];
    });

    setSelectedPurchase((currentPurchase) =>
      currentPurchase?.id === savedPurchase.id
        ? savedPurchase
        : currentPurchase
    );
  };

  const handleDeletePurchase = () => {
    if (!deletingPurchase) return;

    setPurchaseList((currentPurchases) =>
      currentPurchases.filter(
        (purchase) =>
          purchase.id !== deletingPurchase.id
      )
    );

    if (
      selectedPurchase?.id === deletingPurchase.id
    ) {
      setSelectedPurchase(null);
    }

    setDeletingPurchase(null);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <div className="space-y-5">
        <Filters
          activeStatus={activeStatus}
          startDate={startDate}
          endDate={endDate}
          onStatusChange={setActiveStatus}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearDates={handleClearDates}
        />

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPurchases.length} of{" "}
            {purchaseList.length} purchases
          </p>

          <button
            type="button"
            onClick={handleAddPurchase}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + New Purchase
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="min-w-full">
            <thead className="border-b border-border bg-accent">
              <tr className="text-left">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </div>
                  </th>
                ))}

                <th className="px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map(
                  (purchase, index) => {
                    const totalQuantity =
                      purchase.items.reduce(
                        (sum, item) =>
                          sum + item.quantity,
                        0
                      );

                    const firstProduct =
                      purchase.items[0]?.product ??
                      "No product";

                    const remainingProducts =
                      Math.max(
                        purchase.items.length - 1,
                        0
                      );

                    return (
                      <tr
                        key={purchase.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-accent"
                      >
                        <td className="px-6 py-4 text-muted-foreground">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                            {purchase.id}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">
                          {purchase.supplier}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPurchase(
                                purchase
                              )
                            }
                            className="text-left"
                          >
                            <p className="font-medium text-foreground hover:text-primary hover:underline">
                              {firstProduct}
                            </p>

                            {remainingProducts > 0 && (
                              <p className="text-xs text-muted-foreground">
                                +{remainingProducts} more
                              </p>
                            )}
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-foreground">
                          {totalQuantity.toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-foreground">
                          {purchase.total.toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge
                            status={purchase.status}
                          />
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                          {purchase.date}
                        </td>

                        <td className="px-6 py-4">
                          <PurchaseActionsMenu
                            purchase={purchase}
                            onView={
                              setSelectedPurchase
                            }
                            onEdit={
                              handleEditPurchase
                            }
                            onDelete={
                              setDeletingPurchase
                            }
                          />
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="px-6 py-14 text-center"
                  >
                    <p className="font-medium text-foreground">
                      No purchases found
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Try changing the status or date
                      filters.
                    </p>

                    {(startDate || endDate) && (
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="mt-4 text-sm font-medium text-primary hover:underline"
                      >
                        Clear date filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedPurchase(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Purchase Details
                </h2>

                <p className="text-sm text-muted-foreground">
                  {selectedPurchase.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPurchase(null)
                }
                className="rounded-lg p-2 hover:bg-accent"
                aria-label="Close purchase details"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Supplier
                </span>

                <span className="text-right font-medium text-foreground">
                  {selectedPurchase.supplier}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Status
                </span>

                <Badge
                  status={selectedPurchase.status}
                />
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Purchase Date
                </span>

                <span className="text-foreground">
                  {selectedPurchase.date}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <h3 className="mb-3 font-semibold text-foreground">
                Products
              </h3>

              <div className="max-h-64 space-y-3 overflow-y-auto">
                {selectedPurchase.items.map(
                  (item, index) => (
                    <div
                      key={`${item.product}-${index}`}
                      className="flex justify-between gap-4 rounded-lg bg-accent px-4 py-3"
                    >
                      <span className="text-foreground">
                        {item.product}
                      </span>

                      <span className="whitespace-nowrap font-medium text-foreground">
                        {item.quantity.toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total Quantity
                </span>

                <span className="font-semibold text-foreground">
                  {selectedPurchase.items
                    .reduce(
                      (sum, item) =>
                        sum + item.quantity,
                      0
                    )
                    .toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total Amount
                </span>

                <span className="font-semibold text-foreground">
                  {selectedPurchase.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <PurchaseFormModal
        key={
          editingPurchase?.id ?? "new-purchase"
        }
        open={isFormOpen}
        purchase={editingPurchase}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPurchase(null);
        }}
        onSave={handleSavePurchase}
      />

      <DeletePurchaseModal
        purchase={deletingPurchase}
        onClose={() =>
          setDeletingPurchase(null)
        }
        onConfirm={handleDeletePurchase}
      />
    </>
  );
}