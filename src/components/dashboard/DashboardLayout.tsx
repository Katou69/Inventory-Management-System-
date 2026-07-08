import Header from "./Header"
import Sidebar from "./Sidebar"
import type { Product, Warehouse, NotificationItem } from "@/types/dashboard"

export default function DashboardLayout({
  children,
  searchProducts,
  searchWarehouses,
  notifications,
}: {
  children: React.ReactNode
  searchProducts: Product[]
  searchWarehouses: Warehouse[]
  notifications: NotificationItem[]
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header products={searchProducts} warehouses={searchWarehouses} notifications={notifications} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
