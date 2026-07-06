"use client"
/**
 * Shared warehouse zone canvas (see grgi_zone_layout_spec.md).
 *
 * One component for all three roles — behavior differs only by the `role`
 * prop:
 *   admin   → direct edits (live immediately, logged self-approved) + reviews
 *   manager → same edit gestures, but each submits a pending proposal with a
 *             required note; own pending shown as dashed-previous +
 *             solid-proposed + "Pending" tag
 *   staff   → live layout only, zero edit affordances
 *
 * Zones are hollow rectangles; border color = live occupancy derived from
 * zone_stock vs capacity (gray empty / amber partial / red full).
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, X, Check, Loader2 } from "lucide-react"
import {
  getZones, getZoneStock, getPendingRequests,
  applyDirectChange, proposeChange, approveRequest, rejectRequest,
  zoneOccupancy, zoneStockTotal,
} from "@/services/zone-service"
import type {
  ViewerRole, ZoneSection, ZoneStockEntry, ZoneChangeRequest,
  ZoneChangeAction, ZoneFields, ZoneOccupancy,
} from "@/types/dashboard"

const CANVAS_W = 720
const CANVAS_H = 440
const MIN_SIZE = 60

const occupancyBorder: Record<ZoneOccupancy, string> = {
  empty:   "border-slate-400",
  partial: "border-amber-500",
  full:    "border-red-500",
}
const occupancyText: Record<ZoneOccupancy, string> = {
  empty:   "text-slate-500",
  partial: "text-amber-600",
  full:    "text-red-600",
}
const occupancyLabel: Record<ZoneOccupancy, string> = {
  empty: "Empty", partial: "Partial", full: "Full",
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function snapshot(z: ZoneSection): ZoneFields {
  return { code: z.code, x: z.x, y: z.y, width: z.width, height: z.height, capacity: z.capacity }
}

/** Fields in `proposed` that differ from `previous`. */
function changedFields(previous: ZoneFields, proposed: ZoneFields): ZoneFields {
  const out: ZoneFields = {}
  for (const key of ["code", "x", "y", "width", "height", "capacity"] as const) {
    if (previous[key] !== proposed[key]) (out as Record<string, unknown>)[key] = proposed[key]
  }
  return out
}

function actionSummary(req: ZoneChangeRequest): string {
  if (req.actionType === "create") return `Create zone "${req.proposedData?.code}"`
  if (req.actionType === "delete") return `Delete zone "${req.previousData?.code}"`
  const keys = Object.keys(changedFields(req.previousData ?? {}, req.proposedData ?? {}))
  return `Update zone "${req.previousData?.code}" (${keys.join(", ")})`
}

type DragState = {
  zoneId: number
  mode: "move" | "resize"
  startX: number
  startY: number
  orig: ZoneSection
}

type CommitDraft = {
  actionType: ZoneChangeAction
  sectionId: number | null
  proposed: ZoneFields | null
  previous: ZoneFields | null
}

