import { NextResponse, type NextRequest } from "next/server"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

/**
 * Guards the /dashboard subtree and keeps the session alive.
 *
 * Two jobs, both of which must happen BEFORE any component renders:
 *
 * 1. Gate. Next renders `layout.tsx` and `page.tsx` in PARALLEL, so a session
 *    check inside the layout cannot stop the page from rendering — every
 *    dashboard page is a Server Component that fetches authed data on sight. A
 *    logged-out visitor would throw a 401 out of the render tree instead of
 *    seeing the login screen.
 *
 * 2. Refresh. The access token lives 30 minutes; the refresh token 7 days. When
 *    the access token lapses, the render 401s and NOTHING recovers it: a Server
 *    Component cannot write cookies onto the browser, and the backend rotates
 *    refresh tokens single-use, so refreshing from inside a render would burn the
 *    token with no way to hand the new one back. Here we can — we own the
 *    response, so the rotated cookies go to the browser AND to this render.
 */
export async function proxy(request: NextRequest) {
  const hasRefresh = request.cookies.has("refresh_token")
  const hasAccess = request.cookies.has("access_token")

  // No refresh token: genuinely no session.
  if (!hasRefresh) return redirectToLogin(request)

  // Session is live.
  if (hasAccess) return NextResponse.next()

  // Refresh token but no access token: expired. Rotate it.
  const refreshed = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { cookie: request.headers.get("cookie") ?? "" },
  }).catch(() => null)

  if (!refreshed?.ok) return redirectToLogin(request)

  // Replay the new cookies onto BOTH the downstream render and the browser.
  const setCookie = refreshed.headers.getSetCookie()
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ")

  const headers = new Headers(request.headers)
  const existing = request.headers.get("cookie")
  headers.set("cookie", existing ? `${existing}; ${cookieHeader}` : cookieHeader)

  const response = NextResponse.next({ request: { headers } })
  for (const cookie of setCookie) response.headers.append("set-cookie", cookie)
  return response
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
