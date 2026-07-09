"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Plus, ArrowUpRight, X } from "lucide-react"
import { createWarehouse } from "@/services/dashboard-service"
import WarehouseImagePicker from "@/components/warehouse/WarehouseImagePicker"
import type { Warehouse } from "@/types/dashboard"

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = Math.round((used / total) * 100)
  const color = pct >= 85 ? "bg-red-500" : pct >= 65 ? "bg-amber-400" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{pct}%</span>
    </div>
  )
}

const emptyForm = { name: "", location: "", manager: "", capacityTotal: "" }

export default function WarehouseTable({ initialWarehouses }: { initialWarehouses: Warehouse[] }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const canSubmit = form.name.trim() && form.location.trim() && form.manager.trim() && Number(form.capacityTotal) > 0

  function closeModal() {
    setModalOpen(false)
    setForm(emptyForm)
    setImagePreview(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const newWarehouse = await createWarehouse({
        name: form.name.trim(),
        location: form.location.trim(),
        manager: form.manager.trim(),
        capacityTotal: Number(form.capacityTotal),
        image: imagePreview ?? undefined,
      })
      setWarehouses((prev) => [newWarehouse, ...prev])
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Warehouse Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{warehouses.length} warehouses total</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="size-4" />
          Add Warehouse
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-accent border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3 w-10">#</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Warehouse</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">ID</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Location</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Manager</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Last Inspection</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3 min-w-[160px]">Capacity</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {warehouses.map((wh) => (
              <tr key={wh.id} className="hover:bg-accent transition-colors">
                <td className="px-5 py-3 text-muted-foreground text-xs">{wh.id}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Image src={wh.image} alt="" width={28} height={28} className="size-7 rounded-full object-cover ring-1 ring-border" />
                    <span className="font-medium text-foreground">{wh.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-mono font-medium">
                    {wh.warehouseId}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{wh.location}</td>
                <td className="px-3 py-3 text-muted-foreground">{wh.manager}</td>
                <td className="px-3 py-3 text-muted-foreground text-xs">{wh.lastInspection}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <CapacityBar used={wh.capacityUsed} total={wh.capacityTotal} />
                    <span className="text-xs text-muted-foreground">{wh.capacityUsed.toLocaleString()} / {wh.capacityTotal.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/warehouse/${wh.id}`}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                  >
                    View <ArrowUpRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Warehouse modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Add Warehouse</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <WarehouseImagePicker value={imagePreview} onChange={setImagePreview} />
              <Field label="Warehouse name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Yangon East Depot" />
              <Field label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="e.g. Yangon" />
              <Field label="Manager" value={form.manager} onChange={(v) => setForm((f) => ({ ...f, manager: v }))} placeholder="e.g. Aung Aung" />
              <Field label="Total capacity (units)" value={form.capacityTotal} onChange={(v) => setForm((f) => ({ ...f, capacityTotal: v.replace(/[^0-9]/g, "") }))} placeholder="e.g. 5000" inputMode="numeric" />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!canSubmit || submitting} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting ? "Adding…" : "Add Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, inputMode,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: "numeric" | "text" }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </label>
  )
}
