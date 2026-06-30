import Header from "./Header"
import Sidebar from "./Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-[#f6ffff] p-[30px_35px] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}