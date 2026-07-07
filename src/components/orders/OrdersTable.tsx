import { getOrders } from "@/services/orders-service";
import { Badge } from "@/components/ui";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

const headers = ["S No", "Order ID", "Customer", "Total", "Quantity", "Status"];

export default async function OrdersTable() {
  const orders = await getOrders();

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
          {orders.map((order, i) => (
            <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-slate-500">{i + 1}</td>
              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium whitespace-nowrap">
                  {order.id}
                </span>
              </td>
              <td className="px-6 py-4 font-medium">{order.customer}</td>
              <td className="px-6 py-4">{order.total.toLocaleString()}</td>
              <td className="px-6 py-4">{order.quantity.toLocaleString()}</td>
              <td className="px-6 py-4">
                <Badge status={order.status} />
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
