import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { AuthGate } from "@/components/auth"
import { getSearchIndex, getNotifications } from "@/services/dashboard-service"

export default async function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [searchIndex, notifications] = await Promise.all([
    getSearchIndex(),
    getNotifications(),
  ])

  return (
    <AuthGate>
      <DashboardLayout
        searchProducts={searchIndex.products}
        searchWarehouses={searchIndex.warehouses}
        notifications={notifications}
      >
        {children}
      </DashboardLayout>
    </AuthGate>
  )
}
