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

  // Access token present AND not past its own `exp`: trust it and pass through.
  // We only read the unverified `exp` claim here (no secret, no signature check) —
  // enough to catch a lapsed token so we refresh instead of shipping a render that
  // 401s server-side with no way to recover. Signature/revocation stay the
  // backend's job: a forged or revoked-but-unexpired token still 401s at the
  // render, and the client recovers it on hydration.
  if (hasAccess && !isExpired(request.cookies.get("access_token")?.value)) {
    return NextResponse.next()
  }

  // No access token, or it's expired. Rotate via the refresh token.
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

/**
 * True if the JWT is absent, unparseable, or past its `exp`. Reads the payload's
 * `exp` claim WITHOUT verifying the signature — proxy has no secret and this is
 * only an "is it worth refreshing?" hint, never an authorization decision.
 * A malformed token counts as expired so we fall through to refresh.
 */
function isExpired(token: string | undefined): boolean {
  if (!token) return true
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf-8"),
    )
    // `exp` is seconds since epoch; Date.now() is ms.
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
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
