import { Warehouse as WarehouseIcon, User, MapPin, Phone, Mail, CalendarClock, CalendarCheck } from "lucide-react"
import type { WarehouseDetail } from "@/types/dashboard"
import { warehouseStatusStyle, warehouseStatusDot } from "./statusStyles"

export default function WarehouseProfileCard({ wh }: { wh: WarehouseDetail }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Photo / icon */}
        <div className="relative size-32 rounded-2xl overflow-hidden bg-[#E5F0F5] dark:bg-primary/20 ring-1 ring-[#1A6B8A]/20 dark:ring-primary/30 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
          {wh.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- may be a blob:/local preview URL, which next/image can't optimize
            <img src={wh.image} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <WarehouseIcon className="size-14 text-[#1A6B8A] dark:text-primary" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-xl font-bold text-foreground">{wh.name}</h2>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${warehouseStatusStyle[wh.status]}`}>
              <span className={`size-1.5 rounded-full ${warehouseStatusDot[wh.status]}`} />
              {wh.status}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-mono font-medium">
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
      <div className="size-8 rounded-lg bg-accent border border-border flex items-center justify-center shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className={`text-sm font-medium leading-tight truncate ${highlight ? "text-[#1A6B8A] dark:text-primary" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
