"use client";

import { useState } from "react";
import ProductMenu from "./ProductMenu";

import { getInventoryRows } from "@/lib/inventory";
import { InventoryRow } from "@/types";
import ProductHistoryModal from "./ViewHistoryModal";
import EditProductModal from "./EditProductModal";

export default function InventoryTable() {
  // Mock data (later this will come from an API)
  const inventory = getInventoryRows();

  // Keep these for later when we implement the dropdown
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryRow | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left">
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Name
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              SKU
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
              Price (Kyat)
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Category
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Supplier
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
              Supplier ID
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Stock
            </th>

            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Status
            </th>

            <th className="px-6 py-4"></th>
          </tr>
        </thead>

        <tbody>
          {inventory.map((item) => (
            <tr
              key={item.productId}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4 font-medium">{item.name}</td>

              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium whitespace-nowrap">
                  {item.sku}
                </span>
              </td>

              <td className="px-6 py-4">
                {item.price.toLocaleString()}
              </td>

              <td className="px-6 py-4">{item.category}</td>

              <td className="px-6 py-4">{item.supplierName}</td>

              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium whitespace-nowrap">
                  {item.supplierId}
                </span>
              </td>

              <td className="px-6 py-4">{item.quantity}</td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    item.status === "In Stock"
                      ? "bg-green-100 text-green-700"
                      : item.status === "Low Stock"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status}
                </span>
              </td>

              <td className="px-6 py-4">
                <ProductMenu
                  onEdit={() => {
                    setSelectedProduct(item);
                    setEditOpen(true);
                  }}
                  onHistory={() => {
                    setSelectedProduct(item);
                    setHistoryOpen(true);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <EditProductModal
          open={editOpen}
          product={selectedProduct}
          onClose={() => setEditOpen(false)}
        />

        <ProductHistoryModal
          open={historyOpen}
          product={selectedProduct}
          onClose={() => setHistoryOpen(false)}
        />
    </div>
  );
}