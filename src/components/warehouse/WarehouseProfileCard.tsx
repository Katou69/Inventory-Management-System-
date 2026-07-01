import { Warehouse as WarehouseIcon, User, MapPin, Phone, Mail, CalendarClock, CalendarCheck } from "lucide-react"
import type { WarehouseDetail } from "@/types/dashboard"
import { warehouseStatusStyle, warehouseStatusDot } from "./statusStyles"

export default function WarehouseProfileCard({ wh }: { wh: WarehouseDetail }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Photo / icon */}
        <div className="size-32 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
          <WarehouseIcon className="size-14 text-indigo-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-xl font-bold text-slate-900">{wh.name}</h2>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${warehouseStatusStyle[wh.status]}`}>
              <span className={`size-1.5 rounded-full ${warehouseStatusDot[wh.status]}`} />
              {wh.status}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium">
              {wh.warehouseId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 mt-4">
            <InfoRow icon={User}          label="Manager"         value={wh.manager} />
            <InfoRow icon={MapPin}        label="Address"         value={wh.address} />
            <InfoRow icon={Phone}         label="Phone"           value={wh.phone} />
            <InfoRow icon={Mail}          label="Email"           value={wh.email} />
            <InfoRow icon={CalendarCheck} label="Last Inspection" value={wh.lastInspection} />
            <InfoRow icon={CalendarClock} label="Next Inspection" value={wh.nextInspection} highlight />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon, label, value, highlight,
}: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 leading-tight">{label}</p>
        <p className={`text-sm font-medium leading-tight truncate ${highlight ? "text-indigo-600" : "text-slate-800"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
