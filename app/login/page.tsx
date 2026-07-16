import { Suspense } from "react"
import { AuthPage } from "@/components/auth"

// The login screen itself must never be gated — middleware redirects logged-out
// dashboard visitors here, and AuthPage only calls unauthenticated endpoints.
export default function LoginPage() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  )
}
