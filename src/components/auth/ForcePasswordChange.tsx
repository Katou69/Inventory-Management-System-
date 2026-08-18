"use client"

import { useState } from "react";
import { Lock, Eye, EyeOff, Warehouse } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api-client";
import { changePasswordSchema } from "@/schemas/auth";

const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase, a number & a symbol";

// Shown by AuthGate in place of the dashboard when the signed-in user's
// mustChangePassword flag is set (admin-provisioned accounts get a temp
// password and must replace it before doing anything else).
export default function ForcePasswordChange() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = changePasswordSchema.safeParse({ current, next });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(current, next);
    } catch (err) {
      let message = "Could not change password. Please try again.";
      if (err instanceof ApiError && err.status === 401) message = "Current password is incorrect";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Warehouse className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-lg font-bold">GRGI Inventory</span>
        </div>

        <h2 className="text-2xl font-bold mb-1 text-center">Set a new password</h2>
        <p className="text-muted-foreground text-sm mb-7 text-center">
          Your account was created with a temporary password. Choose a new one to continue.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Temporary password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="field-input pl-9"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">New password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="field-input pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{PASSWORD_HINT}</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
