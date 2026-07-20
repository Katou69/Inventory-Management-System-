"use client";

import { useEffect, useState } from "react";

import { InventoryItem } from "@/types/inventory";
import Modal from "@/components/ui/Modal";
import { getProductHistory, HistoryEntry } from "@/services/inventory-service";

interface Props {
  open: boolean;
  product: InventoryItem | null;
  warehouseId: number;
  onClose: () => void;
}

const RANGE_OPTIONS: { label: string; value?: "7d" | "30d" }[] = [
  { label: "All Time", value: undefined },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last Month", value: "30d" },
];

const KIND_LABEL: Record<HistoryEntry["kind"], string> = {
  inbound: "Stock In",
  outbound: "Stock Out",
  transfer_in: "Stock In",
  transfer_out: "Stock Out",
  adjustment: "Adjustment",
};

export default function ViewHistoryModal({
  open,
  product,
  warehouseId,
  onClose,
}: Props) {

  const [range, setRange] = useState<"7d" | "30d" | undefined>(undefined);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product) return;

    setLoading(true);
    getProductHistory(product.id, warehouseId, range)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [open, product, warehouseId, range]);

  if (!open || !product) return null;


  return (
    <Modal
      title="Product History"
      subtitle={`${product.name} (${product.sku})`}
      onClose={onClose}
    >

      <div className="px-5 py-4 space-y-4">


        {/* Filter section */}
        <div className="flex gap-3">

          <select
            className="
              border
              border-border
              rounded-lg
              px-3
              py-2
              text-sm
              bg-background
            "
            value={range ?? ""}
            onChange={(e) =>
              setRange(e.target.value === "" ? undefined : (e.target.value as "7d" | "30d"))
            }
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>


        </div>



        {/* History list */}
        <div className="space-y-3">

          {loading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {!loading && history.length === 0 && (
            <p className="text-sm text-muted-foreground">No movement history yet.</p>
          )}

          {history.map((entry) => (

            <div key={entry.id} className="border border-border rounded-lg p-3">

              <div className="flex justify-between">

                <span className="font-medium text-sm">
                  {KIND_LABEL[entry.kind]}
                </span>

                <span className="text-xs text-muted-foreground">
                  {new Date(entry.occurredAt).toLocaleDateString()}
                </span>

              </div>


              <p className="text-sm text-muted-foreground mt-1">
                {entry.quantity > 0 ? "+" : ""}{entry.quantity} — {entry.note}
              </p>

            </div>

          ))}


        </div>


      </div>



      {/* Only Close button */}
      <div className="
        flex
        justify-end
        px-5
        py-4
        border-t
        border-border
      ">

        <button
          onClick={onClose}
          className="
            px-5
            py-2
            rounded-lg
            bg-primary
            text-primary-foreground
            text-sm
            font-medium
            hover:opacity-90
          "
        >
          Close
        </button>

      </div>


    </Modal>

  );
}
