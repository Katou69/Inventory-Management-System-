"use client"

import { useAuth } from "@/lib/auth/auth-context"
import AuthPage from "./AuthPage"

// children is optional: the dashboard layout resolves the session server-side and
// renders <AuthGate /> bare when logged out, so the authed subtree is never built.
export default function AuthGate({ children }: { children?: React.ReactNode }) {
  const { user, ready } = useAuth()

  // Avoid a flash of the login screen before persisted state hydrates.
  if (!ready) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    return <AuthPage />
  }

  return <>{children}</>
}