export default function ZoneLayoutCanvas({
  warehouseId, role, viewerName,
}: { warehouseId: number; role: ViewerRole; viewerName: string }) {
  const [zones, setZones] = useState<ZoneSection[]>([])
  const [stock, setStock] = useState<ZoneStockEntry[]>([])
  const [pending, setPending] = useState<ZoneChangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  // Local geometry overrides while dragging/resizing (before commit)
  const [draftGeom, setDraftGeom] = useState<Record<number, ZoneFields>>({})
  const dragRef = useRef<DragState | null>(null)
  const dragMovedRef = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Manager staging: edits accumulate locally and are submitted together via
  // the "Submit Proposal" button, which opens the shared note modal.
  const [noteDraft, setNoteDraft] = useState("")
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [staged, setStaged] = useState<CommitDraft[]>([])
  // Client-side ids for zones a manager has created but not yet submitted.
  const nextStagedIdRef = useRef(-1)

  // Zone form (edit panel fields)
  const [formCode, setFormCode] = useState("")
  const [formCapacity, setFormCapacity] = useState("")

  // Admin reject note
  const [rejectNote, setRejectNote] = useState("")
  const [busy, setBusy] = useState(false)

  const canEdit = role === "admin" || role === "manager"

  const refresh = useCallback(async () => {
    const [z, s, p] = await Promise.all([
      getZones(warehouseId),
      getZoneStock(warehouseId),
      getPendingRequests(warehouseId),
    ])
    setZones(z)
    setStock(s)
    setPending(p)
    setDraftGeom({})
    setStaged([])
    setLoading(false)
  }, [warehouseId])

  useEffect(() => { void refresh() }, [refresh])

  const pendingForZone = (zoneId: number) =>
    pending.find((r) => r.sectionId === zoneId)

  // Manager staging lookups
  const stagedFor = (zoneId: number) =>
    staged.find((d) => d.sectionId === zoneId) ?? null
  const stagedDeleteIds = new Set(
    staged.filter((d) => d.actionType === "delete").map((d) => d.sectionId),
  )

  /**
   * What the manager sees on the canvas: live zones with their own staged
   * edits folded in (updates applied, deletes removed) plus not-yet-submitted
   * creates. Admin/staff see the plain live zones.
   */
  const displayZones: ZoneSection[] =
    role === "manager"
      ? [
          ...zones
            .filter((z) => !stagedDeleteIds.has(z.id))
            .map((z) => {
              const s = stagedFor(z.id)
              return s?.actionType === "update" && s.proposed ? { ...z, ...s.proposed } : z
            }),
          ...staged
            .filter((d) => d.actionType === "create" && d.sectionId != null)
            .map((d) => ({
              id: d.sectionId as number,
              warehouseId,
              code: d.proposed?.code ?? "NEW",
              x: d.proposed?.x ?? 20,
              y: d.proposed?.y ?? 20,
              width: d.proposed?.width ?? 150,
              height: d.proposed?.height ?? 150,
              capacity: d.proposed?.capacity ?? 100,
            })),
        ]
      : zones

  const selectedZone = displayZones.find((z) => z.id === selectedZoneId) ?? null
  const selectedRequest = pending.find((r) => r.id === selectedRequestId) ?? null

  useEffect(() => {
    if (selectedZone) {
      setFormCode(selectedZone.code)
      setFormCapacity(String(selectedZone.capacity))
    }
  }, [selectedZoneId, selectedZone])

  // -------------------------------------------------------------------------
  // Commit flow: admin applies each edit directly; manager stages edits
  // locally and submits them together via the "Submit Proposal" button.
  // -------------------------------------------------------------------------
  async function submitChange(draft: CommitDraft) {
    if (role === "admin") {
      setBusy(true)
      try {
        await applyDirectChange({
          warehouseId,
          actionType: draft.actionType,
          sectionId: draft.sectionId,
          proposedData: draft.proposed,
          previousData: draft.previous,
          requestNote: "",
          requestedBy: viewerName,
        })
        await refresh()
      } finally {
        setBusy(false)
      }
    } else {
      stageChange(draft)
    }
  }

  /** Add a manager edit to the local staging set (no server call yet). */
  function stageChange(draft: CommitDraft) {
    setStaged((prev) => {
      // Deleting a still-unsubmitted create just drops it from staging.
      if (draft.actionType === "delete" && draft.sectionId != null && draft.sectionId < 0) {
        return prev.filter((d) => d.sectionId !== draft.sectionId)
      }
      // Collapse repeated edits to the same zone into one entry.
      const rest = prev.filter((d) => d.sectionId !== draft.sectionId)
      // An update to a staged create stays a create, carrying the new fields.
      const existing = prev.find((d) => d.sectionId === draft.sectionId)
      if (existing?.actionType === "create" && draft.actionType === "update") {
        return [...rest, { ...existing, proposed: { ...existing.proposed, ...draft.proposed } }]
      }
      return [...rest, draft]
    })
    setDraftGeom({})
  }

  /** Submit every staged change as its own proposal, sharing one note. */
  async function submitProposal() {
    if (staged.length === 0 || !noteDraft.trim()) return
    setBusy(true)
    try {
      for (const draft of staged) {
        await proposeChange({
          warehouseId,
          actionType: draft.actionType,
          // Staged creates use negative temp ids; the server assigns the real one.
          sectionId: draft.sectionId != null && draft.sectionId < 0 ? null : draft.sectionId,
          proposedData: draft.proposed,
          previousData: draft.previous,
          requestNote: noteDraft.trim(),
          requestedBy: viewerName,
        })
      }
      setNoteModalOpen(false)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  function discardStaged() {
    setStaged([])
    setDraftGeom({})
    setSelectedZoneId(null)
  }

  // -------------------------------------------------------------------------
  // Drag / resize
  // -------------------------------------------------------------------------
  function onZonePointerDown(e: React.PointerEvent, zone: ZoneSection, mode: "move" | "resize") {
    if (!canEdit || pendingForZone(zone.id)) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragRef.current = { zoneId: zone.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...zone } }
    dragMovedRef.current = false
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) dragMovedRef.current = true
    const { orig } = drag
    if (drag.mode === "move") {
      setDraftGeom((g) => ({
        ...g,
        [drag.zoneId]: {
          x: clamp(orig.x + dx, 0, CANVAS_W - orig.width),
          y: clamp(orig.y + dy, 0, CANVAS_H - orig.height),
        },
      }))
    } else {
      setDraftGeom((g) => ({
        ...g,
        [drag.zoneId]: {
          width:  clamp(orig.width + dx, MIN_SIZE, CANVAS_W - orig.x),
          height: clamp(orig.height + dy, MIN_SIZE, CANVAS_H - orig.y),
        },
      }))
    }
  }

  function onPointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    const zone = displayZones.find((z) => z.id === drag.zoneId)
    const geom = draftGeom[drag.zoneId]
    if (!dragMovedRef.current || !zone || !geom) {
      // treat as a click-select
      setSelectedZoneId(drag.zoneId)
      setSelectedRequestId(null)
      setDraftGeom((g) => {
        const { [drag.zoneId]: _, ...rest } = g
        return rest
      })
      return
    }
    const previous = snapshot(zone)
    const proposed = { ...previous, ...geom }
    void submitChange({
      actionType: "update",
      sectionId: zone.id,
      proposed,
      previous,
    })
  }

  // -------------------------------------------------------------------------
  // Panel actions: rename / capacity / delete / create
  // -------------------------------------------------------------------------
  function saveZoneForm() {
    if (!selectedZone) return
    const previous = snapshot(selectedZone)
    const proposed: ZoneFields = { ...previous, code: formCode.trim() || previous.code, capacity: Number(formCapacity) > 0 ? Number(formCapacity) : previous.capacity }
    if (Object.keys(changedFields(previous, proposed)).length === 0) return
    void submitChange({ actionType: "update", sectionId: selectedZone.id, proposed, previous })
  }

  function deleteZone() {
    if (!selectedZone) return
    void submitChange({ actionType: "delete", sectionId: selectedZone.id, proposed: null, previous: snapshot(selectedZone) })
    setSelectedZoneId(null)
  }

  function createZone() {
    const codes = new Set(displayZones.map((z) => z.code))
    let n = 1
    while (codes.has(`Z${n}`)) n++
    // Managers stage creates under a negative temp id so the new zone renders
    // and stays editable until the batch is submitted; admins create directly.
    const sectionId = role === "manager" ? nextStagedIdRef.current-- : null
    void submitChange({
      actionType: "create",
      sectionId,
      proposed: { code: `Z${n}`, x: 20, y: 20, width: 150, height: 150, capacity: 100 },
      previous: null,
    })
  }

  // -------------------------------------------------------------------------
  // Admin review actions
  // -------------------------------------------------------------------------
  async function onApprove(req: ZoneChangeRequest) {
    setBusy(true)
    try {
      await approveRequest(req.id, viewerName)
      setSelectedRequestId(null)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function onReject(req: ZoneChangeRequest) {
    if (!rejectNote.trim()) return
    setBusy(true)
    try {
      await rejectRequest(req.id, viewerName, rejectNote.trim())
      setSelectedRequestId(null)
      setRejectNote("")
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  const showPendingOverlays = role !== "staff"
  const pendingCreates = showPendingOverlays ? pending.filter((r) => r.actionType === "create") : []

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Zone Layout</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === "staff" ? "Live layout (view only)" :
             role === "manager" ? "Drag, resize, or edit zones — changes are submitted for approval" :
             "Edits are live immediately and logged"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Occupancy legend */}
          <div className="flex items-center gap-3">
            {(["empty", "partial", "full"] as const).map((o) => (
              <span key={o} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`size-2.5 rounded-sm border-2 ${occupancyBorder[o]}`} />
                {occupancyLabel[o]}
              </span>
            ))}
          </div>
          {pending.length > 0 && showPendingOverlays && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium ring-1 ring-indigo-200">
              {pending.length} pending
            </span>
          )}
          {role === "manager" && staged.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium ring-1 ring-amber-200">
              {staged.length} unsubmitted
            </span>
          )}
          {canEdit && (
            <button
              onClick={createZone}
              disabled={busy}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="size-3.5" /> Add Zone
            </button>
          )}
          {/* Manager's dedicated proposal button — opens the note modal on click */}
          {role === "manager" && (
            <>
              <button
                onClick={discardStaged}
                disabled={busy || staged.length === 0}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                Discard
              </button>
              <button
                onClick={() => { setNoteDraft(""); setNoteModalOpen(true) }}
                disabled={busy || staged.length === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                <Check className="size-3.5" /> Submit Proposal{staged.length > 0 ? ` (${staged.length})` : ""}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="overflow-x-auto">
        <div
          ref={canvasRef}
          className="relative rounded-lg border border-slate-200 bg-slate-50 select-none"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => { setSelectedZoneId(null); setSelectedRequestId(null) }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="size-4 animate-spin mr-2" /> Loading layout…
            </div>
          )}

          {/* Zones (live for admin/staff; live + staged edits for manager) */}
          {displayZones.map((zone) => {
            const req = showPendingOverlays ? pendingForZone(zone.id) : undefined
            const stagedDraft = role === "manager" ? stagedFor(zone.id) : null
            const geom = draftGeom[zone.id]
            const x = geom?.x ?? zone.x
            const y = geom?.y ?? zone.y
            const w = geom?.width ?? zone.width
            const h = geom?.height ?? zone.height
            const occ = zoneOccupancy(zone, stock)
            const total = zoneStockTotal(zone.id, stock)
            const selected = selectedZoneId === zone.id

            // Zone with a pending update/delete: live state renders dashed
            const liveIsDashed = !!req

            return (
              <div key={zone.id}>
                {/* live (or previous) box */}
                <div
                  onPointerDown={(e) => onZonePointerDown(e, zone, "move")}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (req) { setSelectedRequestId(req.id); setSelectedZoneId(null) }
                    else { setSelectedZoneId(zone.id); setSelectedRequestId(null) }
                  }}
                  className={`absolute rounded-md border-2 bg-transparent ${occupancyBorder[occ]} ${
                    liveIsDashed ? "border-dashed opacity-60" : ""
                  } ${stagedDraft ? "ring-2 ring-amber-400 ring-offset-1" : ""} ${
                    selected ? "ring-2 ring-indigo-400 ring-offset-1" : ""
                  } ${canEdit && !req ? "cursor-move" : "cursor-pointer"}`}
                  style={{ left: x, top: y, width: w, height: h }}
                >
                  <div className="absolute top-1 left-1.5 leading-tight pointer-events-none">
                    <p className="text-xs font-bold text-slate-700">{zone.code}</p>
                    <p className={`text-[10px] font-medium ${occupancyText[occ]}`}>
                      {total.toLocaleString()} / {zone.capacity.toLocaleString()}
                    </p>
                  </div>
                  {stagedDraft && (
                    <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-amber-500 text-white text-[10px] font-semibold pointer-events-none">
                      Draft
                    </span>
                  )}
                  {canEdit && !req && (
                    <div
                      onPointerDown={(e) => onZonePointerDown(e, zone, "resize")}
                      className="absolute -bottom-1 -right-1 size-3 rounded-sm bg-white border-2 border-slate-400 cursor-se-resize"
                    />
                  )}
                </div>

                {/* proposed box for a pending update */}
                {req && req.actionType === "update" && req.proposedData && (
                  <div
                    onClick={(e) => { e.stopPropagation(); setSelectedRequestId(req.id); setSelectedZoneId(null) }}
                    className={`absolute rounded-md border-2 bg-transparent border-indigo-500 cursor-pointer ${
                      selectedRequestId === req.id ? "ring-2 ring-indigo-400 ring-offset-1" : ""
                    }`}
                    style={{
                      left:   req.proposedData.x ?? zone.x,
                      top:    req.proposedData.y ?? zone.y,
                      width:  req.proposedData.width ?? zone.width,
                      height: req.proposedData.height ?? zone.height,
                    }}
                  >
                    <div className="absolute top-1 left-1.5 leading-tight pointer-events-none">
                      <p className="text-xs font-bold text-indigo-700">{req.proposedData.code ?? zone.code}</p>
                    </div>
                    <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-indigo-600 text-white text-[10px] font-semibold pointer-events-none">
                      Pending
                    </span>
                  </div>
                )}

                {/* delete tag for a pending delete */}
                {req && req.actionType === "delete" && (
                  <span
                    className="absolute px-1.5 py-px rounded bg-red-600 text-white text-[10px] font-semibold pointer-events-none"
                    style={{ left: x + 4, top: y - 10 }}
                  >
                    Delete pending
                  </span>
                )}
              </div>
            )
          })}

          {/* Pending creates (no live counterpart) */}
          {pendingCreates.map((req) => (
            <div
              key={`create-${req.id}`}
              onClick={(e) => { e.stopPropagation(); setSelectedRequestId(req.id); setSelectedZoneId(null) }}
              className={`absolute rounded-md border-2 bg-transparent border-indigo-500 cursor-pointer ${
                selectedRequestId === req.id ? "ring-2 ring-indigo-400 ring-offset-1" : ""
              }`}
              style={{
                left: req.proposedData?.x ?? 20,
                top: req.proposedData?.y ?? 20,
                width: req.proposedData?.width ?? 160,
                height: req.proposedData?.height ?? 120,
              }}
            >
              <div className="absolute top-1 left-1.5 leading-tight pointer-events-none">
                <p className="text-xs font-bold text-indigo-700">{req.proposedData?.code}</p>
              </div>
              <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-indigo-600 text-white text-[10px] font-semibold pointer-events-none">
                Pending
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected zone panel */}
      {selectedZone && !selectedRequest && (
        <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-slate-800">Zone {selectedZone.code}</h4>
              <span className={`text-xs font-medium ${occupancyText[zoneOccupancy(selectedZone, stock)]}`}>
                {occupancyLabel[zoneOccupancy(selectedZone, stock)]} · {zoneStockTotal(selectedZone.id, stock).toLocaleString()} / {selectedZone.capacity.toLocaleString()} units
              </span>
            </div>
            {stock.filter((s) => s.sectionId === selectedZone.id).length === 0 ? (
              <p className="text-xs text-slate-400">No stock in this zone.</p>
            ) : (
              <ul className="space-y-1">
                {stock.filter((s) => s.sectionId === selectedZone.id).map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-xs text-slate-600">
                    <span>{s.itemName}</span>
                    <span className="font-semibold">{s.quantity.toLocaleString()} units</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-col gap-2.5 sm:w-64 shrink-0">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Zone name / code</span>
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Capacity (units)</span>
                <input
                  value={formCapacity}
                  inputMode="numeric"
                  onChange={(e) => setFormCapacity(e.target.value.replace(/[^0-9]/g, ""))}
                  className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => { saveZoneForm(); setSelectedZoneId(null) }} disabled={busy} className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {role === "manager" ? "Stage changes" : "Save"}
                </button>
                <button onClick={deleteZone} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected pending request panel */}
      {selectedRequest && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium ring-1 ring-indigo-200">Pending</span>
                <h4 className="text-sm font-semibold text-slate-800">{actionSummary(selectedRequest)}</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">Requested by {selectedRequest.requestedBy}</p>
              <p className="text-sm text-slate-600 mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                “{selectedRequest.requestNote}”
              </p>
            </div>

            {role === "admin" ? (
              <div className="flex flex-col gap-2 sm:w-72 shrink-0">
                <button
                  onClick={() => onApprove(selectedRequest)}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check className="size-4" /> Approve
                </button>
                <div className="flex flex-col gap-1.5">
                  <input
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (required)"
                    className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                  <button
                    onClick={() => onReject(selectedRequest)}
                    disabled={busy || !rejectNote.trim()}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <X className="size-4" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 shrink-0">Awaiting admin review</p>
            )}
          </div>
        </div>
      )}

      {/* Manager proposal modal — opened by the "Submit Proposal" button,
          covers all staged changes with one shared note. */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !busy && setNoteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Submit proposal</h3>
            <p className="text-xs text-slate-400 mb-3">
              A short message is required — the admin will see it when reviewing your {staged.length === 1 ? "change" : `${staged.length} changes`}.
            </p>
            {staged.length > 0 && (
              <ul className="mb-3 max-h-32 overflow-y-auto space-y-1 rounded-lg bg-slate-50 border border-slate-100 p-2">
                {staged.map((d, i) => (
                  <li key={i} className="text-xs text-slate-600">• {draftSummary(d)}</li>
                ))}
              </ul>
            )}
            <textarea
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              placeholder="e.g. Re-laid out the inbound zones for Q3"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setNoteModalOpen(false)} disabled={busy} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={submitProposal}
                disabled={!noteDraft.trim() || busy || staged.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40"
              >
                {busy ? "Submitting…" : "Submit proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Human summary of a staged manager change for the proposal modal list. */
function draftSummary(d: CommitDraft): string {
  if (d.actionType === "create") return `Create zone "${d.proposed?.code ?? "NEW"}"`
  if (d.actionType === "delete") return `Delete zone "${d.previous?.code ?? ""}"`
  const keys = Object.keys(changedFields(d.previous ?? {}, d.proposed ?? {}))
  return `Update zone "${d.previous?.code ?? ""}" (${keys.join(", ") || "geometry"})`
}
