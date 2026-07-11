import { StaffDashboardContent} from "@/components/dashboard/staff";
 import { AdminDashboardContent } from "@/components/dashboard/admin";

export default function DashboardPage() {
    const role: string = "staff"; // later from auth/session

  switch (role) {
    case "admin":
      return <AdminDashboardContent />

    case "staff":
      return <StaffDashboardContent />

    default:
      return null
  }
}