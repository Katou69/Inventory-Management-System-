import { LayoutDashboard, Package, ShoppingCart, Truck, Users, Settings as SettingsIcon, ChevronLeft, Warehouse } from "lucide-react";
import { Page, Role } from "../types";

export default function Sidebar({
  page, setPage, collapsed, setCollapsed, role
}: {
  page: Page; setPage: (p: Page) => void;
  collapsed: boolean; setCollapsed: (c: boolean) => void;
  role: Role;
}) {
  const nav = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory" as Page, label: "Inventory", icon: Package },
    { id: "orders" as Page, label: "Orders", icon: ShoppingCart },
    { id: "purchase" as Page, label: "Purchase", icon: Truck },
    { id: "users" as Page, label: "Users", icon: Users, hide: role === "staff" },
    { id: "settings" as Page, label: "Settings", icon: SettingsIcon, hide: role === "staff" },
  ].filter(n => !n.hide);

  return (
    <div className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 shrink-0 ${collapsed ? "w-[56px]" : "w-[212px]"}`}>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-sidebar-border shrink-0 ${collapsed ? "justify-center px-0" : "px-4 gap-2.5"}`}>
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Warehouse className="w-3.5 h-3.5 text-white" />
        </div>
        {!collapsed && <span className="font-display text-lg font-bold text-sidebar-foreground">GRGI</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {nav.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              title={collapsed ? label : undefined}
              className={`
                w-full flex items-center gap-3 rounded-md text-sm transition-colors
                ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
                ${active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
          className={`
            w-full flex items-center gap-3 rounded-md text-sm text-sidebar-foreground/40
            hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors
            ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
          `}
        >
          <ChevronLeft className={`w-4 h-4 shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}
