import { requireRole } from "@/lib/auth/require-user"
import { SettingsView } from "@/components/settings"

export default async function SettingsPage() {
  // Admin/manager only — staff (or any lower rank) is bounced server-side before
  // the view or its data is ever sent to the browser.
  const user = await requireRole("admin", "manager")
  return <SettingsView role={user.role} userWarehouseId={user.warehouseId} />
}
