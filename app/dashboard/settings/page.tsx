"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { SettingsView } from "@/components/settings"

export default function SettingsPage() {
  const { user } = useAuth()
  if (!user || user.role === "staff") {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        You don&apos;t have access to settings.
      </div>
    )
  }
  return <SettingsView role={user.role} userWarehouseId={user.warehouseId} />
}
