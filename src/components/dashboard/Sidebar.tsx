import { LayoutDashboard, Search, ShoppingCart, ClipboardList, Users, Settings, ChevronDown } from "lucide-react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Inventory", icon: Search },
  { label: "Order", icon: ShoppingCart },
  { label: "Purchase", icon: ClipboardList, hasArrow: true },
  { label: "Users", icon: Users, hasArrow: true },
  { label: "Settings", icon: Settings, hasArrow: true },
]

export default function Sidebar() {
  return (
    <aside className="bg-[#f6ffff] w-[250px] h-full border-r border-[#232323] flex flex-col gap-[30px] px-[15px] py-[20px] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
      <nav className="flex flex-col gap-[5px]">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-[14px] py-[8px] rounded-[8px] text-gray-900 ${
              item.active ? "bg-[#70f1f1]" : ""
            }`}
          >
            <item.icon className="size-5 text-gray-900" />
            <span className={`flex-1 text-[16px] ${
              item.active ? "font-mono font-semibold" : "font-mono font-normal"
            }`}>
              {item.label}
            </span>
            {item.hasArrow && (
              <ChevronDown className="size-5 text-gray-900 rotate-180 opacity-60" />
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}