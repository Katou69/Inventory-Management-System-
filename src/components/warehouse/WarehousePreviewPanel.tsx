import type { ElementType } from "react"
import { User, Phone, MapPin } from "lucide-react"
import WarehouseImagePicker from "./WarehouseImagePicker"
import { warehouseStatusStyle, warehouseStatusDot } from "./statusStyles"
import type { WarehouseStatus } from "@/types/dashboard"

export default function WarehousePreviewPanel({
  photo, onPhotoChange, name, status, manager, phone, address,
}: {
  photo: string | null
  onPhotoChange: (url: string | null) => void
  name: string
  status: WarehouseStatus
  manager: string
  phone: string
  address: string
}) {
  return (
    <div className="w-full sm:w-44 shrink-0 flex flex-col items-center sm:items-start gap-4 sm:border-r sm:border-border sm:pr-5">
      <WarehouseImagePicker value={photo} onChange={onPhotoChange} />
      <div className="w-full text-center sm:text-left">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${warehouseStatusStyle[status]}`}>
          <span className={`size-1.5 rounded-full ${warehouseStatusDot[status]}`} />
          {status}
        </span>
      </div>
      <div className="w-full flex flex-col gap-2.5">
        <PreviewRow icon={User} value={manager || "—"} />
        <PreviewRow icon={Phone} value={phone || "—"} />
        <PreviewRow icon={MapPin} value={address || "—"} />
      </div>
    </div>
  )
}

function PreviewRow({ icon: Icon, value }: { icon: ElementType; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  )
}
