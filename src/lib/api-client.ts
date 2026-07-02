import { config } from "./config"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Thin typed fetch wrapper around the backend API.
 *
 * Only used when `config.useMock` is false. Services call this once mock mode
 * is turned off; until then it is never reached.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`
  const res = await fetch(url, {
    ...init,
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
