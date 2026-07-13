"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui";
import type { PurchaseOrder } from "@/types/purchases";

import PlaceInInventoryChecklist from "./PlaceInInventoryChecklist";

type Props = {
  open: boolean;
  purchase: PurchaseOrder | null;
  onClose: () => void;
  onCompleteReceiving: (purchase: PurchaseOrder) => void;
};

export default function PurchaseDetailsModal({
  open,
  purchase,
  onClose,
  onCompleteReceiving,
}: Props) {
  if (!open || !purchase) return null;

  const totalQty = purchase.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl rounded-xl bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Purchase Details</h2>
            <p className="text-sm text-muted-foreground">{purchase.id}</p>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Supplier" value={purchase.supplier} />

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge status={purchase.status} />
            </div>

            <InfoRow label="Purchase Date" value={purchase.date} />
            <InfoRow label="Total Amount" value={purchase.total.toLocaleString()} />
            <InfoRow label="Total Quantity" value={totalQty.toLocaleString()} />
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-foreground">Products</h3>

            <div className="rounded-xl border border-border divide-y divide-border">
              {purchase.items.map((item) => (
                <div key={item.product} className="flex justify-between p-4">
                  <div>
                    <p className="font-medium text-foreground">{item.product}</p>

                    {item.placedIn?.length ? (
                      <div className="mt-2 space-y-1">
                        {item.placedIn.map((placed) => (
                          <p key={placed.shelf} className="text-sm text-muted-foreground">
                            {placed.shelf} ({placed.quantity})
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not yet placed on a shelf
                      </p>
                    )}
                  </div>

                  <div className="font-semibold text-foreground">
                    {item.quantity.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {purchase.status === "receiving" && (
            <PlaceInInventoryChecklist
              purchase={purchase}
              onComplete={onCompleteReceiving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}