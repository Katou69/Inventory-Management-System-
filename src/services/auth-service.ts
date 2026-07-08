/**
 * Auth data-access layer. Same convention as the other services, but branches on
 * `config.useMockAuth` (separate from data's `useMock`) so real login can be used
 * while resource endpoints are still mocked. In mock mode auth is a zero-backend
 * demo (any input logs in); in live mode it calls the FastAPI backend, which
 * manages httpOnly cookies — no tokens are ever exposed to JS here.
 */
import { config } from "@/lib/config"
import { apiFetch, ApiError } from "@/lib/api-client"
import { MOCK_USERS } from "@/data/users-data"
import type { UserType, Role } from "@/types/user"

/**
 * Sign in with email + password.
 * - Mock mode: fabricates a demo user (preserves the original zero-backend behavior).
 * - Live mode: POST /auth/login; the backend sets httpOnly cookies and returns the user.
 *   A 401 surfaces as an ApiError for the form to display.
 */
export async function login(email: string, password: string): Promise<UserType> {
  if (config.useMockAuth) {
    return {
      id: "demo",
      name: "Morgan Lee",
      email: email || "morgan.lee@grandroyal.com",
      role: "staff",
      warehouseId: 1,
      status: "active",
      joinedDate: new Date().toISOString().slice(0, 10),
    }
  }
  return apiFetch<UserType>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Register a new account.
 * - Mock mode: fabricates a demo user (no backend call).
 * - Live mode: POST /auth/register; the backend forces role "staff" server-side
 *   regardless of what the client sends, sets httpOnly cookies, and returns the user.
 *   A 409 (email already registered) surfaces as an ApiError for the form to display.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  warehouseId: number,
): Promise<UserType> {
  if (config.useMockAuth) {
    return {
      id: "demo",
      name,
      email,
      role: "staff",
      warehouseId,
      status: "active",
      joinedDate: new Date().toISOString().slice(0, 10),
    }
  }
  return apiFetch<UserType>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, warehouse_id: warehouseId }),
  })
}

/** Log a demo user in directly (mock mode "Quick Demo Access" buttons). */
export function demoLogin(role: Role): UserType {
  const map: Record<Role, UserType> = {
    admin: MOCK_USERS[0],
    manager: MOCK_USERS[1],
    staff: MOCK_USERS[3],
  }
  return map[role]
}

/** Log out. Mock: no-op. Live: POST /auth/logout clears cookies + revokes the session. */
export async function logout(): Promise<void> {
  if (config.useMockAuth) return
  await apiFetch("/auth/logout", { method: "POST" })
}

/**
 * Restore the current session on page load.
 * - Mock mode: returns null (the context restores its demo user from localStorage).
 * - Live mode: GET /auth/me via the httpOnly cookie; null if not authenticated (401).
 */
export async function getCurrentUser(): Promise<UserType | null> {
  if (config.useMockAuth) return null
  try {
    return await apiFetch<UserType>("/auth/me")
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}
