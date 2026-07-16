import { requireRole } from "@/lib/auth/require-user"
import { UsersView } from "@/components/users"

export default async function UsersPage() {
  // Admin/manager only — staff (or any lower rank) is bounced server-side before
  // the view or its data is ever sent to the browser.
  const user = await requireRole("admin", "manager")
  return <UsersView role={user.role} userWarehouseId={user.warehouseId} />
}
