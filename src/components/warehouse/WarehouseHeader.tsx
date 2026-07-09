"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

export default function WarehouseHeader({
  name, onEdit,
}: { name: string; onEdit: () => void }) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Warehouses</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <Pencil className="size-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
      </div>
    </div>
  )
}
