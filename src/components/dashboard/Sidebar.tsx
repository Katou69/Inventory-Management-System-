import { LayoutDashboard, Search, ShoppingCart, ClipboardList, Users, Settings, ChevronRight, Package } from "lucide-react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Inventory", icon: Package },
  { label: "Orders", icon: ShoppingCart, hasArrow: true },
  { label: "Purchase", icon: ClipboardList, hasArrow: true },
  { label: "Users", icon: Users, hasArrow: true },
  { label: "Settings", icon: Settings, hasArrow: true },
]

export default function Sidebar() {
  return (
    <aside className="bg-slate-900 w-[230px] shrink-0 flex flex-col gap-1 px-3 py-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest px-3 mb-2">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              item.active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <item.icon className="size-4.5 shrink-0" />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.hasArrow && (
              <ChevronRight className="size-3.5 opacity-50" />
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer transition-colors">
          <div className="size-7 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
            <span className="text-slate-300 text-xs font-semibold">U</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">User Account</p>
            <p className="text-xs text-slate-500 truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
