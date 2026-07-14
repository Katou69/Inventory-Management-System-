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
