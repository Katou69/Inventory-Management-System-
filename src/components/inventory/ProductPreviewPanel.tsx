import type { ElementType } from "react"
import { Tag, Truck, DollarSign } from "lucide-react"
import WarehouseImagePicker from "@/components/warehouse/WarehouseImagePicker"

export default function ProductPreviewPanel({
  photo, onPhotoChange, name, categoryName, supplierName, unitPrice,
}: {
  photo: string | null
  onPhotoChange: (url: string | null) => void
  name: string
  categoryName: string
  supplierName: string
  unitPrice: number
}) {
  return (
    <div className="w-full sm:w-44 shrink-0 flex flex-col items-center sm:items-start gap-4 sm:border-r sm:border-border sm:pr-5">
      <WarehouseImagePicker value={photo} onChange={onPhotoChange} />
      <div className="w-full text-center sm:text-left">
        <p className="text-sm font-semibold text-foreground truncate">{name || "New product"}</p>
      </div>
      <div className="w-full flex flex-col gap-2.5">
        <PreviewRow icon={Tag} value={categoryName || "No category"} />
        <PreviewRow icon={Truck} value={supplierName || "No supplier"} />
        <PreviewRow icon={DollarSign} value={`$${unitPrice.toFixed(2)}`} />
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
