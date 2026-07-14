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

/**
 * Browser-only, deliberately.
 *
 * A Server Component cannot write cookies onto the browser during render, and the
 * backend rotates refresh tokens single-use — so a server-side refresh would burn
 * the token, be unable to hand the new one back, and leave the browser holding a
 * revoked session. Strictly worse than not refreshing.
 *
 * On the server we therefore let the 401 surface: middleware bounces to /login on
 * a missing refresh cookie, and a stale-but-present one is recovered by the
 * client the moment it hydrates and makes its own call.
 */
async function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return false

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

/**
 * `credentials: "include"` is a browser-only mechanism — in Node it does
 * nothing, so a Server Component calling the API would send no auth cookie and
 * get a 401. On the server we therefore read the incoming request's cookies and
 * forward them explicitly. Imported lazily because `next/headers` cannot be
 * bundled into client code.
 */
async function serverCookieHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {}
  const { cookies } = await import("next/headers")
  const cookie = (await cookies()).toString()
  return cookie ? { cookie } : {}
}

async function doFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`
  const res = await fetch(url, {
    ...init,
    // Browser: send the httpOnly auth cookies cross-origin (:3000 -> :8000).
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(await serverCookieHeader()), // Server: forward them by hand.
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
