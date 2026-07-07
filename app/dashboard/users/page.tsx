"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { UsersView } from "@/components/users"

export default function UsersPage() {
  const { user } = useAuth()
  if (!user || user.role === "staff") {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        You don&apos;t have access to user management.
      </div>
    )
  }
  return <UsersView role={user.role} userWarehouseId={user.warehouseId} />
}
