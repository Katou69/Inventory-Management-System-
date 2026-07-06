"use client"
/**
 * Shared warehouse zone MAP (see grgi_zone_layout_spec.md).
 *
 * One component for all three roles — behavior differs only by the `role`
 * prop:
 *   admin   → direct edits (live immediately, logged self-approved) + reviews
 *   manager → same edit gestures, but each submits a pending proposal with a
 *             required note; own pending shown as dashed-previous +
 *             solid-proposed + "Pending" tag
 *   staff   → live layout only, zero edit affordances (can still pan/zoom)
 *
 * Map behaviours:
 *   - Infinite world: zones live in unbounded world coordinates; the canvas is
 *     just a window that pans (drag empty space / Hand tool) and zooms (wheel
 *     or the ± controls, zoom-to-cursor). Fit + Reset recentre the view.
 *   - Draw tool: managers/admins drag on empty space to draw a new rectangular
 *     zone at real map coordinates.
 *
 * Zones are hollow rectangles; border color = live occupancy derived from
 * zone_stock vs capacity (gray empty / amber partial / red full).
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { MousePointer2, Hand, Boxes, SquareDashed, Plus, Minus, Maximize, LocateFixed, X, Check, Loader2 } from "lucide-react"
import {
  getZones, getZoneStock, getPendingRequests,
  applyDirectChange, proposeChange, approveRequest, rejectRequest,
  zoneOccupancy, zoneStockTotal,
} from "@/services/zone-service"
import type {
  ViewerRole, ZoneSection, ZoneStockEntry, ZoneChangeRequest,
  ZoneChangeAction, ZoneFields, ZoneOccupancy,
} from "@/types/dashboard"

const VIEW_H     = 560   // canvas window height (px)
const GRID       = 20    // world units per grid cell
const MIN_SIZE   = 40    // smallest zone (world units)
const MIN_DRAW   = 24    // min drag to count as a drawn zone (world units)
const MIN_ZOOM   = 0.2
const MAX_ZOOM   = 3

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

type Tool = "select" | "pan" | "draw-shelf" | "draw-zone"
type View = { zoom: number; x: number; y: number }

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const snap = (v: number) => Math.round(v / GRID) * GRID
const isDrawTool = (t: Tool) => t === "draw-shelf" || t === "draw-zone"

function snapshot(z: ZoneSection): ZoneFields {
  return { kind: z.kind, code: z.code, name: z.name, x: z.x, y: z.y, width: z.width, height: z.height, capacity: z.capacity }
}

/** Fields in `proposed` that differ from `previous`. */
function changedFields(previous: ZoneFields, proposed: ZoneFields): ZoneFields {
  const out: ZoneFields = {}
  for (const key of ["code", "name", "x", "y", "width", "height", "capacity"] as const) {
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
  startX: number   // client px
  startY: number
  orig: ZoneSection
}
type PanState = { startX: number; startY: number; ox: number; oy: number; moved: boolean }
type DrawState = { x0: number; y0: number; x1: number; y1: number } // world coords

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

  // Map viewport
  const [tool, setTool] = useState<Tool>("select")
  const [view, setView] = useState<View>({ zoom: 1, x: 40, y: 40 })
  const viewRef = useRef(view)
  viewRef.current = view

  // Live geometry overrides while dragging/resizing (before commit)
  const [draftGeom, setDraftGeom] = useState<Record<number, ZoneFields>>({})
  const [drawRect, setDrawRect] = useState<DrawState | null>(null)

  const dragRef = useRef<DragState | null>(null)
  const dragMovedRef = useRef(false)
  const panRef = useRef<PanState | null>(null)
  const drawRef = useRef<DrawState | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [noteDraft, setNoteDraft] = useState("")
  const [commitDraft, setCommitDraft] = useState<CommitDraft | null>(null)
  const [formCode, setFormCode] = useState("")
  const [formName, setFormName] = useState("")
  const [formCapacity, setFormCapacity] = useState("")
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
    setLoading(false)
  }, [warehouseId])

  useEffect(() => { void refresh() }, [refresh])

  // If a role can't draw, never leave them stuck on a draw tool
  useEffect(() => { if (!canEdit && isDrawTool(tool)) setTool("select") }, [canEdit, tool])

  const pendingForZone = (zoneId: number) => pending.find((r) => r.sectionId === zoneId)
  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null
  const selectedRequest = pending.find((r) => r.id === selectedRequestId) ?? null

  useEffect(() => {
    if (selectedZone) {
      setFormCode(selectedZone.code)
      setFormName(selectedZone.name)
      setFormCapacity(String(selectedZone.capacity))
    }
  }, [selectedZoneId, selectedZone])

  // -------------------------------------------------------------------------
  // Coordinate transforms
  // -------------------------------------------------------------------------
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const v = viewRef.current
    const sx = clientX - (rect?.left ?? 0)
    const sy = clientY - (rect?.top ?? 0)
    return { x: (sx - v.x) / v.zoom, y: (sy - v.y) / v.zoom }
  }, [])

  const zoomAt = useCallback((nextZoom: number, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const v = viewRef.current
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    const sx = clientX - (rect?.left ?? 0)
    const sy = clientY - (rect?.top ?? 0)
    const wx = (sx - v.x) / v.zoom
    const wy = (sy - v.y) / v.zoom
    setView({ zoom: z, x: sx - wx * z, y: sy - wy * z })
  }, [])

  // Native wheel listener so we can preventDefault (map-style zoom-to-cursor)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      zoomAt(viewRef.current.zoom * factor, e.clientX, e.clientY)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  function fitToContent() {
    const boxes = [
      ...zones.map((z) => ({ x: z.x, y: z.y, w: z.width, h: z.height })),
      ...pending.filter((r) => r.actionType === "create").map((r) => ({
        x: r.proposedData?.x ?? 0, y: r.proposedData?.y ?? 0,
        w: r.proposedData?.width ?? 0, h: r.proposedData?.height ?? 0,
      })),
    ]
    const rect = canvasRef.current?.getBoundingClientRect()
    const vw = rect?.width ?? 720
    const vh = rect?.height ?? VIEW_H
    if (boxes.length === 0) { setView({ zoom: 1, x: 40, y: 40 }); return }
    const minX = Math.min(...boxes.map((b) => b.x))
    const minY = Math.min(...boxes.map((b) => b.y))
    const maxX = Math.max(...boxes.map((b) => b.x + b.w))
    const maxY = Math.max(...boxes.map((b) => b.y + b.h))
    const pad = 48
    const zoom = clamp(Math.min((vw - pad * 2) / (maxX - minX || 1), (vh - pad * 2) / (maxY - minY || 1)), MIN_ZOOM, MAX_ZOOM)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setView({ zoom, x: vw / 2 - cx * zoom, y: vh / 2 - cy * zoom })
  }

  // -------------------------------------------------------------------------
  // Commit flow: admin applies directly; manager attaches a required note
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
      } finally { setBusy(false) }
    } else {
      setNoteDraft("")
      setCommitDraft(draft)
    }
  }

  async function submitProposal() {
    if (!commitDraft || !noteDraft.trim()) return
    setBusy(true)
    try {
      await proposeChange({
        warehouseId,
        actionType: commitDraft.actionType,
        sectionId: commitDraft.sectionId,
        proposedData: commitDraft.proposed,
        previousData: commitDraft.previous,
        requestNote: noteDraft.trim(),
        requestedBy: viewerName,
      })
      setCommitDraft(null)
      await refresh()
    } finally { setBusy(false) }
  }

  function cancelProposal() {
    setCommitDraft(null)
    setDraftGeom({})
  }

  // -------------------------------------------------------------------------
  // Pointer handling
  // -------------------------------------------------------------------------
  function onZonePointerDown(e: React.PointerEvent, zone: ZoneSection, mode: "move" | "resize") {
    if (!canEdit || tool === "pan" || pendingForZone(zone.id)) return
    if (isDrawTool(tool) && mode === "move") return // draw tools don't move zones
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragRef.current = { zoneId: zone.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...zone } }
    dragMovedRef.current = false
  }

  function onCanvasPointerDown(e: React.PointerEvent) {
    // background press: pan (select/pan tools) or start drawing (draw tools)
    if (isDrawTool(tool) && canEdit) {
      const w = screenToWorld(e.clientX, e.clientY)
      const start = { x0: w.x, y0: w.y, x1: w.x, y1: w.y }
      drawRef.current = start
      setDrawRect(start)
    } else {
      panRef.current = { startX: e.clientX, startY: e.clientY, ox: view.x, oy: view.y, moved: false }
    }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (drag) {
      const dx = (e.clientX - drag.startX) / view.zoom
      const dy = (e.clientY - drag.startY) / view.zoom
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 3) dragMovedRef.current = true
      const { orig } = drag
      if (drag.mode === "move") {
        setDraftGeom((g) => ({ ...g, [drag.zoneId]: { x: snap(orig.x + dx), y: snap(orig.y + dy) } }))
      } else {
        setDraftGeom((g) => ({ ...g, [drag.zoneId]: {
          width:  Math.max(MIN_SIZE, snap(orig.width + dx)),
          height: Math.max(MIN_SIZE, snap(orig.height + dy)),
        } }))
      }
      return
    }
    if (drawRef.current) {
      const w = screenToWorld(e.clientX, e.clientY)
      const next = { ...drawRef.current, x1: w.x, y1: w.y }
      drawRef.current = next
      setDrawRect(next)
      return
    }
    if (panRef.current) {
      const p = panRef.current
      const dx = e.clientX - p.startX
      const dy = e.clientY - p.startY
      if (Math.abs(dx) + Math.abs(dy) > 3) p.moved = true
      setView((v) => ({ ...v, x: p.ox + dx, y: p.oy + dy }))
    }
  }

  function onCanvasPointerUp() {
    // finish zone drag/resize
    const drag = dragRef.current
    if (drag) {
      dragRef.current = null
      const zone = zones.find((z) => z.id === drag.zoneId)
      const geom = draftGeom[drag.zoneId]
      if (!dragMovedRef.current || !zone || !geom) {
        setSelectedZoneId(drag.zoneId)
        setSelectedRequestId(null)
        setDraftGeom((g) => { const { [drag.zoneId]: _omit, ...rest } = g; return rest })
        return
      }
      const previous = snapshot(zone)
      const proposed = { ...previous, ...geom }
      void submitChange({ actionType: "update", sectionId: zone.id, proposed, previous })
      return
    }
    // finish drawing a new zone
    if (drawRef.current) {
      const d = drawRef.current
      drawRef.current = null
      setDrawRect(null)
      const x = snap(Math.min(d.x0, d.x1))
      const y = snap(Math.min(d.y0, d.y1))
      const width = snap(Math.abs(d.x1 - d.x0))
      const height = snap(Math.abs(d.y1 - d.y0))
      if (width >= MIN_DRAW && height >= MIN_DRAW) {
        const kind = tool === "draw-zone" ? "zone" : "shelf"
        const code = kind === "zone" ? nextCode("ZONE") : nextCode("S")
        void submitChange({
          actionType: "create",
          sectionId: null,
          proposed: {
            kind,
            code,
            name: kind === "zone" ? "New zone" : "New shelf",
            x, y, width, height,
            capacity: kind === "zone" ? 0 : 100,
          },
          previous: null,
        })
        // stay on the draw tool so several boxes can be laid out in a row
      }
      return
    }
    // finish pan (a click without movement deselects)
    if (panRef.current) {
      if (!panRef.current.moved) { setSelectedZoneId(null); setSelectedRequestId(null) }
      panRef.current = null
    }
  }

  function nextCode(prefix: string) {
    const codes = new Set(zones.map((z) => z.code))
    let n = 1
    while (codes.has(`${prefix}${n}`)) n++
    return `${prefix}${n}`
  }

  // -------------------------------------------------------------------------
  // Panel actions
  // -------------------------------------------------------------------------
  function saveZoneForm() {
    if (!selectedZone) return
    const previous = snapshot(selectedZone)
    const proposed: ZoneFields = {
      ...previous,
      code: formCode.trim() || previous.code,
      name: formName.trim() || previous.name,
      capacity: Number(formCapacity) > 0 ? Number(formCapacity) : previous.capacity,
    }
    if (Object.keys(changedFields(previous, proposed)).length === 0) return
    void submitChange({ actionType: "update", sectionId: selectedZone.id, proposed, previous })
  }

  function deleteZone() {
    if (!selectedZone) return
    void submitChange({ actionType: "delete", sectionId: selectedZone.id, proposed: null, previous: snapshot(selectedZone) })
    setSelectedZoneId(null)
  }

  // -------------------------------------------------------------------------
  // Admin review actions
  // -------------------------------------------------------------------------
  async function onApprove(req: ZoneChangeRequest) {
    setBusy(true)
    try { await approveRequest(req.id, viewerName); setSelectedRequestId(null); await refresh() }
    finally { setBusy(false) }
  }
  async function onReject(req: ZoneChangeRequest) {
    if (!rejectNote.trim()) return
    setBusy(true)
    try { await rejectRequest(req.id, viewerName, rejectNote.trim()); setSelectedRequestId(null); setRejectNote(""); await refresh() }
    finally { setBusy(false) }
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  const showPendingOverlays = role !== "staff"
  const pendingCreates = showPendingOverlays ? pending.filter((r) => r.actionType === "create") : []
  const commitCreatePreview = commitDraft?.actionType === "create" ? commitDraft.proposed : null

  const cursor =
    tool === "pan"    ? (panRef.current ? "grabbing" : "grab") :
    isDrawTool(tool)  ? "crosshair" : "default"

  const tools: { key: Tool; label: string; icon: React.ElementType; editorOnly?: boolean }[] = [
    { key: "select",     label: "Select / move",   icon: MousePointer2 },
    { key: "pan",        label: "Pan",             icon: Hand },
    { key: "draw-shelf", label: "Draw shelf block", icon: Boxes,       editorOnly: true },
    { key: "draw-zone",  label: "Draw zone box",   icon: SquareDashed, editorOnly: true },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Warehouse Map</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === "staff" ? "Live layout (view only) — drag to pan, scroll to zoom" :
             tool === "draw-shelf" ? "Drag on the map to draw a shelf block" :
             tool === "draw-zone" ? "Drag on the map to draw a zone box (grouping)" :
             role === "manager" ? "Move/resize/draw boxes — changes are submitted for approval" :
             "Edits are live immediately and logged"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {(["empty", "partial", "full"] as const).map((o) => (
              <span key={o} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`size-2.5 rounded-sm border-2 ${occupancyBorder[o]}`} />
                {occupancyLabel[o]}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2.5 rounded-sm border-2 border-dashed border-slate-400" />
              Zone
            </span>
          </div>
          {pending.length > 0 && showPendingOverlays && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium ring-1 ring-indigo-200">
              {pending.length} pending
            </span>
          )}
        </div>
      </div>

      {/* Map window */}
      <div className="relative">
        {/* Tool palette */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 bg-white/95 backdrop-blur rounded-lg border border-slate-200 shadow-sm p-1">
          {tools.filter((t) => !t.editorOnly || canEdit).map((t) => (
            <button
              key={t.key}
              title={t.label}
              onClick={() => setTool(t.key)}
              className={`size-8 rounded-md flex items-center justify-center transition-colors ${
                tool === t.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <t.icon className="size-4" />
            </button>
          ))}
        </div>

        {/* Zoom / view controls */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur rounded-lg border border-slate-200 shadow-sm p-1">
          <button title="Zoom out" onClick={() => zoomAt(view.zoom / 1.2, (canvasRef.current?.getBoundingClientRect().left ?? 0) + (canvasRef.current?.clientWidth ?? 0) / 2, (canvasRef.current?.getBoundingClientRect().top ?? 0) + VIEW_H / 2)} className="size-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <Minus className="size-4" />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center tabular-nums">{Math.round(view.zoom * 100)}%</span>
          <button title="Zoom in" onClick={() => zoomAt(view.zoom * 1.2, (canvasRef.current?.getBoundingClientRect().left ?? 0) + (canvasRef.current?.clientWidth ?? 0) / 2, (canvasRef.current?.getBoundingClientRect().top ?? 0) + VIEW_H / 2)} className="size-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <Plus className="size-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-0.5" />
          <button title="Fit to content" onClick={fitToContent} className="size-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <Maximize className="size-4" />
          </button>
          <button title="Reset view" onClick={() => setView({ zoom: 1, x: 40, y: 40 })} className="size-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <LocateFixed className="size-4" />
          </button>
        </div>

        <div
          ref={canvasRef}
          className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden touch-none"
          style={{
            height: VIEW_H,
            cursor,
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(148,163,184,0.15) 1px, transparent 1px)",
            backgroundSize: `${GRID * view.zoom}px ${GRID * view.zoom}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              <Loader2 className="size-4 animate-spin mr-2" /> Loading map…
            </div>
          )}

          {/* World layer */}
          <div
            className="absolute top-0 left-0"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: "0 0" }}
          >
            {/* zone-kind boxes render first so they sit behind shelf blocks */}
            {[...zones].sort((a, b) => (a.kind === "zone" ? 0 : 1) - (b.kind === "zone" ? 0 : 1)).map((zone) => {
              const req = showPendingOverlays ? pendingForZone(zone.id) : undefined
              const geom = draftGeom[zone.id]
              const x = geom?.x ?? zone.x
              const y = geom?.y ?? zone.y
              const w = geom?.width ?? zone.width
              const h = geom?.height ?? zone.height
              const isZone = zone.kind === "zone"
              const occ = isZone ? "empty" : zoneOccupancy(zone, stock)
              const total = isZone ? 0 : zoneStockTotal(zone.id, stock)
              const selected = selectedZoneId === zone.id
              const liveIsDashed = !!req

              return (
                <div key={zone.id}>
                  <div
                    onPointerDown={(e) => onZonePointerDown(e, zone, "move")}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (req) { setSelectedRequestId(req.id); setSelectedZoneId(null) }
                      else { setSelectedZoneId(zone.id); setSelectedRequestId(null) }
                    }}
                    className={`absolute rounded-md border-2 ${
                      isZone ? "border-dashed border-slate-400 bg-slate-500/[0.04]" : `bg-transparent ${occupancyBorder[occ]}`
                    } ${liveIsDashed ? "border-dashed opacity-60" : ""} ${
                      selected ? "ring-2 ring-indigo-400 ring-offset-1" : ""
                    } ${canEdit && !req && tool !== "pan" ? "cursor-move" : ""}`}
                    style={{ left: x, top: y, width: w, height: h }}
                  >
                    {isZone ? (
                      <span className="absolute top-1.5 left-1.5 bg-white/80 text-slate-500 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded pointer-events-none">
                        {zone.code} · {zone.name}
                      </span>
                    ) : (
                      <div className="absolute top-1 left-1.5 right-1 leading-tight pointer-events-none">
                        <p className="text-xs font-bold text-slate-700">{zone.code}</p>
                        {/* Drop lines that won't fit so small/narrow racks stay legible */}
                        {h >= 52 && w >= 90 && (
                          <p className="text-[10px] font-medium text-slate-500 truncate">{zone.name}</p>
                        )}
                        {h >= 40 && (
                          <p className={`text-[10px] font-medium ${occupancyText[occ]}`}>
                            {total.toLocaleString()} / {zone.capacity.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    {canEdit && !req && tool !== "pan" && (
                      <div
                        onPointerDown={(e) => onZonePointerDown(e, zone, "resize")}
                        className="absolute -bottom-1 -right-1 size-3 rounded-sm bg-white border-2 border-slate-400 cursor-se-resize"
                      />
                    )}
                  </div>

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
                      <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-indigo-600 text-white text-[10px] font-semibold pointer-events-none">Pending</span>
                    </div>
                  )}

                  {req && req.actionType === "delete" && (
                    <span className="absolute px-1.5 py-px rounded bg-red-600 text-white text-[10px] font-semibold pointer-events-none" style={{ left: x + 4, top: y - 10 }}>
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
                style={{ left: req.proposedData?.x ?? 20, top: req.proposedData?.y ?? 20, width: req.proposedData?.width ?? 160, height: req.proposedData?.height ?? 120 }}
              >
                <div className="absolute top-1 left-1.5 leading-tight pointer-events-none">
                  <p className="text-xs font-bold text-indigo-700">{req.proposedData?.code}</p>
                </div>
                <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-indigo-600 text-white text-[10px] font-semibold pointer-events-none">Pending</span>
              </div>
            ))}

            {/* Manager's in-flight create (while typing the note) */}
            {commitCreatePreview && (
              <div
                className="absolute rounded-md border-2 border-dashed border-indigo-400 bg-indigo-50/30 pointer-events-none"
                style={{ left: commitCreatePreview.x, top: commitCreatePreview.y, width: commitCreatePreview.width, height: commitCreatePreview.height }}
              />
            )}

            {/* Rubber-band while drawing */}
            {drawRect && (
              <div
                className="absolute rounded-md border-2 border-dashed border-indigo-500 bg-indigo-100/30 pointer-events-none"
                style={{
                  left: Math.min(drawRect.x0, drawRect.x1),
                  top: Math.min(drawRect.y0, drawRect.y1),
                  width: Math.abs(drawRect.x1 - drawRect.x0),
                  height: Math.abs(drawRect.y1 - drawRect.y0),
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Selected box panel */}
      {selectedZone && !selectedRequest && (
        <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {selectedZone.kind === "zone" ? (
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-slate-800">Zone box {selectedZone.code} · {selectedZone.name}</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">Grouping</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-800">Shelf {selectedZone.code} · {selectedZone.name}</h4>
                <span className={`text-xs font-medium ${occupancyText[zoneOccupancy(selectedZone, stock)]}`}>
                  {occupancyLabel[zoneOccupancy(selectedZone, stock)]} · {zoneStockTotal(selectedZone.id, stock).toLocaleString()} / {selectedZone.capacity.toLocaleString()} units
                </span>
              </div>
            )}
            {selectedZone.kind === "zone" ? (
              <p className="text-xs text-slate-400">A zone box groups shelf blocks — it carries no stock of its own.</p>
            ) : stock.filter((s) => s.sectionId === selectedZone.id).length === 0 ? (
              <p className="text-xs text-slate-400">No stock in this shelf.</p>
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
                <span className="text-xs font-medium text-slate-500">Code / label</span>
                <input value={formCode} onChange={(e) => setFormCode(e.target.value)} className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">{selectedZone.kind === "zone" ? "Zone name" : "Shelf name"}</span>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </label>
              {selectedZone.kind === "shelf" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Capacity (units)</span>
                  <input value={formCapacity} inputMode="numeric" onChange={(e) => setFormCapacity(e.target.value.replace(/[^0-9]/g, ""))} className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </label>
              )}
              <div className="flex items-center gap-2 mt-1">
                <button onClick={saveZoneForm} disabled={busy} className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {role === "manager" ? "Propose changes" : "Save"}
                </button>
                <button onClick={deleteZone} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">Delete</button>
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
              <p className="text-sm text-slate-600 mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">“{selectedRequest.requestNote}”</p>
            </div>

            {role === "admin" ? (
              <div className="flex flex-col gap-2 sm:w-72 shrink-0">
                <button onClick={() => onApprove(selectedRequest)} disabled={busy} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                  <Check className="size-4" /> Approve
                </button>
                <div className="flex flex-col gap-1.5">
                  <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection (required)" className="px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                  <button onClick={() => onReject(selectedRequest)} disabled={busy || !rejectNote.trim()} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
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

      {/* Manager note modal */}
      {commitDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cancelProposal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Describe this change</h3>
            <p className="text-xs text-slate-400 mb-4">A short message is required — the admin will see it when reviewing your proposal.</p>
            <textarea
              autoFocus value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3}
              placeholder={
                commitDraft.actionType === "create" ? "e.g. New overflow zone for Q3 inbound" :
                commitDraft.actionType === "delete" ? "e.g. Zone unused since the re-layout" :
                "e.g. Moved zone B nearer the loading dock"
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={cancelProposal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={submitProposal} disabled={!noteDraft.trim() || busy} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40">
                {busy ? "Submitting…" : "Submit proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
