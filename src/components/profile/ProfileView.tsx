"use client"

import { useState } from "react";
import { Mail, Building2, Shield, Calendar, Lock, Eye, EyeOff } from "lucide-react";
import type { UserType } from "@/types/user";
import { initials, avatarColor } from "@/lib/format";
import { Badge, FormField } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api-client";
import { changePasswordSchema } from "@/schemas/auth";

export default function ProfileView({ user, warehouseName }: { user: UserType; warehouseName: string }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const result = changePasswordSchema.safeParse({ current, next });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Current password is incorrect" : "Could not change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your account details and security</p>
      </div>

      {/* Identity card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0"
            style={{ backgroundColor: avatarColor(user.id) }}
          >
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2.5">
            <Shield className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <div className="mt-0.5"><Badge status={user.role} /></div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Building2 className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Warehouse</p>
              <p className="text-sm text-foreground font-medium">{warehouseName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm text-foreground font-medium truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm text-foreground font-medium">{user.joinedDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Change password</h2>
        <p className="text-xs text-muted-foreground mb-4">
          At least 8 characters, with uppercase, lowercase, a number & a symbol.
        </p>

        <form onSubmit={submit} className="space-y-4 max-w-sm">
          <FormField label="Current password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="modal-input pl-8"
              />
            </div>
          </FormField>
          <FormField label="New password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="modal-input pl-8 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </FormField>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2">
              Password updated.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !current || !next}
            className="py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
