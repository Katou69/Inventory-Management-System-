"use client"
import { useState } from "react"
import WarehouseHeader from "./WarehouseHeader"
import WarehouseProfileCard from "./WarehouseProfileCard"
import WarehouseImagePicker from "./WarehouseImagePicker"
import { Modal, ModalFooter, FormField } from "@/components/ui"
import { updateWarehouseProfile } from "@/services/dashboard-service"
import type { WarehouseDetail, UpdateWarehouseProfileInput } from "@/types/dashboard"

function formFromWh(wh: WarehouseDetail): UpdateWarehouseProfileInput {
  return {
    manager: wh.manager,
    address: wh.address,
    phone: wh.phone,
    email: wh.email,
    nextInspection: wh.nextInspection,
    image: wh.image,
  }
}

export default function WarehouseProfileSection({ wh: initialWh }: { wh: WarehouseDetail }) {
  const [wh, setWh] = useState<WarehouseDetail>(initialWh)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<UpdateWarehouseProfileInput>(formFromWh(wh))
  const [error, setError] = useState<string | null>(null)

  function openEdit() {
    setForm(formFromWh(wh))
    setError(null)
    setEditing(true)
  }

  const canSubmit = form.manager.trim() && form.address.trim() && form.phone.trim() && form.email.trim() && form.nextInspection.trim()

  async function handleSave() {
    if (!canSubmit || submitting) return
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
        <Modal title="Edit Warehouse Profile" onClose={() => setEditing(false)}>
          <div className="p-5 space-y-4">
            <WarehouseImagePicker value={form.image ?? null} onChange={(url) => setForm((f) => ({ ...f, image: url ?? undefined }))} />
            <FormField label="Manager">
              <input className="modal-input" value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} placeholder="e.g. Aung Aung" />
            </FormField>
            <FormField label="Address">
              <input className="modal-input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. No. 12, Bayint Naung Rd, Yangon" />
            </FormField>
            <FormField label="Phone">
              <input className="modal-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="e.g. +95 9 770 112 233" />
            </FormField>
            <FormField label="Email">
              <input className="modal-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="e.g. manager@grgi.com" />
            </FormField>
            <FormField label="Next Inspection">
              <input className="modal-input" value={form.nextInspection} onChange={(e) => setForm((f) => ({ ...f, nextInspection: e.target.value }))} placeholder="e.g. 18 Dec 2026" />
            </FormField>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <ModalFooter onCancel={() => setEditing(false)} onConfirm={handleSave} confirmLabel="Save Changes" disabled={!canSubmit} loading={submitting} />
        </Modal>
      )}
    </>
  )
}
