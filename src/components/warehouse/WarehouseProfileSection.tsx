"use client"
import { useState } from "react"
import { X } from "lucide-react"
import WarehouseHeader from "./WarehouseHeader"
import WarehouseProfileCard from "./WarehouseProfileCard"
import WarehouseImagePicker from "./WarehouseImagePicker"
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

  function openEdit() {
    setForm(formFromWh(wh))
    setEditing(true)
  }

  const canSubmit = form.manager.trim() && form.address.trim() && form.phone.trim() && form.email.trim() && form.nextInspection.trim()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const saved = await updateWarehouseProfile(wh.id, form)
      setWh((prev) => ({ ...prev, ...saved }))
      setEditing(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <WarehouseHeader name={wh.name} onEdit={openEdit} />
      <WarehouseProfileCard wh={wh} />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Edit Warehouse Profile</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <WarehouseImagePicker value={form.image ?? null} onChange={(url) => setForm((f) => ({ ...f, image: url ?? undefined }))} />
              <Field label="Manager" value={form.manager} onChange={(v) => setForm((f) => ({ ...f, manager: v }))} placeholder="e.g. Aung Aung" />
              <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="e.g. No. 12, Bayint Naung Rd, Yangon" />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="e.g. +95 9 770 112 233" />
              <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="e.g. manager@grgi.com" type="email" />
              <Field label="Next Inspection" value={form.nextInspection} onChange={(v) => setForm((f) => ({ ...f, nextInspection: v }))} placeholder="e.g. 18 Dec 2026" />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!canSubmit || submitting} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </label>
  )
}
