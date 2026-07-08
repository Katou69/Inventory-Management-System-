"use client"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Bell, Search, Package, Warehouse as WarehouseIcon, X, LogOut, Settings, Sun, Moon } from "lucide-react"
import { markAllNotificationsRead, markNotificationRead } from "@/services/dashboard-service"
import type { NotificationType, Product, Warehouse, NotificationItem } from "@/types/dashboard"
import { useAuth } from "@/lib/auth/auth-context"
import { initials } from "@/lib/format"

const notifTone: Record<NotificationType, string> = {
  stock: "bg-[#E5F0F5] text-[#1A6B8A] dark:bg-[#1A6B8A]/20 dark:text-[#2B8BAD]",
  order: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  alert: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  user:  "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
}

export default function Header({
  products,
  warehouses,
  notifications: initialNotifications,
}: {
  products: Product[]
  warehouses: Warehouse[]
  notifications: NotificationItem[]
}) {
  const [query, setQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifs, setNotifs] = useState(initialNotifications)
  const { user, logout, theme, setTheme } = useAuth()

  const unread = notifs.filter((n) => n.unread).length

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { products: [], warehouses: [] }
    return {
      products: products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 4),
      warehouses: warehouses.filter((w) => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q) || w.warehouseId.toLowerCase().includes(q)).slice(0, 4),
    }
  }, [query, products, warehouses])

  const hasResults = results.products.length > 0 || results.warehouses.length > 0
  const showDropdown = searchFocused && query.trim().length > 0

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 w-full shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-3">
        <div className="bg-primary rounded-lg h-9 w-9 flex items-center justify-center shadow-sm">
          <WarehouseIcon className="text-white w-4.5 h-4.5" />
        </div>
        <span className="font-semibold text-lg text-foreground tracking-tight">GRGI</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search products, warehouses..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent transition-colors">
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg py-2 max-h-96 overflow-y-auto z-30">
            {!hasResults && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No results for “{query}”.</p>
            )}
            {results.warehouses.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Warehouses</p>
                {results.warehouses.map((w) => (
                  <Link key={w.id} href={`/dashboard/warehouse/${w.id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors">
                    <div className="size-8 rounded-lg bg-[#E5F0F5] dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <WarehouseIcon className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.warehouseId} · {w.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {results.products.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">Products</p>
                {results.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors cursor-default">
                    <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <Package className="size-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · {p.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title={theme === "light" ? "Switch to dark" : "Switch to light"}
        >
          {theme === "light" ? <Moon className="size-5 text-muted-foreground" /> : <Sun className="size-5 text-muted-foreground" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setUserOpen(false) }}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="size-5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-card">
                {unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl border border-border shadow-lg z-30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  {unread > 0 && (
                    <button onClick={() => { setNotifs((ns) => ns.map((n) => ({ ...n, unread: false }))); void markAllNotificationsRead() }} className="text-xs text-primary hover:text-primary/80 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { setNotifs((ns) => ns.map((x) => x.id === n.id ? { ...x, unread: false } : x)); if (n.unread) void markNotificationRead(n.id) }}
                      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-accent transition-colors ${n.unread ? "bg-primary/10" : ""}`}
                    >
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${notifTone[n.type]}`}>
                        <Bell className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                          {n.unread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{n.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen((v) => !v); setBellOpen(false) }}
            className="flex items-center gap-2.5 rounded-lg hover:bg-accent transition-colors py-1 px-1.5"
          >
            <div className="size-9 bg-[#E5F0F5] dark:bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-primary text-sm font-semibold">{user ? initials(user.name) : "U"}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground leading-tight capitalize">{user?.role ?? "Admin"}</p>
            </div>
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg py-1 z-30">
                {user && (
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
                {user?.role !== "staff" && (
                  <Link href="/dashboard/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                    <Settings className="size-4 text-muted-foreground" /> Settings
                  </Link>
                )}
                <div className="my-1 border-t border-border" />
                <button onClick={() => { setUserOpen(false); logout() }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}