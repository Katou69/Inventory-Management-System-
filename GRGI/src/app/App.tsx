import { useState, useEffect } from "react";
import { Theme, Page, UserType } from "./types";
import GlobalStyles from "./components/GlobalStyles";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import OrdersPage from "./pages/OrdersPage";
import PurchasePage from "./pages/PurchasePage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [user, setUser] = useState<UserType | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (!user) {
    return (
      <>
        <GlobalStyles />
        <AuthPage onLogin={setUser} theme={theme} setTheme={setTheme} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          page={page}
          setPage={setPage}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          role={user.role}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            user={user}
            theme={theme}
            setTheme={setTheme}
            onLogout={() => { setUser(null); setPage("dashboard"); }}
            page={page}
          />
          <main className="flex-1 overflow-y-auto p-5">
            {page === "dashboard" && <DashboardPage role={user.role} userWarehouse={user.warehouse} />}
            {page === "inventory" && <InventoryPage role={user.role} userWarehouse={user.warehouse} />}
            {page === "orders" && <OrdersPage role={user.role} userWarehouse={user.warehouse} />}
            {page === "purchase" && <PurchasePage role={user.role} userWarehouse={user.warehouse} />}
            {page === "users" && <UsersPage role={user.role} userWarehouse={user.warehouse} />}
            {page === "settings" && <SettingsPage role={user.role} userWarehouse={user.warehouse} />}
          </main>
        </div>
      </div>
    </>
  );
}
