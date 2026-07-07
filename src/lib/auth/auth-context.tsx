"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { UserType, Theme } from "@/types/user"

interface AuthContextValue {
  user: UserType | null
  login: (user: UserType) => void
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

  // Hydrate persisted state on mount (client only). This must be an effect:
  // localStorage is unavailable during SSR, so state is synced from storage
  // after mount. setState here is the intended pattern for this case.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const rawUser = localStorage.getItem(USER_KEY)
      if (rawUser) setUser(JSON.parse(rawUser))
      const rawTheme = localStorage.getItem(THEME_KEY) as Theme | null
      if (rawTheme === "light" || rawTheme === "dark") setThemeState(rawTheme)
    } catch {
      /* ignore malformed storage */
    }
    setReady(true)
    /* eslint-enable react-hooks/set-state-in-effect */
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

  const login = (u: UserType) => {
    setUser(u)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } catch {
      /* ignore */
    }
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
  }

  const setTheme = (t: Theme) => setThemeState(t)

  return (
    <AuthContext.Provider value={{ user, login, logout, theme, setTheme, ready }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
