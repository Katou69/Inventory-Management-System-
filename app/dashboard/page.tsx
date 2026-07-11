import { 
  StaffDashboardContent
 } from "@/components/dashboard/staff";

export default function DashboardPage() {
    const role = "staff"; // later from auth/session

  switch (role) {
    // case "admin":
    //   return <AdminDashboardContent />

    case "staff":
      return <StaffDashboardContent />

    default:
      return null
  }
}