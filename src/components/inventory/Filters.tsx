import { Search, LayoutGrid, List } from "lucide-react";

export default function Filters() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-4">

      {/* Search */}
      <div className="relative flex-1 min-w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />

        <input
          type="text"
          placeholder="Search by name, SKU, supplier..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none"
        />
      </div>

      {/* Category */}
      <select className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600">
        <option>All Categories</option>
      </select>

      {/* Supplier */}
      <select className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600">
        <option>All Suppliers</option>
      </select>


    </div>
  );
}