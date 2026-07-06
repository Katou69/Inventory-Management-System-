"use client"
/**
 * Hosts the shared ZoneLayoutCanvas on the warehouse detail page.
 *
 * The app has no auth yet, so the viewer's role comes from a demo switcher
 * here. Once auth lands, delete the switcher and pass the session's real role
 * straight into <ZoneLayoutCanvas role={...} /> — the canvas itself is already
 * fully role-parameterized.
 */
import { useState } from "react"
import ZoneLayoutCanvas from "./ZoneLayoutCanvas"
import type { ViewerRole } from "@/types/dashboard"

const ROLES: { key: ViewerRole; label: string; viewer: string }[] = [
  { key: "admin",   label: "Admin",   viewer: "Admin User" },
  { key: "manager", label: "Manager", viewer: "Aung Htoo Pyae" },
  { key: "staff",   label: "Staff",   viewer: "Warehouse Staff" },
]

export default function ZoneLayoutSection({ warehouseId }: { warehouseId: number }) {
  const [role, setRole] = useState<ViewerRole>("admin")
  const viewer = ROLES.find((r) => r.key === role)!

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-slate-400">Viewing as (demo):</span>
        <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                role === r.key ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ZoneLayoutCanvas warehouseId={warehouseId} role={role} viewerName={viewer.viewer} />
    </div>
  )
}
