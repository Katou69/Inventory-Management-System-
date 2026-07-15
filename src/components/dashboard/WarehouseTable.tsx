"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Plus, ArrowUpRight } from "lucide-react"
import { createWarehouse } from "@/services/dashboard-service"
import WarehouseImagePicker from "@/components/warehouse/WarehouseImagePicker"
import { Modal, ModalFooter, FormField } from "@/components/ui"
import type { Warehouse } from "@/types/dashboard"

function CapacityBar({ used, total }: { used: number; total: number }) {
  // total=0 (a warehouse with no capacity recorded) made this Infinity and
  // emitted style="width: Infinity%". Over-capacity (>100%) overflowed the track.
  // Report the true figure, but only ever *fill* between 0 and 100.
  const hasCapacity = total > 0
  const pct = hasCapacity ? Math.round((used / total) * 100) : null
  const fill = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  const over = pct !== null && pct > 100
  const color = over || fill >= 85 ? "bg-red-500" : fill >= 65 ? "bg-amber-400" : "bg-emerald-500"

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${fill}%` }} />
      </div>
      <span
        className={`text-xs shrink-0 w-8 text-right ${over ? "text-red-500 font-medium" : "text-muted-foreground"}`}
        title={pct === null ? "No capacity recorded for this warehouse" : undefined}
      >
        {pct === null ? "—" : `${pct}%`}
      </span>
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
  const [error, setError] = useState<string | null>(null)

  const canSubmit = form.name.trim() && form.location.trim() && form.manager.trim() && Number(form.capacityTotal) > 0

  function closeModal() {
    setModalOpen(false)
    setForm(emptyForm)
    setImagePreview(null)
    setError(null)
  }

  async function handleAdd() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
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
    } catch {
      setError("Couldn't add the warehouse. Please try again.")
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

      {modalOpen && (
        <Modal title="Add Warehouse" onClose={closeModal}>
          <div className="p-5 space-y-4">
            <WarehouseImagePicker value={imagePreview} onChange={setImagePreview} />
            <FormField label="Warehouse name">
              <input className="modal-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Yangon East Depot" />
            </FormField>
            <FormField label="Location">
              <input className="modal-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Yangon" />
            </FormField>
            <FormField label="Manager">
              <input className="modal-input" value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} placeholder="e.g. Aung Aung" />
            </FormField>
            <FormField label="Total capacity (units)">
              <input className="modal-input" inputMode="numeric" value={form.capacityTotal} onChange={(e) => setForm((f) => ({ ...f, capacityTotal: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="e.g. 5000" />
            </FormField>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <ModalFooter onCancel={closeModal} onConfirm={handleAdd} confirmLabel="Add Warehouse" disabled={!canSubmit} loading={submitting} />
        </Modal>
      )}
    </div>
  )
}
