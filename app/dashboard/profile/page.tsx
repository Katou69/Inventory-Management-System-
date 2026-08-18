import { requireUser } from "@/lib/auth/require-user"
import { getWarehouses } from "@/services/dashboard-service"
import ProfileView from "@/components/profile/ProfileView"

export default async function ProfilePage() {
  const user = await requireUser()
  const warehouseName =
    user.warehouseId === "all"
      ? "All warehouses"
      : (await getWarehouses().catch(() => [])).find((w) => w.id === user.warehouseId)?.name ?? "—"
  return <ProfileView user={user} warehouseName={warehouseName} />
}
