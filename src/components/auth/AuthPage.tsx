"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Warehouse, Package, Building2, Shield, TrendingUp, User, Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { Role } from "@/types/user";
import type { Warehouse as WarehouseEntity } from "@/types/dashboard";
import { getWarehouseOptions } from "@/services/dashboard-service";
import { useAuth } from "@/lib/auth/auth-context";
import { config } from "@/lib/config";
import { ApiError } from "@/lib/api-client";
import { loginSchema, registerSchema } from "@/schemas/auth";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">{children}</div>
    </div>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{children}</span>
  );
}

const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase, a number & a symbol";

export default function AuthPage() {
  const { signIn, signUp, signInDemo, theme, setTheme } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [warehouses, setWarehouses] = useState<Pick<WarehouseEntity, "id" | "name">[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", warehouseId: 1 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick-login demo buttons are mock-only.
  const isMock = config.useMockAuth;

  // Unauthed endpoint: this page is precisely where there is no session yet.
  // Swallow failures so a backend hiccup leaves the dropdown empty rather than
  // taking down the whole login screen with an unhandled rejection.
  useEffect(() => { void getWarehouseOptions().then(setWarehouses).catch(() => setWarehouses([])); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const result = mode === "signup" ? registerSchema.safeParse(form) : loginSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(form.name, form.email, form.password, form.warehouseId);
        setSuccess("Account created successfully! Please wait for admin approval.");
        // Reset form
        setForm({ name: "", email: "", password: "", warehouseId: 1 });
      } else {
        await signIn(form.email, form.password);
        router.push(searchParams.get("next") ?? "/dashboard");
      }
    } catch (err) {
      let message = mode === "signup" ? "Sign up failed. Please try again." : "Sign in failed. Please try again.";
      if (err instanceof ApiError) {
        if (err.status === 401) message = err.message || "Invalid email or password";
        else if (err.status === 409) message = "An account with this email already exists";
        else if (err.status === 429) message = err.message || "Too many login attempts. Please try again later.";
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const demoLogin = (role: Role) => {
    signInDemo(role);
    router.push(searchParams.get("next") ?? "/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Brand panel */}
      <div className="hidden lg:flex w-[460px] flex-col bg-[#0D1B2A] dark:bg-[#080F18] text-white p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 border border-white/5 rounded-full" />
          <div className="absolute top-20 -left-12 w-[500px] h-[500px] border border-white/5 rounded-full" />
          <div className="absolute bottom-0 right-0 w-64 h-64 border border-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 bg-[#1A6B8A] rounded-lg flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">GRGI</span>
          </div>
          <h1 className="font-display text-[42px] font-bold leading-[1.1] mb-5">
           Inventory &<br />Warehouse<br />Management
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-[280px]">
            End-to-end supply chain visibility across all warehouse locations and beverage categories.
          </p>
          <div className="space-y-3">
            {[
              { icon: Package, text: "Real-time inventory tracking" },
              { icon: Building2, text: "Multi-warehouse management" },
              { icon: Shield, text: "Role-based access control" },
              { icon: TrendingUp, text: "Stock flow analytics" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-[#4BAFD4]" />
                </div>
                <span className="text-sm text-white/60">{text}</span>
              </div>
            ))}
          </div>
        </div>
        {isMock && (
          <div className="relative z-10 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-3">Quick Demo Access</p>
            <div className="flex gap-2">
              {(["admin", "manager", "staff"] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => demoLogin(r)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium capitalize border border-white/15 hover:bg-white/10 hover:border-white/25 transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-8 pb-12">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Warehouse className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-lg font-bold">GRGI Inventory</span>
            </div>

            <h2 className="text-2xl font-bold mb-1">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground text-sm mb-7">
              {mode === "login" ? "Sign in to your workspace" : "Set up your GRGI access"}
            </p>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <Field label="Full Name">
                  <FieldIcon><User className="w-3.5 h-3.5" /></FieldIcon>
                  <input
                    type="text"
                    placeholder="Jordan Blake"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="field-input pl-9"
                  />
                </Field>
              )}
              <Field label="Email Address">
                <FieldIcon><Mail className="w-3.5 h-3.5" /></FieldIcon>
                <input
                  type="email"
                  placeholder="you@grandroyal.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="field-input pl-9"
                />
              </Field>
              <Field label="Password">
                <FieldIcon><Lock className="w-3.5 h-3.5" /></FieldIcon>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="field-input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </Field>
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground -mt-2">{PASSWORD_HINT}</p>
              )}

              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Warehouse</label>
                  <div className="grid grid-cols-2 gap-2">
                    {warehouses.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, warehouseId: w.id }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${
                          form.warehouseId === w.id
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <Building2 className="w-3 h-3 shrink-0" />
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? (mode === "login" ? "Signing in…" : "Creating account…")
                  : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
                className="text-primary font-medium hover:underline"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>

            <div className={`lg:hidden mt-8 pt-6 border-t border-border${isMock ? "" : " hidden"}`}>
              <p className="text-[10px] text-muted-foreground text-center mb-3 font-mono uppercase tracking-widest">Quick Demo</p>
              <div className="flex gap-2">
                {(["admin", "manager", "staff"] as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => demoLogin(r)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium capitalize border border-border hover:bg-accent transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
