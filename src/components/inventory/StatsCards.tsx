import { Package, AlertTriangle, CircleX } from "lucide-react";

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
          <Package className="text-blue-600 w-6 h-6" />
        </div>

        <div>
          <p className="text-sm text-slate-500">Total Items</p>
          <h2 className="text-3xl font-bold text-slate-900">12</h2>
        </div>
      </div>

      {/* Low Stock */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="text-amber-600 w-6 h-6" />
        </div>

        <div>
          <p className="text-sm text-slate-500">Low Stock</p>
          <h2 className="text-3xl font-bold text-slate-900">3</h2>
        </div>
      </div>

      {/* Out of Stock */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
          <CircleX className="text-red-600 w-6 h-6" />
        </div>

        <div>
          <p className="text-sm text-slate-500">Out of Stock</p>
          <h2 className="text-3xl font-bold text-slate-900">2</h2>
        </div>
      </div>
    </div>
  );
}