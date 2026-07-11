import { StaffDashboardContent} from "@/components/dashboard/staff";
 import { AdminDashboardContent } from "@/components/dashboard/admin";

export const role:string = "admin"; // later from auth/session, currently hardcoded for testing purposes(exporting so that it can be used in other files like inventory/page.tsx and other files)
export default function DashboardPage() {
    

  switch (role) {
    case "admin":
      return <AdminDashboardContent />

    case "staff":
      return <StaffDashboardContent />

    case "manager":
      // return <ManagerDashboardContent />;
      return null;

    default:
      return null
  }
}