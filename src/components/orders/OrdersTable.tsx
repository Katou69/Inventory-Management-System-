import { getOrders } from "@/services/orders-service";
import { Badge } from "@/components/ui";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

const headers = ["S No", "Order ID", "Customer", "Total", "Quantity", "Status"];

export default async function OrdersTable() {
  const orders = await getOrders();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-accent border-b border-border">
          <tr className="text-left">
            {headers.map((header) => (
              <th key={header} className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center gap-1">
                  {header}
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </th>
            ))}
            <th className="px-6 py-4"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {orders.map((order, i) => (
            <tr key={order.id} className="hover:bg-accent transition-colors">
              <td className="px-6 py-4 text-muted-foreground">{i + 1}</td>
              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-mono font-medium whitespace-nowrap">
                  {order.id}
                </span>
              </td>
              <td className="px-6 py-4 font-medium text-foreground">{order.customer}</td>
              <td className="px-6 py-4 text-foreground">{order.total.toLocaleString()}</td>
              <td className="px-6 py-4 text-foreground">{order.quantity.toLocaleString()}</td>
              <td className="px-6 py-4">
                <Badge status={order.status} />
              </td>
              <td className="px-6 py-4">
                <button className="hover:bg-accent p-2 rounded-lg">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
