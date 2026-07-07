"use client"

import { useAuth } from "@/lib/auth/auth-context"
import AuthPage from "./AuthPage"

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, login, theme, setTheme, ready } = useAuth()

  // Avoid a flash of the login screen before persisted state hydrates.
  if (!ready) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    return <AuthPage onLogin={login} theme={theme} setTheme={setTheme} />
  }

  return <>{children}</>
}
