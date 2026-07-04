import { useState, useEffect, useRef } from "react";
import { Bell, Sun, Moon, LogOut, ChevronDown, Building2, Shield, Search } from "lucide-react";
import { UserType, Theme, Page } from "../types";
import { initials, avatarColor } from "../utils";
import Badge from "./Badge";

export default function Header({
  user, theme, setTheme, onLogout, page
}: {
  user: UserType; theme: Theme; setTheme: (t: Theme) => void;
  onLogout: () => void; page: Page;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pageLabels: Record<Page, string> = {
    dashboard: "Dashboard",
    inventory: "Inventory",
    orders: "Orders",
    purchase: "Purchase Orders",
    users: "User Management",
    settings: "Settings",
  };

  return (
    <header className="h-14 border-b border-border flex items-center px-5 gap-3 shrink-0 bg-card">
      <h2 className="font-display text-xl font-bold flex-1">{pageLabels[page]}</h2>

      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="pl-8 pr-4 py-1.5 text-sm bg-input-background border border-border rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
        />
      </div>

      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>

      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: avatarColor(user.id) }}
          >
            {initials(user.name)}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-medium">{user.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{user.role}</p>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-60 bg-card border border-border rounded-xl shadow-xl py-1 z-50">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: avatarColor(user.id) }}
                >
                  {initials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge status={user.role} />
                <Badge status={user.status} />
                {user.warehouse !== "All"
                  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-secondary text-secondary-foreground"><Building2 className="w-2.5 h-2.5" />{user.warehouse}</span>
                  : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-secondary text-secondary-foreground"><Shield className="w-2.5 h-2.5" />All Warehouses</span>
                }
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}



