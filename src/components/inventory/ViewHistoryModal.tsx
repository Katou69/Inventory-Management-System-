"use client";

import Modal from "./Modal";

import { InventoryRow } from "@/types";
import { stockMovements } from "@/data/stockmovement-data";

interface Props {
  open: boolean;
  product: InventoryRow | null;
  onClose: () => void;
}

export default function ProductHistoryModal({
  open,
  product,
  onClose,
}: Props) {
  if (!product) return null;

  const history = stockMovements.filter(
    (m) => m.productId === product.productId
  );

  return (
    <Modal
      open={open}
      title={`${product.name} History`}
      onClose={onClose}
    >
      <div className="space-y-4">

        <select className="rounded-lg border p-2">
          <option>All Time</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>

        <div className="max-h-72 overflow-y-auto rounded-lg border">

          <table className="w-full">

            <thead className="bg-slate-50">

              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Qty</th>
                <th className="p-3 text-left">Reason</th>
              </tr>

            </thead>

            <tbody>

              {history.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                >
                  <td className="p-3">{item.date}</td>

                  <td
                    className={`p-3 font-medium ${
                      item.type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.type}
                  </td>

                  <td className="p-3">
                    {item.quantity}
                  </td>

                  <td className="p-3">
                    {item.reason}
                  </td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
        </div>

      </div>
    </Modal>
  );
}