"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, ShoppingCart, ClipboardList, Users, Settings, Package, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { initials } from "@/lib/format"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Inventory", icon: Package,         href: "/dashboard/inventory" },
  { label: "Orders",    icon: ShoppingCart,    href: "/dashboard/orders" },
  { label: "Purchase",  icon: ClipboardList,   href: "/dashboard/purchase" },
  { label: "Users",     icon: Users,           href: "/dashboard/users",    staffHidden: true },
  { label: "Settings",  icon: Settings,        href: "/dashboard/settings", staffHidden: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  // Staff cannot see Users/Settings, matching GRGI's role-based nav.
  const items = navItems.filter((item) => !(item.staffHidden && user?.role === "staff"))

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <aside className="bg-sidebar w-[230px] shrink-0 flex flex-col gap-1 px-3 py-5 border-r border-sidebar-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/50"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-sidebar-border relative">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-lg border border-border shadow-lg py-1 z-20">
              {user?.role !== "staff" && (
                <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                  <Settings className="size-4" /> Settings
                </Link>
              )}
              <div className="my-1 border-t border-border" />
              <button onClick={() => { setMenuOpen(false); logout() }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer transition-colors"
        >
          <div className="size-9 bg-[#E5F0F5] dark:bg-primary/20 rounded-full flex items-center justify-center shrink-0 ring-2 ring-primary/20">
            <span className="text-primary text-sm font-semibold">{user ? initials(user.name) : "U"}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "User Account"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role ?? "Admin"}</p>
          </div>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  )
}
