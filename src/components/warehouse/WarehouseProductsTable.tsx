"use client"

import type { WarehouseDetail } from "@/types/dashboard"
import { productStatusStyle } from "./statusStyles"
import { Pagination } from "@/components/ui"
import { usePagination } from "@/lib/use-pagination"

const categoryColors: Record<string, string> = {
  "Whisky":      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-900",
  "Non-Whiskey": "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:ring-sky-900",
}

export default function WarehouseProductsTable({ wh }: { wh: WarehouseDetail }) {
  const { page, pageCount, setPage, pageItems: pagedProducts } = usePagination(wh.products)

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Products in this Warehouse</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{wh.products.length} SKUs stored</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-accent border-b border-border">
              <th scope="col" className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3">SKU</th>
              <th scope="col" className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Product</th>
              <th scope="col" className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Category</th>
              <th scope="col" className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Quantity</th>
              <th scope="col" className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Status</th>
              <th scope="col" className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-accent transition-colors">
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-mono font-medium">
                    {p.sku}
                  </span>
                </td>
                <td className="px-3 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[p.category] ?? "bg-accent text-muted-foreground"}`}>
                    {p.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-foreground">{p.quantity.toLocaleString()}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${productStatusStyle[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{p.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={wh.products.length} pageSize={10} />
      </div>
    </div>
  )
}
