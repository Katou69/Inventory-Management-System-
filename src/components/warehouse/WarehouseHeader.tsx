"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Download, MoreVertical, ArrowLeftRight } from "lucide-react"
import { useState } from "react"

export default function WarehouseHeader({ name }: { name: string }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <nav className="flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Warehouses</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate">{name}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeftRight className="size-4" />
          <span className="hidden sm:inline">Transfer</span>
        </button>
        <button className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <Download className="size-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button className="flex items-center gap-1.5 bg-[#1A6B8A] hover:bg-[#145570] text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Pencil className="size-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <MoreVertical className="size-4 text-slate-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-20">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Duplicate</button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Print label</button>
                <div className="my-1 border-t border-slate-100" />
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Archive warehouse</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
