"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, ShoppingCart, ClipboardList, Users, Settings, Package, LogOut, User, ChevronDown } from "lucide-react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Inventory", icon: Package,         href: "/dashboard/inventory" },
  { label: "Orders",    icon: ShoppingCart,    href: "/dashboard/orders" },
  { label: "Purchase",  icon: ClipboardList,   href: "/dashboard/purchase" },
  { label: "Users",     icon: Users,           href: "/dashboard/users" },
  { label: "Settings",  icon: Settings,        href: "/dashboard/settings" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <aside className="bg-slate-900 w-[230px] shrink-0 flex flex-col gap-1 px-3 py-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest px-3 mb-2">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800 relative">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg border border-slate-700 shadow-lg py-1 z-20">
              <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                <User className="size-4" /> View profile
              </Link>
              <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                <Settings className="size-4" /> Settings
              </Link>
              <div className="my-1 border-t border-slate-700" />
              <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer transition-colors"
        >
          <div className="size-7 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
            <span className="text-slate-300 text-xs font-semibold">U</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium text-slate-300 truncate">User Account</p>
            <p className="text-xs text-slate-500 truncate">Admin</p>
          </div>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  )
}
