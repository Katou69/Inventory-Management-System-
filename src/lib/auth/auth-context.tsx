"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { UserType, Theme, Role } from "@/types/user"
import { config } from "@/lib/config"
import { setAuthExpiredHandler } from "@/lib/api-client"
import * as authService from "@/services/auth-service"

interface AuthContextValue {
  user: UserType | null
  /** Sign in with credentials. Live mode validates against the backend; throws ApiError on failure. */
  signIn: (email: string, password: string) => Promise<void>
  /** Register a new account. Live mode always gets role "staff"; throws ApiError on failure (e.g. 409 duplicate email). */
  signUp: (name: string, email: string, password: string, warehouseId: number) => Promise<void>
  /** Mock-only quick demo login (no-op affordance when live). */
  signInDemo: (role: Role) => void
  logout: () => void
  theme: Theme
  setTheme: (t: Theme) => void
  ready: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_KEY = "grgi.user"
const THEME_KEY = "grgi.theme"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [theme, setThemeState] = useState<Theme>("light")
  const [ready, setReady] = useState(false)

  // Hydrate session + theme on mount (client only).
  // - Mock mode: restore the demo user from localStorage (zero-backend).
  // - Live mode: ask the backend who we are via the httpOnly cookie (no token in JS).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    let cancelled = false

    try {
      const rawTheme = localStorage.getItem(THEME_KEY) as Theme | null
      if (rawTheme === "light" || rawTheme === "dark") setThemeState(rawTheme)
    } catch {
      /* ignore malformed storage */
    }

    if (config.useMockAuth) {
      try {
        const rawUser = localStorage.getItem(USER_KEY)
        if (rawUser) setUser(JSON.parse(rawUser))
      } catch {
        /* ignore malformed storage */
      }
      setReady(true)
    } else {
      void authService
        .getCurrentUser()
        .then((u) => {
          if (!cancelled) setUser(u)
        })
        .catch(() => {
          /* not authenticated */
        })
        .finally(() => {
          if (!cancelled) setReady(true)
        })
    }

    return () => {
      cancelled = true
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Notify local state immediately if a session refresh fails (session truly
  // expired), instead of waiting for the user to hit another dead request.
  useEffect(() => {
    setAuthExpiredHandler(() => {
      setUser(null)
      persistMockUser(null)
    })
    return () => setAuthExpiredHandler(null)
  }, [])

  // Reflect theme on the document + persist it.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const persistMockUser = (u: UserType | null) => {
    // Only the mock demo persists the user object to localStorage; in live mode
    // the httpOnly cookie is the session and the user is re-fetched via /auth/me.
    if (!config.useMockAuth) return
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
  }

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const u = await authService.login(email, password)
    setUser(u)
    persistMockUser(u)
  }

  const signUp: AuthContextValue["signUp"] = async (name, email, password, warehouseId) => {
    const u = await authService.register(name, email, password, warehouseId)
    setUser(u)
    persistMockUser(u)
  }

  const signInDemo = (role: Role) => {
    const u = authService.demoLogin(role)
    setUser(u)
    persistMockUser(u)
  }

  const logout = () => {
    void authService.logout().catch(() => {
      /* clear locally regardless of network result */
    })
    setUser(null)
    persistMockUser(null)
  }

  const setTheme = (t: Theme) => setThemeState(t)

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signInDemo, logout, theme, setTheme, ready }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
