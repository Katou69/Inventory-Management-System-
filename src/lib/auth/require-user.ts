import { redirect } from "next/navigation"

import { getCurrentUser } from "@/services/auth-service"
import type { UserType } from "@/types/user"

/**
 * The signed-in user, for Server Components.
 *
 * Every role-switching page needs this. It replaces a hardcoded
 * `export const role = "admin"` that every page imported — which meant staff and
 * managers were served the admin view, and staff then crashed on the admin-only
 * endpoints (/sales/overview, /activities) the backend correctly 403s for them.
 *
 * proxy.ts already redirects anyone without a session, so the redirect here is
 * just a guard for a cookie that exists but no longer resolves to a user.
 */
export async function requireUser(): Promise<UserType> {
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect("/login")
  return user
}

/**
 * Like requireUser, but also enforces a role allow-list server-side — the page
 * never renders (nor fetches its data) for a disallowed role, instead of a
 * client-side gate that ships the view and hides it after hydration.
 *
 * A logged-in-but-disallowed user is bounced to the dashboard, not /login: they
 * have a valid session, just not the rank for this page.
 */
export async function requireRole(...allowed: UserType["role"][]): Promise<UserType> {
  const user = await requireUser()
  if (!allowed.includes(user.role)) redirect("/dashboard")
  return user
}
