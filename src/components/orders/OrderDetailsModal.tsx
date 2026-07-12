"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui";

import type { Order } from "@/types/orders";

import PickingChecklist from "./PickingChecklist";

type Props = {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onCompletePicking: (orderId: string) => void;
};

export default function OrderDetailsModal({
  open,
  order,
  onClose,
  onCompletePicking,
}: Props) {
  if (!open || !order) return null;

  const totalQty = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">

          <div>

            <h2 className="text-xl font-semibold">
              Order Details
            </h2>

            <p className="text-sm text-slate-500">
              {order.id}
            </p>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>

        </div>

        <div className="p-6 space-y-6">

          {/* Summary */}

          <div className="grid grid-cols-2 gap-4">

            <InfoRow
              label="Customer"
              value={order.customer}
            />

            <div>

              <p className="text-sm text-slate-500">
                Status
              </p>

              <Badge status={order.status} />

            </div>

            <InfoRow
              label="Order Date"
              value={order.date}
            />

            <InfoRow
              label="Total Amount"
              value={order.total.toLocaleString()}
            />

            <InfoRow
              label="Total Quantity"
              value={totalQty.toLocaleString()}
            />

          </div>

          {/* Products */}

          <div>

            <h3 className="font-semibold mb-3">
              Products
            </h3>

            <div className="rounded-xl border divide-y">

              {order.items.map((item) => (

                <div
                  key={item.product}
                  className="flex justify-between p-4"
                >
                  <div>

                    <p className="font-medium">
                      {item.product}
                    </p>

                    {item.pickedFrom?.length ? (
                        <div className="mt-2 space-y-1">

                            {item.pickedFrom.map((pick) => (

                                <p
                                    key={pick.shelf}
                                    className="text-sm text-slate-500"
                                >
                                    {pick.shelf} ({pick.quantity})
                                </p>

                            ))}

                        </div>
                    ) : (

                        <p className="text-sm text-slate-400">
                            Shelf not selected yet
                        </p>

                    )}

                  </div>

                  <div className="font-semibold">
                    {item.quantity.toLocaleString()}
                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* Picking */}

          {order.status === "picking" && (

            <PickingChecklist
              order={order}
              onComplete={() => onCompletePicking(order.id)}
            />

          )}

        </div>

      </div>

    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="font-medium">
        {value}
      </p>
    </div>
  );
}