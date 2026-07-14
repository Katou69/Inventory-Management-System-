import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { AuthGate } from "@/components/auth"
import { getSearchIndex, getNotifications } from "@/services/dashboard-service"

// Per-user data behind an auth cookie: can never be prerendered.
// A logged-out visitor never gets here at all — middleware.ts redirects to /login
// before any Server Component renders. (A check in this layout would NOT be
// enough: Next renders layout and page in parallel, so the page's own authed
// fetches fire regardless of what the layout decides.)
export const dynamic = "force-dynamic"

export default async function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  // Tolerate failure rather than blowing up the shell: a stale-but-present cookie
  // gets past middleware, and empty chrome beats a crashed dashboard.
  const [searchIndex, notifications] = await Promise.all([
    getSearchIndex().catch(() => ({ products: [], warehouses: [] })),
    getNotifications().catch(() => []),
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
