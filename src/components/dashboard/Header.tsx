import { Bell, Search } from "lucide-react"

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 w-full shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 rounded-lg h-9 w-9 flex items-center justify-center shadow-sm">
          <span className="text-white text-lg font-bold leading-none">G</span>
        </div>
        <span className="font-semibold text-lg text-slate-900 tracking-tight">GRGI Inventory</span>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, warehouses..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="size-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-indigo-500 rounded-full ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="size-9 bg-indigo-100 rounded-full flex items-center justify-center ring-2 ring-indigo-200">
            <span className="text-indigo-700 text-sm font-semibold">U</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">User</p>
            <p className="text-xs text-slate-400 leading-tight">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}