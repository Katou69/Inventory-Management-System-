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
import type { UserType, Role, UserStatus } from "@/types/user"

const clone = <T>(value: T): T => structuredClone(value)

export async function getUsers(): Promise<UserType[]> {
  if (config.useMock) return clone(MOCK_USERS)
  return apiFetch<UserType[]>("/users")
}

export async function updateUser(
  userId: string,
  data: Partial<{
    name: string
    email: string
    role: Role
    warehouse_id: number
    status: UserStatus
  }>
): Promise<UserType> {
  if (config.useMock) {
    // Mock implementation
    const index = MOCK_USERS.findIndex(u => u.id === userId)
    if (index === -1) throw new Error("User not found")
    
    const updatedUser = {
      ...MOCK_USERS[index],
      ...data,
      warehouseId: data.warehouse_id ?? MOCK_USERS[index].warehouseId,
    }
    MOCK_USERS[index] = updatedUser
    return clone(updatedUser)
  }
  return apiFetch<UserType>(`/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export async function deleteUser(userId: string): Promise<void> {
  if (config.useMock) {
    // Mock implementation
    const index = MOCK_USERS.findIndex(u => u.id === userId)
    if (index !== -1) MOCK_USERS.splice(index, 1)
    return
  }
  await apiFetch(`/users/${userId}`, { method: "DELETE" })
}
