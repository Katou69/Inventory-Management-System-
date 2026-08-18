/**
 * Users data-access layer. Same convention as dashboard-service.ts: read
 * through this function, not `src/data/users-data` directly. Flip
 * `NEXT_PUBLIC_USE_MOCK_API=false` and fill in the `apiFetch` branch to go live.
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

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: Role
  warehouseId?: number
}): Promise<UserType> {
  if (config.useMock) {
    const newUser: UserType = {
      id: `u${MOCK_USERS.length + 1}`,
      name: data.name,
      email: data.email,
      role: data.role,
      warehouseId: data.role === "admin" ? "all" : (data.warehouseId ?? MOCK_USERS[0]?.warehouseId ?? 1),
      status: "active",
      joinedDate: new Date().toISOString().slice(0, 10),
      loginAttempts: 0,
      lockoutUntil: null,
      mustChangePassword: true,
    }
    MOCK_USERS.push(newUser)
    return clone(newUser)
  }
  return apiFetch<UserType>("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      warehouse_id: data.warehouseId ?? null,
    }),
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
