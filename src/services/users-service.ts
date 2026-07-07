/**
 * Users data-access layer. Same convention as dashboard-service.ts: read
 * through this function, not `src/data/users-data` directly. Flip
 * `NEXT_PUBLIC_USE_MOCK_API=false` and fill in the `apiFetch` branch to go live.
 *
 * Only the read path is wired up — add/edit/delete stay client-local state
 * until write endpoints exist on the backend.
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { MOCK_USERS } from "@/data/users-data"
import type { UserType } from "@/types/user"

const clone = <T>(value: T): T => structuredClone(value)

export async function getUsers(): Promise<UserType[]> {
  if (config.useMock) return clone(MOCK_USERS)
  return apiFetch<UserType[]>("/users")
}
