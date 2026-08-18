import { requireUser } from "@/lib/auth/require-user"
import { getNotifications } from "@/services/dashboard-service"
import NotificationsView from "@/components/notifications/NotificationsView"

export default async function NotificationsPage() {
  // Any signed-in role — same gating as the header bell / GET /notifications.
  await requireUser()
  const notifications = await getNotifications(100)
  return <NotificationsView initialNotifications={notifications} />
}
