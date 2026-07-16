"use client"
import { useState } from "react"
import WarehouseHeader from "./WarehouseHeader"
import WarehouseProfileCard from "./WarehouseProfileCard"
import WarehousePreviewPanel from "./WarehousePreviewPanel"
import ModalTabs from "./ModalTabs"
import { Modal, ModalFooter, FormField } from "@/components/ui"
import { updateWarehouseProfile } from "@/services/dashboard-service"
import { updateWarehouseSchema } from "@/schemas/warehouse"
import type { WarehouseDetail, UpdateWarehouseProfileInput, WarehouseStatus } from "@/types/dashboard"

const TABS = ["Details", "Contact", "Inspection & Zones"] as const

function formFromWh(wh: WarehouseDetail): UpdateWarehouseProfileInput {
  return {
    manager: wh.manager,
    address: wh.address,
    phone: wh.phone,
    email: wh.email,
    nextInspection: wh.nextInspection,
    status: wh.status,
    image: wh.image,
  }
}

export default function WarehouseProfileSection({ wh: initialWh }: { wh: WarehouseDetail }) {
  const [wh, setWh] = useState<WarehouseDetail>(initialWh)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<UpdateWarehouseProfileInput>(formFromWh(wh))
  const [initialForm, setInitialForm] = useState<UpdateWarehouseProfileInput>(formFromWh(wh))
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [confirmingClose, setConfirmingClose] = useState(false)

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm)

  const parseResult = updateWarehouseSchema.safeParse(form)
  const fieldErrors = parseResult.success ? {} : parseResult.error.flatten().fieldErrors

  const managerError = touched.manager ? (fieldErrors.manager?.[0] ?? "") : ""
  const addressError = touched.address ? (fieldErrors.address?.[0] ?? "") : ""
  const phoneError = touched.phone ? (fieldErrors.phone?.[0] ?? "") : ""
  const emailError = touched.email ? (fieldErrors.email?.[0] ?? "") : ""
  const nextInspectionError = touched.nextInspection ? (fieldErrors.nextInspection?.[0] ?? "") : ""

  const canSubmit = parseResult.success

  function openEdit() {
    const f = formFromWh(wh)
    setForm(f)
    setInitialForm(f)
    setError(null)
    setTab(0)
    setTouched({})
    setConfirmingClose(false)
    setEditing(true)
  }

  function requestClose() {
    if (isDirty) setConfirmingClose(true)
    else setEditing(false)
  }

  function discardAndClose() {
    setForm(initialForm)
    setEditing(false)
    setConfirmingClose(false)
  }

  async function handleSave() {
    setTouched({ manager: true, address: true, phone: true, email: true, nextInspection: true })
    if (!canSubmit || submitting) {
      if (managerError || addressError) setTab(0)
      else if (phoneError || emailError) setTab(1)
      else if (nextInspectionError) setTab(2)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const saved = await updateWarehouseProfile(wh.id, form)
      setWh((prev) => ({ ...prev, ...saved }))
      setEditing(false)
    } catch {
      setError("Couldn't save changes. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <WarehouseHeader name={wh.name} onEdit={openEdit} />
      <WarehouseProfileCard wh={wh} />

      {editing && (
        <Modal title="Edit Warehouse Profile" onClose={requestClose} size="lg">
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
                photo={form.image ?? null}
                onPhotoChange={(url) => setForm((f) => ({ ...f, image: url ?? undefined }))}
                name={wh.name}
                status={form.status}
                manager={form.manager}
                phone={form.phone}
                address={form.address}
              />
              <div className="flex-1 min-w-0 space-y-4">
                <ModalTabs
                  tabs={TABS}
                  active={tab}
                  onChange={setTab}
                  errorTabs={{ 0: !!(managerError || addressError), 1: !!(phoneError || emailError), 2: !!nextInspectionError }}
                />

                {tab === 0 && (
                  <div className="space-y-4">
                    <FormField label="Status">
                      <select className="modal-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as WarehouseStatus }))}>
                        <option value="Active">Active</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </FormField>
                    <FormField label="Manager" required error={managerError}>
                      <input className="modal-input" value={form.manager} onBlur={() => setTouched((t) => ({ ...t, manager: true }))} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} placeholder="e.g. Aung Aung" />
                    </FormField>
                    <FormField label="Address" required error={addressError}>
                      <input className="modal-input" value={form.address} onBlur={() => setTouched((t) => ({ ...t, address: true }))} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. No. 12, Bayint Naung Rd, Yangon" />
                    </FormField>
                  </div>
                )}

                {tab === 1 && (
                  <div className="space-y-4">
                    <FormField label="Phone" required error={phoneError}>
                      <input className="modal-input" value={form.phone} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="e.g. +95 9 770 112 233" />
                    </FormField>
                    <FormField label="Email" required error={emailError}>
                      <input className="modal-input" type="email" value={form.email} onBlur={() => setTouched((t) => ({ ...t, email: true }))} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="e.g. manager@grgi.com" />
                    </FormField>
                  </div>
                )}

                {tab === 2 && (
                  <div className="space-y-4">
                    <FormField label="Next Inspection" required error={nextInspectionError}>
                      <input className="modal-input" value={form.nextInspection} onBlur={() => setTouched((t) => ({ ...t, nextInspection: true }))} onChange={(e) => setForm((f) => ({ ...f, nextInspection: e.target.value }))} placeholder="e.g. 18 Dec 2026" />
                    </FormField>
                    <p className="text-xs text-muted-foreground">Zone layout is managed on the Warehouse Map below.</p>
                  </div>
                )}

                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
            </div>
          </div>
          <ModalFooter onCancel={requestClose} onConfirm={handleSave} confirmLabel="Save Changes" disabled={submitting} loading={submitting} />
        </Modal>
      )}
    </>
  )
}
