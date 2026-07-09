"use client"
import { useState } from "react"
import { MoreVertical, TrendingUp, Target, RotateCcw, X } from "lucide-react"
import { updateSalesGoal } from "@/services/dashboard-service"

interface SalesGaugeProps {
  numberOfSales?: number
  totalSales?: number
  defaultTarget?: number
}

const W       = 220
const H       = 130
const CX      = 110
const CY      = 118
const R_INNER = 52
const R_OUTER = 100
const N_LINES = 160

function buildSpokes(percent: number) {
  const spokes = []
  for (let i = 0; i < N_LINES; i++) {
    const t     = i / (N_LINES - 1)
    const angle = Math.PI - t * Math.PI
    const cos   = Math.cos(angle)
    const sin   = Math.sin(angle)
    spokes.push({
      x1: Math.round((CX + R_INNER * cos) * 1e4) / 1e4,
      y1: Math.round((CY - R_INNER * sin) * 1e4) / 1e4,
      x2: Math.round((CX + R_OUTER * cos) * 1e4) / 1e4,
      y2: Math.round((CY - R_OUTER * sin) * 1e4) / 1e4,
      filled: t <= percent / 100,
    })
  }
  return spokes
}

export default function SalesGauge({
  numberOfSales = 1233,
  totalSales = 15233,
  defaultTarget = 21365,
}: SalesGaugeProps) {
  const [target, setTarget] = useState(defaultTarget)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(defaultTarget))

  const percent = Math.min(100, Math.round((totalSales / target) * 1000) / 10)
  const spokes = buildSpokes(percent)
  const onTrack = percent >= 60

  async function saveTarget(e: React.FormEvent) {
    e.preventDefault()
    const val = Number(draft)
    if (val > 0) {
      setTarget(val) // optimistic
      const updated = await updateSalesGoal(val)
      setTarget(updated.target)
    }
    setEditing(false)
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Sales Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Goal: ${target.toLocaleString()}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <MoreVertical className="size-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-lg border border-border shadow-lg py-1 z-20">
                <button
                  onClick={() => { setDraft(String(target)); setEditing(true); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                >
                  <Target className="size-4 text-muted-foreground" /> Edit goal target
                </button>
                <button
                  onClick={() => { setTarget(defaultTarget); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                >
                  <RotateCcw className="size-4 text-muted-foreground" /> Reset to default
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 py-2">
        <div className="relative w-full">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {spokes.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} className="stroke-border" strokeWidth={1.6} strokeLinecap="round" />
            ))}
            {spokes.filter((s) => s.filled).map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="url(#spokeGrad)" strokeWidth={1.6} strokeLinecap="round" />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <p className="text-3xl font-bold text-foreground leading-none">{percent}%</p>
            <p className="text-xs text-muted-foreground mt-1">Sales Goal</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${onTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          <TrendingUp className="size-3.5" />
          {onTrack ? "On track for this month" : "Behind goal this month"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Number of sales</p>
          <p className="text-lg font-bold text-foreground">{numberOfSales.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
          <p className="text-lg font-bold text-foreground">${totalSales.toLocaleString()}</p>
        </div>
      </div>

      {/* Edit goal modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-xs p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Edit goal target</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={saveTarget} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Monthly target ($)</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </label>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={!(Number(draft) > 0)} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
