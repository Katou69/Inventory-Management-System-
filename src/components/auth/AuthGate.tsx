"use client"

import { useAuth } from "@/lib/auth/auth-context"
import AuthPage from "./AuthPage"

// children is optional: the dashboard layout resolves the session server-side and
// renders <AuthGate /> bare when logged out, so the authed subtree is never built.
export default function AuthGate({ children }: { children?: React.ReactNode }) {
  const { user, ready, settling } = useAuth()

  // Avoid a flash of the login screen before persisted state hydrates.
  //
  // `settling` covers the same hazard on the other side: between an identity
  // change and the server re-rendering, `children` is still the OUTGOING user's
  // dashboard. Rendering it because `user` is already truthy is what showed the
  // incoming user a split second of the previous user's dashboard.
  if (!ready || settling) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    return <AuthPage />
  }

  return <>{children}</>
}
