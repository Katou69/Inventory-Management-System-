"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Plus, ArrowUpRight } from "lucide-react"
import { createWarehouse } from "@/services/dashboard-service"
import { createWarehouseSchema } from "@/schemas/warehouse"
import WarehousePreviewPanel from "@/components/warehouse/WarehousePreviewPanel"
import ModalTabs from "@/components/warehouse/ModalTabs"
import { Modal, ModalFooter, FormField } from "@/components/ui"
import type { Warehouse, WarehouseStatus } from "@/types/dashboard"

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

const emptyForm = { name: "", location: "", manager: "", phone: "", capacityTotal: "", status: "Under Maintenance" as WarehouseStatus }
const TABS = ["Details", "Contact", "Capacity"] as const

export default function WarehouseTable({ initialWarehouses }: { initialWarehouses: Warehouse[] }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [confirmingClose, setConfirmingClose] = useState(false)

  const isDirty = !!(form.name || form.location || form.manager || form.phone || form.capacityTotal || imagePreview || form.status !== emptyForm.status)

  const parseResult = createWarehouseSchema.safeParse({
    ...form,
    capacityTotal: Number(form.capacityTotal) || 0,
    phone: form.phone || "",
    image: imagePreview,
  })
  const fieldErrors = parseResult.success ? {} : parseResult.error.flatten().fieldErrors

  const nameError = touched.name ? (fieldErrors.name?.[0] ?? "") : ""
  const locationError = touched.location ? (fieldErrors.location?.[0] ?? "") : ""
  const phoneError = touched.phone ? (fieldErrors.phone?.[0] ?? "") : ""
  const capacityError = touched.capacityTotal ? (fieldErrors.capacityTotal?.[0] ?? "") : ""

  const canSubmit = parseResult.success

  function resetForm() {
    setForm(emptyForm)
    setImagePreview(null)
    setError(null)
    setTab(0)
    setTouched({})
    setConfirmingClose(false)
  }

  function requestClose() {
    if (isDirty) setConfirmingClose(true)
    else {
      setModalOpen(false)
      resetForm()
    }
  }

  function discardAndClose() {
    setModalOpen(false)
    resetForm()
  }

  async function handleAdd() {
    setTouched({ name: true, location: true, capacityTotal: true, phone: true })
    if (!canSubmit || submitting) {
      if (nameError || locationError) setTab(0)
      else if (phoneError) setTab(1)
      else if (capacityError) setTab(2)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const newWarehouse = await createWarehouse({
        name: form.name.trim(),
        location: form.location.trim(),
        manager: form.manager.trim() || undefined,
        phone: form.phone.trim() || undefined,
        capacityTotal: Number(form.capacityTotal),
        status: form.status,
        image: imagePreview ?? undefined,
      })
      setWarehouses((prev) => [newWarehouse, ...prev])
      setModalOpen(false)
      resetForm()
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
        <Modal title="Add Warehouse" onClose={requestClose} size="lg">
          <div className="p-5">
            {confirmingClose && (
              <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2.5 rounded-lg border border-border bg-accent">
                <span className="text-xs text-foreground">Discard unsaved changes?</span>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmingClose(false)} className="text-xs font-medium px-2.5 py-1 rounded-md border border-border hover:bg-card transition-colors">
                    Keep editing
                  </button>
                  <button onClick={discardAndClose} className="text-xs font-medium px-2.5 py-1 rounded-md text-destructive border border-destructive/40 hover:bg-destructive/10 transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-6">
              <WarehousePreviewPanel
                photo={imagePreview}
                onPhotoChange={setImagePreview}
                name={form.name || "New warehouse"}
                status={form.status}
                manager={form.manager}
                phone={form.phone}
                address={form.location}
              />
              <div className="flex-1 min-w-0 space-y-4">
                <ModalTabs
                  tabs={TABS}
                  active={tab}
                  onChange={setTab}
                  errorTabs={{ 0: !!(nameError || locationError), 1: !!phoneError, 2: !!capacityError }}
                />

                {tab === 0 && (
                  <div className="space-y-4">
                    <FormField label="Warehouse name" required error={nameError}>
                      <input className="modal-input" value={form.name} onBlur={() => setTouched((t) => ({ ...t, name: true }))} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Yangon East Depot" />
                    </FormField>
                    <FormField label="Location" required error={locationError}>
                      <input className="modal-input" value={form.location} onBlur={() => setTouched((t) => ({ ...t, location: true }))} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Yangon" />
                    </FormField>
                    <FormField label="Status">
                      <select className="modal-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as WarehouseStatus }))}>
                        <option value="Active">Active</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </FormField>
                  </div>
                )}

                {tab === 1 && (
                  <div className="space-y-4">
                    <FormField label="Manager">
                      <input className="modal-input" value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} placeholder="e.g. Aung Aung (optional)" />
                    </FormField>
                    <FormField label="Phone" error={phoneError}>
                      <input className="modal-input" value={form.phone} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="e.g. +95 9 111 2222 (optional)" />
                    </FormField>
                  </div>
                )}

                {tab === 2 && (
                  <div className="space-y-4">
                    <FormField label="Total capacity (units)" required error={capacityError}>
                      <input className="modal-input" inputMode="numeric" value={form.capacityTotal} onBlur={() => setTouched((t) => ({ ...t, capacityTotal: true }))} onChange={(e) => setForm((f) => ({ ...f, capacityTotal: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="e.g. 5000" />
                    </FormField>
                    <p className="text-xs text-muted-foreground">Zones can be laid out on the warehouse's map once it's created.</p>
                  </div>
                )}

                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
            </div>
          </div>
          <ModalFooter onCancel={requestClose} onConfirm={handleAdd} confirmLabel="Add Warehouse" disabled={submitting} loading={submitting} />
        </Modal>
      )}
    </div>
  )
}
