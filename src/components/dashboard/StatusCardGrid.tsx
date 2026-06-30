import { statusCards } from "@/data/dashboard-data"
import StatusCard from "./StatusCard"

export default function StatusCardGrid() {
  return (
    <div className="grid grid-cols-3 gap-[15px]">
      {statusCards.map((card) => (
        <StatusCard key={card.id} card={card} />
      ))}
    </div>
  )
}