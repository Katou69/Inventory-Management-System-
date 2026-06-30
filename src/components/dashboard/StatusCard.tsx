import { Package, DollarSign, Truck, TrendingUp, AlertTriangle, ClipboardCheck } from "lucide-react"
import type { StatusCard as StatusCardType } from "@/types/dashboard"

const iconMap = {
  stocks: Package,
  value: DollarSign,
  suppliers: Truck,
  revenue: TrendingUp,
  lowStock: AlertTriangle,
  orders: ClipboardCheck,
}

interface StatusCardProps {
  card: StatusCardType
}

export default function StatusCard({ card }: StatusCardProps) {
  const Icon = iconMap[card.icon]

  return (
    <div className="bg-white relative rounded-[10px] border border-[#515151] p-[20px] flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <p className="font-sans font-light text-[16px] text-black leading-[normal]">
          {card.label}
        </p>
        <div className="size-[36px] flex items-center justify-center">
          <svg className="size-full" fill="none" viewBox="0 0 24 24">
            <path d="M2 22L22 2M22 22V2H2" stroke="#34C759" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          </svg>
        </div>
      </div>
      <p className="font-sans font-bold text-[28px] text-black leading-[normal]">
        {card.value}
      </p>
      <p className="font-sans font-normal text-[12px] text-black leading-[normal]">
        {card.changeText}
      </p>
    </div>
  )
}