import { purchases } from "@/data/purchase-data";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

const headers = ["S No", "PO ID", "Item Name", "Cost", "Quantity", "Status"];

export default function PurchaseTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left">
            {headers.map((header) => (
              <th key={header} className="px-6 py-4 text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-1">
                  {header}
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
            ))}
            <th className="px-6 py-4"></th>
          </tr>
        </thead>

        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-slate-500">{purchase.id}</td>
              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium whitespace-nowrap">
                  {purchase.poId}
                </span>
              </td>
              <td className="px-6 py-4 font-medium">{purchase.itemName}</td>
              <td className="px-6 py-4">{purchase.cost}</td>
              <td className="px-6 py-4">{purchase.quantity}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    purchase.status === "Received"
                      ? "bg-green-100 text-green-700"
                      : purchase.status === "Cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {purchase.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="hover:bg-slate-100 p-2 rounded-lg">
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}