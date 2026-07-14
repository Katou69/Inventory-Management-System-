import { StaffDashboardContent } from "@/components/dashboard/staff"
import { AdminDashboardContent } from "@/components/dashboard/admin"
import { ManagerDashboardContent } from "@/components/dashboard/manager"
import { requireUser } from "@/lib/auth/require-user"

export default async function DashboardPage() {
  const { role } = await requireUser()

  switch (role) {
    case "admin":
      return <AdminDashboardContent />
    case "manager":
      return <ManagerDashboardContent />
    case "staff":
      return <StaffDashboardContent />
    default:
      return null
  }
}
