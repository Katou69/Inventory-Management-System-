"use client"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Bell, Search, Package, Warehouse as WarehouseIcon, X, LogOut, User, Settings } from "lucide-react"
import { markAllNotificationsRead, markNotificationRead } from "@/services/dashboard-service"
import type { NotificationType, Product, Warehouse, NotificationItem } from "@/types/dashboard"

const notifTone: Record<NotificationType, string> = {
  stock: "bg-indigo-100 text-indigo-600",
  order: "bg-sky-100 text-sky-600",
  alert: "bg-amber-100 text-amber-600",
  user:  "bg-violet-100 text-violet-600",
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

  const unread = notifs.filter((n) => n.unread).length

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { products: [], warehouses: [] }
    return {
      products: products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 4),
      warehouses: warehouses.filter((w) => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q) || w.warehouseId.toLowerCase().includes(q)).slice(0, 4),
    }
  }, [query])

  const hasResults = results.products.length > 0 || results.warehouses.length > 0
  const showDropdown = searchFocused && query.trim().length > 0

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 w-full shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 rounded-lg h-9 w-9 flex items-center justify-center shadow-sm">
          <span className="text-white text-lg font-bold leading-none">G</span>
        </div>
        <span className="font-semibold text-lg text-slate-900 tracking-tight">GRGI Inventory</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search products, warehouses..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 transition-colors">
              <X className="size-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg py-2 max-h-96 overflow-y-auto z-30">
            {!hasResults && (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">No results for “{query}”.</p>
            )}
            {results.warehouses.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Warehouses</p>
                {results.warehouses.map((w) => (
                  <Link key={w.id} href={`/dashboard/warehouse/${w.id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors">
                    <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <WarehouseIcon className="size-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.warehouseId} · {w.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {results.products.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Products</p>
                {results.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors cursor-default">
                    <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Package className="size-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.category} · {p.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setUserOpen(false) }}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="size-5 text-slate-500" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-indigo-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                {unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Notifications</p>
                  {unread > 0 && (
                    <button onClick={() => { setNotifs((ns) => ns.map((n) => ({ ...n, unread: false }))); void markAllNotificationsRead() }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { setNotifs((ns) => ns.map((x) => x.id === n.id ? { ...x, unread: false } : x)); if (n.unread) void markNotificationRead(n.id) }}
                      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${n.unread ? "bg-indigo-50/40" : ""}`}
                    >
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${notifTone[n.type]}`}>
                        <Bell className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                          {n.unread && <span className="size-1.5 rounded-full bg-indigo-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 leading-snug mt-0.5">{n.description}</p>
                        <p className="text-xs text-slate-300 mt-1">{n.time}</p>
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
            className="flex items-center gap-2.5 rounded-lg hover:bg-slate-100 transition-colors py-1 px-1.5"
          >
            <div className="size-9 bg-indigo-100 rounded-full flex items-center justify-center ring-2 ring-indigo-200">
              <span className="text-indigo-700 text-sm font-semibold">U</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-tight">User</p>
              <p className="text-xs text-slate-400 leading-tight">Admin</p>
            </div>
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30">
                <Link href="/dashboard/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <User className="size-4 text-slate-400" /> Profile
                </Link>
                <Link href="/dashboard/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Settings className="size-4 text-slate-400" /> Settings
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={() => setUserOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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