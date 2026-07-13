"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { PurchaseOrder } from "@/types/purchases";
import { Badge } from "@/components/ui";
import Filters, { PurchaseFilterStatus } from "./Filters";
import PurchaseActionsMenu, { Role } from "./PurchaseActionsMenu";
import PurchaseFormModal from "./PurchaseFormModal";
import DeletePurchaseModal from "./DeletePurchaseModal";
import CancelPurchaseModal from "./CancelPurchaseModal";
import PurchaseDetailsModal from "./PurchaseDetailsModal";
import ReceivingChecklistModal from "./ReceivingChecklistModal";

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
  role: Role;
};

export default function PurchaseTableClient({ purchases, role }: Props) {
  const [purchaseList, setPurchaseList] = useState<PurchaseOrder[]>(purchases);

  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [receivingPurchase, setReceivingPurchase] = useState<PurchaseOrder | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseOrder | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseOrder | null>(null);
  const [cancellingPurchase, setCancellingPurchase] = useState<PurchaseOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const canManage = role === "admin" || role === "manager";

  const [activeStatus, setActiveStatus] = useState<PurchaseFilterStatus>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredPurchases = useMemo(() => {
    return purchaseList.filter((purchase) => {
      const matchesStatus = activeStatus === "all" || purchase.status === activeStatus;
      const matchesStartDate = !startDate || purchase.date >= startDate;
      const matchesEndDate = !endDate || purchase.date <= endDate;

      return matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [purchaseList, activeStatus, startDate, endDate]);

  const handleAddPurchase = () => {
    setEditingPurchase(null);
    setIsFormOpen(true);
  };

  const handleEditPurchase = (purchase: PurchaseOrder) => {
    setEditingPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleSavePurchase = (savedPurchase: PurchaseOrder) => {
    setPurchaseList((current) => {
      const exists = current.some((purchase) => purchase.id === savedPurchase.id);

      if (exists) {
        return current.map((purchase) =>
          purchase.id === savedPurchase.id ? savedPurchase : purchase
        );
      }

      return [savedPurchase, ...current];
    });

    setSelectedPurchase((current) =>
      current?.id === savedPurchase.id ? savedPurchase : current
    );
  };

  const handleDeletePurchase = () => {
    if (!deletingPurchase) return;

    setPurchaseList((current) =>
      current.filter((purchase) => purchase.id !== deletingPurchase.id)
    );

    if (selectedPurchase?.id === deletingPurchase.id) {
      setSelectedPurchase(null);
    }

    setDeletingPurchase(null);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // pending -> standalone receiving checklist; everything else -> details
  // modal (which embeds the "place in inventory" step when status is
  // "receiving").
  const handleProductClick = (purchase: PurchaseOrder) => {
    if (purchase.status === "pending") {
      setReceivingPurchase(purchase);
    } else {
      setSelectedPurchase(purchase);
    }
  };

  const handleConfirmReceived = (updatedPurchase: PurchaseOrder) => {
    setPurchaseList((current) =>
      current.map((purchase) =>
        purchase.id === updatedPurchase.id ? updatedPurchase : purchase
      )
    );
    setReceivingPurchase(null);
  };

  const handleCompleteReceiving = (updatedPurchase: PurchaseOrder) => {
    setPurchaseList((current) =>
      current.map((purchase) =>
        purchase.id === updatedPurchase.id ? updatedPurchase : purchase
      )
    );
    setSelectedPurchase(null);
  };

  const handleConfirmCancel = () => {
    if (!cancellingPurchase) return;

    setPurchaseList((current) =>
      current.map((purchase) =>
        purchase.id === cancellingPurchase.id
          ? { ...purchase, status: "cancelled" }
          : purchase
      )
    );

    setCancellingPurchase(null);
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
            Showing {filteredPurchases.length} of {purchaseList.length} purchases
          </p>

          {canManage && (
            <button
              type="button"
              onClick={handleAddPurchase}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + New Purchase
            </button>
          )}
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
                filteredPurchases.map((purchase, index) => {
                  const totalQuantity = purchase.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );

                  const firstProduct = purchase.items[0]?.product ?? "No product";
                  const remainingProducts = Math.max(purchase.items.length - 1, 0);

                  return (
                    <tr
                      key={purchase.id}
                      className="border-b border-border transition-colors last:border-b-0 hover:bg-accent"
                    >
                      <td className="px-6 py-4 text-muted-foreground">{index + 1}</td>

                      <td className="px-6 py-4">
                        <span className="inline-flex whitespace-nowrap rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                          {purchase.id}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-foreground">
                        {purchase.supplier}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleProductClick(purchase)}
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
                        <Badge status={purchase.status} />
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {purchase.date}
                      </td>

                      <td className="px-6 py-4">
                        <PurchaseActionsMenu
                          purchase={purchase}
                          role={role}
                          onView={setSelectedPurchase}
                          onReceive={setReceivingPurchase}
                          onEdit={handleEditPurchase}
                          onDelete={setDeletingPurchase}
                          onCancel={setCancellingPurchase}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={headers.length + 1} className="px-6 py-14 text-center">
                    <p className="font-medium text-foreground">No purchases found</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Try changing the status or date filters.
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

      <PurchaseDetailsModal
        open={selectedPurchase !== null}
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onCompleteReceiving={handleCompleteReceiving}
      />

      <ReceivingChecklistModal
        key={receivingPurchase?.id ?? "none"}
        open={receivingPurchase !== null}
        purchase={receivingPurchase}
        onClose={() => setReceivingPurchase(null)}
        onConfirm={handleConfirmReceived}
      />

      <PurchaseFormModal
        key={editingPurchase?.id ?? "new-purchase"}
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
        onClose={() => setDeletingPurchase(null)}
        onConfirm={handleDeletePurchase}
      />

      <CancelPurchaseModal
        purchase={cancellingPurchase}
        onClose={() => setCancellingPurchase(null)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}