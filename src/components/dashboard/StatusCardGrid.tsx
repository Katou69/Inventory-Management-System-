import StatusCard from "./StatusCard"
import type { StatusCard as StatusCardType } from "@/types/dashboard"

export default function StatusCardGrid({ cards }: { cards: StatusCardType[] }) {
  return (
    <div className="grid grid-cols-3 gap-[15px]">
      {cards.map((card) => (
        <StatusCard key={card.id} card={card} />
      ))}
    </div>
  )
}
