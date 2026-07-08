import { config } from "./config"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

// Paths that must never trigger a refresh-and-retry (avoids infinite loops).
const AUTH_PATHS_EXEMPT_FROM_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/me"]

// Called when a refresh attempt fails, i.e. the session is truly expired.
// Registered by AuthProvider so local UI state can be cleared immediately.
let onAuthExpired: (() => void) | null = null

export function setAuthExpiredHandler(fn: (() => void) | null): void {
  onAuthExpired = fn
}

// Shared in-flight refresh so concurrent 401s trigger only one /auth/refresh call.
let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function doFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`
  const res = await fetch(url, {
    ...init,
    // Send/receive the httpOnly auth cookies cross-origin (localhost:3000 -> :8000).
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let message = `Request to ${path} failed with ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/**
 * Thin typed fetch wrapper around the backend API.
 *
 * Only used when `config.useMock` is false. Services call this once mock mode
 * is turned off; until then it is never reached.
 *
 * On a 401 from any endpoint other than the auth endpoints themselves, this
 * transparently attempts a session refresh (via the backend's single-use
 * refresh-token rotation) and retries the original request once. If refresh
 * also fails, the original 401 is rethrown and any registered auth-expired
 * handler is notified so the app can drop back to the login screen.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await doFetch<T>(path, init)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !AUTH_PATHS_EXEMPT_FROM_REFRESH.includes(path)) {
      const refreshed = await refreshSession()
      if (refreshed) return doFetch<T>(path, init)
      onAuthExpired?.()
    }
    throw err
  }
}
