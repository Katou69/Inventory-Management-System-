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
 *   - Select tool: click selects; shift-click toggles a box into/out of a
 *     multi-selection; dragging on empty space rubber-band selects. A
 *     multi-selection can be dragged together, duplicated, or deleted as one.
 *   - Resize: 8 handles (4 corners + 4 edge midpoints) per box, each anchoring
 *     the opposite side — same mental model as Figma/PowerPoint.
 *   - Undo/redo: manager edits are pure local state until submitted, so
 *     undo/redo there just rewinds the local `staged` list. Admin edits are
 *     already persisted (applyDirectChange runs immediately), so admin
 *     undo/redo replays the *inverse* edit as a new logged direct change —
 *     it does not rewrite history, it corrects it, same as a human would.
 *   - Floors + blueprint + real-world scale are presentational aids layered
 *     on top of one warehouse's zones — see the "Floors" section below for
 *     why they're client-only for now.
 *
 * Zones are hollow rectangles; border color = live occupancy derived from
 * zone_stock vs capacity (gray empty / amber partial / red full). A thin fill
 * bar under the quantity line shows the exact %, independent of that 3-tier
 * color.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  MousePointer2, Hand, Boxes, SquareDashed, Plus, Minus, Maximize, LocateFixed,
  X, Check, Loader2, Undo2, Redo2, Copy, Trash2, ImagePlus, Eye, EyeOff,
} from "lucide-react"
import {
  getZones, getZoneStock, getPendingRequests,
  applyDirectChange, proposeChange, approveRequest, rejectRequest,
  zoneOccupancy, zoneStockTotal,
} from "@/services/zone-service"
import type {
  ViewerRole, ZoneSection, ZoneStockEntry, ZoneChangeRequest, ZoneChangeItem,
  ZoneChangeAction, ZoneFields, ZoneOccupancy,
} from "@/types/dashboard"
const VIEW_H     = 560   // canvas window height (px)
const GRID       = 20    // world units per grid cell
const MIN_SIZE   = 40    // smallest zone (world units)
const MIN_DRAW   = 24    // min drag to count as a drawn zone (world units)
const MIN_ZOOM   = 0.2
const MAX_ZOOM   = 3
const EDGE_SNAP  = 10    // world units — snap a dragged box to a neighbor's edge within this range

const occupancyBorder: Record<ZoneOccupancy, string> = {
  empty:   "border-slate-400 dark:border-slate-600",
  partial: "border-amber-500",
  full:    "border-red-500",
}
const occupancyText: Record<ZoneOccupancy, string> = {
  empty:   "text-muted-foreground",
  partial: "text-amber-600 dark:text-amber-400",
  full:    "text-red-600 dark:text-red-400",
}
const occupancyBar: Record<ZoneOccupancy, string> = {
  empty:   "bg-slate-400 dark:bg-slate-600",
  partial: "bg-amber-500",
  full:    "bg-red-500",
}
const occupancyLabel: Record<ZoneOccupancy, string> = {
  empty: "Empty", partial: "Partial", full: "Full",
}

type Tool = "select" | "pan" | "draw-shelf" | "draw-zone"
type View = { zoom: number; x: number; y: number }
/** Resize handle directions — which edge(s) of the box that handle anchors. */
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
type DragMode = "move" | ResizeDir

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const snap = (v: number) => Math.round(v / GRID) * GRID
const isDrawTool = (t: Tool) => t === "draw-shelf" || t === "draw-zone"

const HANDLES: { dir: ResizeDir; cursor: string }[] = [
  { dir: "nw", cursor: "nwse-resize" }, { dir: "n", cursor: "ns-resize" }, { dir: "ne", cursor: "nesw-resize" }, { dir: "e", cursor: "ew-resize" },
  { dir: "se", cursor: "nwse-resize" }, { dir: "s", cursor: "ns-resize" }, { dir: "sw", cursor: "nesw-resize" }, { dir: "w", cursor: "ew-resize" },
]
function handleOffset(dir: ResizeDir, w: number, h: number) {
  if (dir === "nw") return { left: -4, top: -4 }
  if (dir === "n")  return { left: w / 2 - 4, top: -4 }
  if (dir === "ne") return { left: w - 4, top: -4 }
  if (dir === "e")  return { left: w - 4, top: h / 2 - 4 }
  if (dir === "se") return { left: w - 4, top: h - 4 }
  if (dir === "s")  return { left: w / 2 - 4, top: h - 4 }
  if (dir === "sw") return { left: -4, top: h - 4 }
  return { left: -4, top: h / 2 - 4 } // w
}
/** Resize a box from any of the 8 handles, anchoring the opposite edge(s). */
function computeResize(dir: ResizeDir, o: { x: number; y: number; width: number; height: number }, dx: number, dy: number) {
  let { x, y, width, height } = o
  if (dir.includes("e")) width = Math.max(MIN_SIZE, snap(o.width + dx))
  if (dir.includes("w")) { const right = o.x + o.width; width = Math.max(MIN_SIZE, snap(o.width - dx)); x = right - width }
  if (dir.includes("s")) height = Math.max(MIN_SIZE, snap(o.height + dy))
  if (dir.includes("n")) { const bottom = o.y + o.height; height = Math.max(MIN_SIZE, snap(o.height - dy)); y = bottom - height }
  return { x, y, width, height }
}
/** Snap a dragged box's top-left to the nearest edge of any other box, within EDGE_SNAP. */
function snapToEdges(x: number, y: number, w: number, h: number, others: { x: number; y: number; width: number; height: number }[]) {
  let bestDx: number | null = null, bestDy: number | null = null
  for (const o of others) {
    for (const c of [o.x - x, o.x + o.width - x, o.x - w - x, o.x + o.width - w - x]) {
      if (Math.abs(c) <= EDGE_SNAP && (bestDx === null || Math.abs(c) < Math.abs(bestDx))) bestDx = c
    }
    for (const c of [o.y - y, o.y + o.height - y, o.y - h - y, o.y + o.height - h - y]) {
      if (Math.abs(c) <= EDGE_SNAP && (bestDy === null || Math.abs(c) < Math.abs(bestDy))) bestDy = c
    }
  }
  return { x: x + (bestDx ?? 0), y: y + (bestDy ?? 0) }
}

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

function actionSummary(item: ZoneChangeItem): string {
  if (item.actionType === "create") return `Create zone "${item.proposedData?.code}"`
  if (item.actionType === "delete") return `Delete zone "${item.previousData?.code}"`
  const keys = Object.keys(changedFields(item.previousData ?? {}, item.proposedData ?? {}))
  return `Update zone "${item.previousData?.code}" (${keys.join(", ")})`
}

type DragState = {
  zoneId: number
  mode: DragMode
  startX: number   // client px
  startY: number
  /** Every box being dragged together (a multi-selection), each with its own starting geometry. */
  groupIds: number[]
  origByZoneId: Record<number, { x: number; y: number; width: number; height: number }>
}
type PanState = { startX: number; startY: number; ox: number; oy: number; moved: boolean }
type DrawState = { x0: number; y0: number; x1: number; y1: number } // world coords
type MarqueeState = DrawState & { shiftKey: boolean; moved: boolean }

type CommitDraft = {
  actionType: ZoneChangeAction
  /** Live section id for update/delete; a negative temp id for a staged create; null for an admin create not yet resolved. */
  sectionId: number | null
  proposed: ZoneFields | null
  previous: ZoneFields | null
}

const toChangeItem = (d: CommitDraft): ZoneChangeItem => ({
  actionType: d.actionType,
  sectionId: d.sectionId,
  proposedData: d.proposed,
  previousData: d.previous,
})

/** The inverse of a committed draft — what undoing it means to apply next. */
function inverseDraft(d: CommitDraft): CommitDraft {
  if (d.actionType === "update") return { actionType: "update", sectionId: d.sectionId, proposed: d.previous, previous: d.proposed }
  if (d.actionType === "create") return { actionType: "delete", sectionId: d.sectionId, proposed: null, previous: d.proposed }
  return { actionType: "create", sectionId: null, proposed: d.previous, previous: null } // delete -> recreate (gets a new id)
}

// ---------------------------------------------------------------------------
// Floors
// ---------------------------------------------------------------------------
// A warehouse building can span multiple physical floors, but `ZoneSection`
// (and the mock backend) has no floor concept yet — only `warehouseId`.
// Rather than block this on a schema/API change, floors are modeled here as a
// client-side grouping over the existing flat zone list: `floorAssignment`
// maps each zone id to a floor id (defaulting to the first floor for any zone
// that predates floors). Blueprint images and the grid-to-real-world scale
// are floor-scoped the same way. None of this is sent to the server yet —
// TODO once the backend grows a `floors` table: swap `floorAssignment` for a
// real `zone.floorId` column and persist floors/blueprints server-side.
type Floor = { id: number; name: string }
type BlueprintImage = { dataUrl: string; x: number; y: number; width: number; height: number }
type Scale = { pxPerUnit: number; unit: "ft" | "m" }

export default function ZoneLayoutCanvas({
  warehouseId, role, viewerName,
}: { warehouseId: number; role: ViewerRole; viewerName: string }) {
  const [zones, setZones] = useState<ZoneSection[]>([])
  const [stock, setStock] = useState<ZoneStockEntry[]>([])
  const [pending, setPending] = useState<ZoneChangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const selectedZoneId = selectedIds.length === 1 ? selectedIds[0] : null
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  // Map viewport
  const [tool, setTool] = useState<Tool>("select")
  const [view, setView] = useState<View>({ zoom: 1, x: 40, y: 40 })
  const viewRef = useRef(view)
  useEffect(() => { viewRef.current = view }, [view])

  // Live geometry overrides while dragging/resizing (before commit)
  const [draftGeom, setDraftGeom] = useState<Record<number, ZoneFields>>({})
  const [drawRect, setDrawRect] = useState<DrawState | null>(null)
  const [marquee, setMarquee] = useState<MarqueeState | null>(null)

  const dragRef = useRef<DragState | null>(null)
  const dragMovedRef = useRef(false)
  const panRef = useRef<PanState | null>(null)
  const drawRef = useRef<DrawState | null>(null)
  const marqueeRef = useRef<MarqueeState | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)

  const [noteDraft, setNoteDraft] = useState("")
  // Manager's uncommitted edits, accumulated until "Submit proposal".
  const [staged, setStaged] = useState<CommitDraft[]>([])
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const nextStagedIdRef = useRef(-1)
  const [formCode, setFormCode] = useState("")
  const [formName, setFormName] = useState("")
  const [formCapacity, setFormCapacity] = useState("")
  const [rejectNote, setRejectNote] = useState("")
  const [busy, setBusy] = useState(false)

  // Undo/redo — manager rewinds local `staged` snapshots; admin replays the
  // inverse edit as a new direct change (see file header + inverseDraft()).
  const [managerHistory, setManagerHistory] = useState<CommitDraft[][]>([])
  const [managerFuture, setManagerFuture] = useState<CommitDraft[][]>([])
  const [adminHistory, setAdminHistory] = useState<CommitDraft[]>([])
  const [adminFuture, setAdminFuture] = useState<CommitDraft[]>([])

  // Floors (client-side grouping — see the "Floors" comment above)
  const [floors, setFloors] = useState<Floor[]>([{ id: 1, name: "Floor 1" }])
  const [activeFloorId, setActiveFloorId] = useState(1)
  const activeFloorIdRef = useRef(activeFloorId)
  useEffect(() => { activeFloorIdRef.current = activeFloorId }, [activeFloorId])
  const [floorAssignment, setFloorAssignment] = useState<Record<number, number>>({})
  const floorAssignmentRef = useRef(floorAssignment)
  useEffect(() => { floorAssignmentRef.current = floorAssignment }, [floorAssignment])
  const [renamingFloorId, setRenamingFloorId] = useState<number | null>(null)
  const [floorNameDraft, setFloorNameDraft] = useState("")
  const zoneFloorId = useCallback((zoneId: number) => floorAssignment[zoneId] ?? floors[0]?.id ?? 1, [floorAssignment, floors])

  // Blueprint image + real-world scale, per floor
  const [blueprints, setBlueprints] = useState<Record<number, BlueprintImage>>({})
  const [bgOpacity, setBgOpacity] = useState(0.55)
  const [bgVisible, setBgVisible] = useState(true)
  const [bgEditing, setBgEditing] = useState(false)
  const bgDragRef = useRef<{ mode: "move" | ResizeDir; startX: number; startY: number; orig: BlueprintImage } | null>(null)
  const bgImgElRef = useRef<HTMLImageElement | null>(null)
  const [scale, setScale] = useState<Scale | null>(null)
  const [scaleUnit, setScaleUnit] = useState<"ft" | "m">("ft")
  const [gridUnitInput, setGridUnitInput] = useState("")

  const canEdit = role === "admin" || role === "manager"
  const activeTool: Tool = !canEdit && isDrawTool(tool) ? "select" : tool

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
    return z
  }, [warehouseId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh() }, [refresh])

  // Any zone id that shows up after a mutation and has no floor yet belongs
  // to whichever floor was active when the edit was made.
  const adoptNewZoneFloors = useCallback((beforeIds: Set<number>, afterZones: ZoneSection[]) => {
    const newIds = afterZones.map((z) => z.id).filter((id) => !beforeIds.has(id) && !(id in floorAssignmentRef.current))
    if (newIds.length === 0) return
    setFloorAssignment((prev) => {
      const next = { ...prev }
      for (const id of newIds) next[id] = activeFloorIdRef.current
      return next
    })
  }, [])

  const pendingForZone = (zoneId: number) =>
    pending.find((r) => r.items.some((it) => it.sectionId === zoneId))
  const pendingItemForZone = (zoneId: number): ZoneChangeItem | undefined =>
    pending.flatMap((r) => r.items).find((it) => it.sectionId === zoneId)
  /** Which floor a pending item concerns — used to scope the map to one floor at a time. */
  const itemFloorId = (item: ZoneChangeItem): number => {
    if (item.actionType === "create") return activeFloorIdRef.current // no live zone yet; assume current floor
    const z = zones.find((zz) => zz.id === item.sectionId)
    return z ? zoneFloorId(z.id) : activeFloorIdRef.current
  }

  const stagedFor = (zoneId: number) => staged.find((d) => d.sectionId === zoneId) ?? null
  const stagedDeleteIds = new Set(
    staged.filter((d) => d.actionType === "delete").map((d) => d.sectionId),
  )

  const allDisplayZones: ZoneSection[] =
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
              kind: d.proposed?.kind ?? "shelf",
              code: d.proposed?.code ?? "NEW",
              name: d.proposed?.name ?? "",
              x: d.proposed?.x ?? 20,
              y: d.proposed?.y ?? 20,
              width: d.proposed?.width ?? 150,
              height: d.proposed?.height ?? 150,
              capacity: d.proposed?.capacity ?? 100,
            } satisfies ZoneSection)),
        ]
      : zones

  // The map only ever shows the active floor's zones.
  const displayZones = useMemo(
    () => allDisplayZones.filter((z) => zoneFloorId(z.id) === activeFloorId),
    [allDisplayZones, zoneFloorId, activeFloorId],
  )

  const selectedZone = displayZones.find((z) => z.id === selectedZoneId) ?? null
  const selectedRequest = pending.find((r) => r.id === selectedRequestId) ?? null

  useEffect(() => {
    if (selectedZone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      ...zones.filter((z) => zoneFloorId(z.id) === activeFloorId).map((z) => ({ x: z.x, y: z.y, w: z.width, h: z.height })),
      ...pending
        .flatMap((r) => r.items)
        .filter((it) => it.actionType === "create" && itemFloorId(it) === activeFloorId)
        .map((it) => ({
          x: it.proposedData?.x ?? 0, y: it.proposedData?.y ?? 0,
          w: it.proposedData?.width ?? 0, h: it.proposedData?.height ?? 0,
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
  // Commit flow: admin applies directly (+ records history); manager stages
  // -------------------------------------------------------------------------
  async function applyDirectAndRecord(draft: CommitDraft, { recordHistory }: { recordHistory: boolean }) {
    const beforeIds = new Set(zones.map((z) => z.id))
    setBusy(true)
    try {
      await applyDirectChange({ warehouseId, item: toChangeItem(draft), requestedBy: viewerName })
      const afterZones = await refresh()
      adoptNewZoneFloors(beforeIds, afterZones)
      let resolved = draft
      if (draft.actionType === "create") {
        const newId = afterZones.map((z) => z.id).find((id) => !beforeIds.has(id)) ?? null
        resolved = { ...draft, sectionId: newId }
      }
      if (recordHistory) {
        setAdminHistory((h) => [...h, resolved])
        setAdminFuture([])
      }
    } finally { setBusy(false) }
  }

  async function submitChange(draft: CommitDraft) {
    if (role === "admin") {
      await applyDirectAndRecord(draft, { recordHistory: true })
    } else {
      stageChange(draft)
    }
  }

  function stageChange(draft: CommitDraft) {
    setManagerHistory((h) => [...h, staged.map((d) => ({ ...d }))])
    setManagerFuture([])
    if (draft.actionType === "create" && draft.sectionId != null) {
      setFloorAssignment((prev) => ({ ...prev, [draft.sectionId as number]: activeFloorId }))
    }
    setStaged((prev) => {
      if (draft.actionType === "delete" && draft.sectionId != null && draft.sectionId < 0) {
        return prev.filter((d) => d.sectionId !== draft.sectionId)
      }
      const rest = prev.filter((d) => d.sectionId !== draft.sectionId)
      const existing = prev.find((d) => d.sectionId === draft.sectionId)
      if (existing?.actionType === "create" && draft.actionType === "update") {
        return [...rest, { ...existing, proposed: { ...existing.proposed, ...draft.proposed } }]
      }
      return [...rest, draft]
    })
    setDraftGeom({})
  }

  async function undo() {
    if (busy) return
    if (role === "admin") {
      const last = adminHistory[adminHistory.length - 1]
      if (!last) return
      setAdminHistory((h) => h.slice(0, -1))
      await applyDirectAndRecord(inverseDraft(last), { recordHistory: false })
      setAdminFuture((f) => [...f, last])
    } else {
      const last = managerHistory[managerHistory.length - 1]
      if (!last) return
      setManagerHistory((h) => h.slice(0, -1))
      setManagerFuture((f) => [...f, staged.map((d) => ({ ...d }))])
      setStaged(last)
    }
    setSelectedIds([])
  }
  async function redo() {
    if (busy) return
    if (role === "admin") {
      const next = adminFuture[adminFuture.length - 1]
      if (!next) return
      setAdminFuture((f) => f.slice(0, -1))
      await applyDirectAndRecord(next, { recordHistory: false })
      setAdminHistory((h) => [...h, next])
    } else {
      const next = managerFuture[managerFuture.length - 1]
      if (!next) return
      setManagerFuture((f) => f.slice(0, -1))
      setManagerHistory((h) => [...h, staged.map((d) => ({ ...d }))])
      setStaged(next)
    }
    setSelectedIds([])
  }
  const canUndo = role === "admin" ? adminHistory.length > 0 : managerHistory.length > 0
  const canRedo = role === "admin" ? adminFuture.length > 0 : managerFuture.length > 0

  // Keyboard shortcuts: undo/redo/duplicate/delete/escape. Skipped while
  // typing in a form field.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea") return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) void redo(); else void undo(); return }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); void redo(); return }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateSelected(); return }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); return }
      if (e.key === "Escape") { setSelectedIds([]); setSelectedRequestId(null); setMarquee(null) }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, staged, adminHistory, adminFuture, managerHistory, managerFuture, role])

  async function submitProposal() {
    if (staged.length === 0 || !noteDraft.trim()) return
    setBusy(true)
    try {
      await proposeChange({
        warehouseId,
        items: staged.map((d) => ({
          actionType: d.actionType,
          sectionId: d.sectionId != null && d.sectionId < 0 ? null : d.sectionId,
          proposedData: d.proposed,
          previousData: d.previous,
        })),
        requestNote: noteDraft.trim(),
        requestedBy: viewerName,
      })
      setShowSubmitModal(false)
      await refresh()
      setManagerHistory([]); setManagerFuture([])
    } finally { setBusy(false) }
  }

  function openSubmitModal() {
    if (staged.length === 0) return
    setNoteDraft("")
    setShowSubmitModal(true)
  }

  function discardStaged() {
    setStaged([])
    setDraftGeom({})
    setSelectedIds([])
    setShowSubmitModal(false)
    setManagerHistory([]); setManagerFuture([])
  }

  // -------------------------------------------------------------------------
  // Pointer handling — select / move / 8-point resize / marquee / pan / draw
  // -------------------------------------------------------------------------
  function onZonePointerDown(e: React.PointerEvent, zone: ZoneSection, mode: DragMode) {
    if (pendingForZone(zone.id)) { e.stopPropagation(); return }
    if (!canEdit || activeTool === "pan") return
    if (isDrawTool(activeTool) && mode === "move") return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const inMultiSelection = mode === "move" && selectedIds.includes(zone.id) && selectedIds.length > 1
    const groupIds = inMultiSelection ? selectedIds.slice() : [zone.id]
    const origByZoneId: DragState["origByZoneId"] = {}
    for (const id of groupIds) {
      const z = displayZones.find((zz) => zz.id === id)
      if (z) origByZoneId[id] = { x: z.x, y: z.y, width: z.width, height: z.height }
    }
    dragRef.current = { zoneId: zone.id, mode, startX: e.clientX, startY: e.clientY, groupIds, origByZoneId }
    dragMovedRef.current = false
  }

  function onBgPointerDown(e: React.PointerEvent, mode: "move" | ResizeDir) {
    if (!bgEditing) return
    const bg = blueprints[activeFloorId]
    if (!bg) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    bgDragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...bg } }
  }

  function onCanvasPointerDown(e: React.PointerEvent) {
    if (isDrawTool(activeTool) && canEdit) {
      const w = screenToWorld(e.clientX, e.clientY)
      const start = { x0: w.x, y0: w.y, x1: w.x, y1: w.y }
      drawRef.current = start
      setDrawRect(start)
    } else if (activeTool === "select") {
      const w = screenToWorld(e.clientX, e.clientY)
      const start: MarqueeState = { x0: w.x, y0: w.y, x1: w.x, y1: w.y, shiftKey: e.shiftKey, moved: false }
      marqueeRef.current = start
      setMarquee(start)
    } else {
      panRef.current = { startX: e.clientX, startY: e.clientY, ox: view.x, oy: view.y, moved: false }
      setIsPanning(true)
    }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (drag) {
      const dx = (e.clientX - drag.startX) / view.zoom
      const dy = (e.clientY - drag.startY) / view.zoom
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 3) dragMovedRef.current = true
      const primaryOrig = drag.origByZoneId[drag.zoneId]
      if (drag.mode === "move") {
        let nx = snap(primaryOrig.x + dx), ny = snap(primaryOrig.y + dy)
        const others = displayZones.filter((z) => !drag.groupIds.includes(z.id))
        const snapped = snapToEdges(nx, ny, primaryOrig.width, primaryOrig.height, others)
        nx = snapped.x; ny = snapped.y
        const ddx = nx - primaryOrig.x, ddy = ny - primaryOrig.y
        setDraftGeom((g) => {
          const next = { ...g }
          for (const id of drag.groupIds) {
            const o = drag.origByZoneId[id]
            next[id] = { x: o.x + ddx, y: o.y + ddy }
          }
          return next
        })
      } else {
        const updated = computeResize(drag.mode, primaryOrig, dx, dy)
        setDraftGeom((g) => ({ ...g, [drag.zoneId]: updated }))
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
    if (bgDragRef.current) {
      const bd = bgDragRef.current
      const dx = (e.clientX - bd.startX) / view.zoom
      const dy = (e.clientY - bd.startY) / view.zoom
      const updated = bd.mode === "move"
        ? { ...bd.orig, x: bd.orig.x + dx, y: bd.orig.y + dy }
        : { ...bd.orig, ...computeResize(bd.mode, bd.orig, dx, dy) }
      setBlueprints((prev) => ({ ...prev, [activeFloorId]: updated }))
      return
    }
    if (marqueeRef.current) {
      const w = screenToWorld(e.clientX, e.clientY)
      const moved = marqueeRef.current.moved || Math.abs(w.x - marqueeRef.current.x0) + Math.abs(w.y - marqueeRef.current.y0) > 4
      const next = { ...marqueeRef.current, x1: w.x, y1: w.y, moved }
      marqueeRef.current = next
      setMarquee(next)
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
    const drag = dragRef.current
    if (drag) {
      dragRef.current = null
      if (!dragMovedRef.current) { setDraftGeom({}); return }
      for (const id of drag.groupIds) {
        const zone = displayZones.find((z) => z.id === id)
        const geom = draftGeom[id]
        if (!zone || !geom) continue
        const previous = snapshot(zone)
        const proposed = { ...previous, ...geom }
        void submitChange({ actionType: "update", sectionId: id, proposed, previous })
      }
      setDraftGeom({})
      return
    }
    if (drawRef.current) {
      const d = drawRef.current
      drawRef.current = null
      setDrawRect(null)
      const x = snap(Math.min(d.x0, d.x1))
      const y = snap(Math.min(d.y0, d.y1))
      const width = snap(Math.abs(d.x1 - d.x0))
      const height = snap(Math.abs(d.y1 - d.y0))
      if (width >= MIN_DRAW && height >= MIN_DRAW) {
        const kind = activeTool === "draw-zone" ? "zone" : "shelf"
        const code = kind === "zone" ? nextCode("ZONE") : nextCode("S")
        const sectionId = role === "manager" ? nextStagedIdRef.current-- : null
        void submitChange({
          actionType: "create",
          sectionId,
          proposed: { kind, code, name: kind === "zone" ? "New zone" : "New shelf", x, y, width, height, capacity: kind === "zone" ? 0 : 100 },
          previous: null,
        })
      }
      return
    }
    if (bgDragRef.current) { bgDragRef.current = null; return }
    if (marqueeRef.current) {
      const m = marqueeRef.current
      marqueeRef.current = null
      setMarquee(null)
      if (!m.moved) {
        if (!m.shiftKey) { setSelectedIds([]); setSelectedRequestId(null) }
        return
      }
      const minX = Math.min(m.x0, m.x1), maxX = Math.max(m.x0, m.x1)
      const minY = Math.min(m.y0, m.y1), maxY = Math.max(m.y0, m.y1)
      const hits = displayZones.filter((z) => z.x < maxX && z.x + z.width > minX && z.y < maxY && z.y + z.height > minY).map((z) => z.id)
      setSelectedIds((prev) => (m.shiftKey ? Array.from(new Set([...prev, ...hits])) : hits))
      setSelectedRequestId(null)
      return
    }
    if (panRef.current) {
      if (!panRef.current.moved) { setSelectedIds([]); setSelectedRequestId(null) }
      panRef.current = null
      setIsPanning(false)
    }
  }

  function onZoneClick(e: React.MouseEvent, zone: ZoneSection, req: ZoneChangeRequest | undefined) {
    e.stopPropagation()
    if (req) { setSelectedRequestId(req.id); setSelectedIds([]); return }
    if (e.shiftKey) {
      setSelectedIds((prev) => (prev.includes(zone.id) ? prev.filter((id) => id !== zone.id) : [...prev, zone.id]))
      setSelectedRequestId(null)
    } else {
      setSelectedIds([zone.id])
      setSelectedRequestId(null)
    }
  }

  function nextCode(prefix: string) {
    const codes = new Set(displayZones.map((z) => z.code))
    let n = 1
    while (codes.has(`${prefix}${n}`)) n++
    return `${prefix}${n}`
  }
  function nextDupeCode(base: string) {
    const codes = new Set(displayZones.map((z) => z.code))
    if (!codes.has(`${base}-copy`)) return `${base}-copy`
    let n = 2
    while (codes.has(`${base}-copy${n}`)) n++
    return `${base}-copy${n}`
  }

  // -------------------------------------------------------------------------
  // Multi-select actions
  // -------------------------------------------------------------------------
  function duplicateSelected() {
    if (!canEdit || selectedIds.length === 0) return
    for (const id of selectedIds) {
      const z = displayZones.find((zz) => zz.id === id)
      if (!z) continue
      const sectionId = role === "manager" ? nextStagedIdRef.current-- : null
      void submitChange({
        actionType: "create",
        sectionId,
        proposed: { kind: z.kind, code: nextDupeCode(z.code), name: z.name, x: z.x + GRID * 2, y: z.y + GRID * 2, width: z.width, height: z.height, capacity: z.capacity },
        previous: null,
      })
    }
    setSelectedIds([])
  }
  function deleteSelected() {
    if (!canEdit || selectedIds.length === 0) return
    for (const id of selectedIds) {
      const z = displayZones.find((zz) => zz.id === id)
      if (!z || pendingForZone(id)) continue
      void submitChange({ actionType: "delete", sectionId: id, proposed: null, previous: snapshot(z) })
    }
    setSelectedIds([])
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
    setSelectedIds([])
  }

  // -------------------------------------------------------------------------
  // Floors — add / rename / delete / switch (client-side; see header comment)
  // -------------------------------------------------------------------------
  function switchFloor(id: number) {
    setActiveFloorId(id)
    setSelectedIds([])
    setSelectedRequestId(null)
    setBgEditing(false)
    requestAnimationFrame(fitToContent)
  }
  function addFloor() {
    const id = Date.now()
    setFloors((prev) => [...prev, { id, name: `Floor ${prev.length + 1}` }])
    switchFloor(id)
  }
  function startRenameFloor(f: Floor) { setRenamingFloorId(f.id); setFloorNameDraft(f.name) }
  function commitRenameFloor() {
    const name = floorNameDraft.trim()
    if (name) setFloors((prev) => prev.map((f) => (f.id === renamingFloorId ? { ...f, name } : f)))
    setRenamingFloorId(null)
  }
  function deleteFloor(id: number) {
    if (floors.length <= 1) return
    const hasZones = zones.some((z) => zoneFloorId(z.id) === id)
    if (hasZones && !window.confirm("This floor has zones/shelves on it. Delete the floor and everything on it?")) return
    const idsOnFloor = zones.filter((z) => zoneFloorId(z.id) === id).map((z) => z.id)
    for (const zid of idsOnFloor) {
      const z = zones.find((zz) => zz.id === zid)
      if (z) void submitChange({ actionType: "delete", sectionId: zid, proposed: null, previous: snapshot(z) })
    }
    setFloors((prev) => prev.filter((f) => f.id !== id))
    setBlueprints((prev) => { const next = { ...prev }; delete next[id]; return next })
    if (activeFloorId === id) {
      const remaining = floors.filter((f) => f.id !== id)
      if (remaining[0]) switchFloor(remaining[0].id)
    }
  }

  // -------------------------------------------------------------------------
  // Blueprint import + grid scale
  // -------------------------------------------------------------------------
  function onBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        const maxDim = 1400
        const f = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
        setBlueprints((prev) => ({ ...prev, [activeFloorId]: { dataUrl, x: 0, y: 0, width: Math.round(img.naturalWidth * f), height: Math.round(img.naturalHeight * f) } }))
        setBgEditing(true)
        setBgVisible(true)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }
  function removeBlueprint() {
    setBlueprints((prev) => { const next = { ...prev }; delete next[activeFloorId]; return next })
    setBgEditing(false)
    setBgVisible(true)
  }
  // The blueprint <img> never gets a templated/derived `src` — it's set
  // imperatively once real image data exists, so there's nothing for the
  // browser to eagerly (and wrongly) fetch before that data is ready.
  const currentBlueprint = blueprints[activeFloorId] ?? null
  useEffect(() => {
    if (bgImgElRef.current) {
      if (currentBlueprint?.dataUrl) bgImgElRef.current.src = currentBlueprint.dataUrl
      else bgImgElRef.current.removeAttribute("src")
    }
  }, [currentBlueprint?.dataUrl])

  function onGridUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9.]/g, "")
    setGridUnitInput(v)
    const n = parseFloat(v)
    setScale(n > 0 ? { pxPerUnit: GRID / n, unit: scaleUnit } : null)
  }
  function onScaleUnitChange(u: "ft" | "m") {
    setScaleUnit(u)
    const n = parseFloat(gridUnitInput)
    if (n > 0) setScale({ pxPerUnit: GRID / n, unit: u })
  }

  // -------------------------------------------------------------------------
  // Admin review actions
  // -------------------------------------------------------------------------
  async function onApprove(req: ZoneChangeRequest) {
    const beforeIds = new Set(zones.map((z) => z.id))
    setBusy(true)
    try {
      await approveRequest(req.id, viewerName)
      setSelectedRequestId(null)
      const afterZones = await refresh()
      adoptNewZoneFloors(beforeIds, afterZones)
    }
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
  type PendingOverlay = { req: ZoneChangeRequest; item: ZoneChangeItem }
  const pendingOverlays: PendingOverlay[] = showPendingOverlays
    ? pending.flatMap((req) => req.items.map((item) => ({ req, item }))).filter((o) => itemFloorId(o.item) === activeFloorId)
    : []
  const pendingCreates = pendingOverlays.filter((o) => o.item.actionType === "create")
  const floorPendingCount = showPendingOverlays
    ? pending.filter((r) => r.items.some((it) => itemFloorId(it) === activeFloorId)).length
    : 0

  const cursor =
    activeTool === "pan"    ? (isPanning ? "grabbing" : "grab") :
    isDrawTool(activeTool)  ? "crosshair" : "default"

  const tools: { key: Tool; label: string; icon: React.ElementType; editorOnly?: boolean }[] = [
    { key: "select",     label: "Select / multi-select (drag empty space to marquee-select)", icon: MousePointer2 },
    { key: "pan",        label: "Pan",             icon: Hand },
    { key: "draw-shelf", label: "Draw shelf block", icon: Boxes,       editorOnly: true },
    { key: "draw-zone",  label: "Draw zone box",   icon: SquareDashed, editorOnly: true },
  ]

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Warehouse Map</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {role === "staff" ? "Live layout (view only) — drag to pan, scroll to zoom" :
             activeTool === "draw-shelf" ? "Drag on the map to draw a shelf block" :
             activeTool === "draw-zone" ? "Drag on the map to draw a zone box (grouping)" :
             role === "manager" ? "Move/resize/draw boxes — changes are submitted for approval" :
             "Edits are live immediately and logged"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {(["empty", "partial", "full"] as const).map((o) => (
              <span key={o} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2.5 rounded-sm border-2 ${occupancyBorder[o]}`} />
                {occupancyLabel[o]}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-sm border-2 border-dashed border-slate-400 dark:border-slate-600" />
              Zone
            </span>
          </div>
          {floorPendingCount > 0 && showPendingOverlays && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E5F0F5] dark:bg-primary/20 text-[#1A6B8A] dark:text-primary text-xs font-medium ring-1 ring-[#1A6B8A]/20 dark:ring-primary/30">
              {floorPendingCount} pending
            </span>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mb-2">
        Shift-click or drag-select to multi-select · Ctrl/Cmd+D duplicates · Delete removes · Ctrl/Cmd+Z undo
      </p>

      {/* Floor tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {floors.map((f) => {
          const active = f.id === activeFloorId
          return (
            <div
              key={f.id}
              className={`flex items-center gap-1 rounded-lg pl-3 pr-1.5 py-1.5 cursor-pointer ${active ? "bg-[#1A6B8A] dark:bg-primary" : "bg-accent"}`}
            >
              {renamingFloorId === f.id ? (
                <input
                  autoFocus value={floorNameDraft} onChange={(e) => setFloorNameDraft(e.target.value)}
                  onBlur={commitRenameFloor} onKeyDown={(e) => e.key === "Enter" && commitRenameFloor()}
                  className="w-24 px-1.5 py-0.5 text-xs font-semibold rounded border border-border text-foreground bg-input-background focus:outline-none"
                />
              ) : (
                <span
                  onClick={() => switchFloor(f.id)}
                  onDoubleClick={() => startRenameFloor(f)}
                  className={`text-xs font-semibold select-none ${active ? "text-white dark:text-primary-foreground" : "text-foreground/80"}`}
                >
                  {f.name}
                </span>
              )}
              {floors.length > 1 && (
                <button
                  title="Delete floor" onClick={(e) => { e.stopPropagation(); deleteFloor(f.id) }}
                  className={`text-xs px-1 leading-none ${active ? "text-white/70 dark:text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
        <button onClick={addFloor} className="text-xs font-medium text-[#1A6B8A] dark:text-primary border border-dashed border-[#1A6B8A]/40 dark:border-primary/40 rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors">
          + Add floor
        </button>
      </div>

      {/* Actions bar: undo/redo, duplicate/delete, blueprint import, grid scale */}
      <div className="flex items-center gap-2.5 flex-wrap mb-3 px-2.5 py-2 rounded-lg border border-border bg-accent/40">
        <div className="flex items-center gap-1">
          <button title="Undo (Ctrl/Cmd+Z)" onClick={() => void undo()} disabled={!canUndo || busy} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground rounded-md hover:bg-accent disabled:opacity-40 transition-colors">
            <Undo2 className="size-3.5" /> Undo
          </button>
          <button title="Redo (Ctrl/Cmd+Shift+Z)" onClick={() => void redo()} disabled={!canRedo || busy} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground rounded-md hover:bg-accent disabled:opacity-40 transition-colors">
            <Redo2 className="size-3.5" /> Redo
          </button>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <button title="Duplicate selection (Ctrl/Cmd+D)" onClick={duplicateSelected} disabled={!canEdit || selectedIds.length === 0} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#1A6B8A] dark:text-primary bg-[#E5F0F5] dark:bg-primary/10 rounded-md disabled:opacity-40 disabled:bg-transparent disabled:text-muted-foreground transition-colors">
            <Copy className="size-3.5" /> Duplicate
          </button>
          <button title="Delete selection (Del)" onClick={deleteSelected} disabled={!canEdit || selectedIds.length === 0} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md disabled:opacity-40 disabled:bg-transparent disabled:text-muted-foreground transition-colors">
            <Trash2 className="size-3.5" /> Delete
          </button>
          {selectedIds.length > 1 && <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>}
        </div>
        <div className="w-px h-4 bg-border" />
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#1A6B8A] dark:text-primary bg-[#E5F0F5] dark:bg-primary/10 rounded-md px-2 py-1 cursor-pointer">
          <ImagePlus className="size-3.5" /> Import blueprint
          <input type="file" accept="image/*" onChange={onBgFileChange} className="hidden" />
        </label>
        {currentBlueprint && (
          <div className="flex items-center gap-2">
            <button onClick={() => setBgEditing((v) => !v)} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${bgEditing ? "bg-[#1A6B8A] dark:bg-primary text-white dark:text-primary-foreground" : "bg-[#E5F0F5] dark:bg-primary/10 text-[#1A6B8A] dark:text-primary"}`}>
              {bgEditing ? "Done positioning" : "Reposition"}
            </button>
            <button title={bgVisible ? "Hide blueprint" : "Show blueprint"} onClick={() => setBgVisible((v) => !v)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-accent rounded-md">
              {bgVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {bgVisible ? "Hide" : "Show"}
            </button>
            <span className="text-xs text-muted-foreground">Opacity</span>
            <input type="range" min={0.1} max={1} step={0.05} value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className="w-20" />
            <button onClick={removeBlueprint} className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md">Remove</button>
          </div>
        )}
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Grid square =</span>
          <input value={gridUnitInput} onChange={onGridUnitChange} placeholder="e.g. 5" className="w-14 px-2 py-1 text-xs font-semibold bg-input-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex items-center bg-accent rounded-md p-0.5">
            {(["ft", "m"] as const).map((u) => (
              <button key={u} onClick={() => onScaleUnitChange(u)} className={`px-2 py-0.5 text-xs font-medium rounded ${scaleUnit === u ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map window */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 bg-card/95 backdrop-blur rounded-lg border border-border shadow-sm p-1">
          {tools.filter((t) => !t.editorOnly || canEdit).map((t) => (
            <button
              key={t.key}
              title={t.label}
              onClick={() => setTool(t.key)}
              className={`size-8 rounded-md flex items-center justify-center transition-colors ${
                activeTool === t.key ? "bg-[#1A6B8A] dark:bg-primary text-white dark:text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <t.icon className="size-4" />
            </button>
          ))}
        </div>

        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-card/95 backdrop-blur rounded-lg border border-border shadow-sm p-1">
          <button title="Zoom out" onClick={() => zoomAt(view.zoom / 1.2, (canvasRef.current?.getBoundingClientRect().left ?? 0) + (canvasRef.current?.clientWidth ?? 0) / 2, (canvasRef.current?.getBoundingClientRect().top ?? 0) + VIEW_H / 2)} className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent">
            <Minus className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{Math.round(view.zoom * 100)}%</span>
          <button title="Zoom in" onClick={() => zoomAt(view.zoom * 1.2, (canvasRef.current?.getBoundingClientRect().left ?? 0) + (canvasRef.current?.clientWidth ?? 0) / 2, (canvasRef.current?.getBoundingClientRect().top ?? 0) + VIEW_H / 2)} className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent">
            <Plus className="size-4" />
          </button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <button title="Fit to content" onClick={fitToContent} className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent">
            <Maximize className="size-4" />
          </button>
          <button title="Reset view" onClick={() => setView({ zoom: 1, x: 40, y: 40 })} className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent">
            <LocateFixed className="size-4" />
          </button>
        </div>

        <div
          ref={canvasRef}
          className="relative rounded-lg border border-border bg-accent/50 overflow-hidden touch-none"
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
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin mr-2" /> Loading map…
            </div>
          )}

          <div
            className="absolute top-0 left-0"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: "0 0" }}
          >
            {/* Blueprint backdrop — src is set imperatively via bgImgElRef, never templated */}
            {currentBlueprint && (
              <img
                ref={bgImgElRef}
                alt=""
                className="absolute pointer-events-none select-none"
                style={{ left: currentBlueprint.x, top: currentBlueprint.y, width: currentBlueprint.width, height: currentBlueprint.height, opacity: bgOpacity, display: bgVisible ? "block" : "none" }}
              />
            )}
            {currentBlueprint && bgEditing && bgVisible && (
              <div
                onPointerDown={(e) => onBgPointerDown(e, "move")}
                className="absolute rounded border-2 border-dashed border-[#1A6B8A] dark:border-primary cursor-move"
                style={{ left: currentBlueprint.x, top: currentBlueprint.y, width: currentBlueprint.width, height: currentBlueprint.height }}
              >
                {HANDLES.map((h) => {
                  const pos = handleOffset(h.dir, currentBlueprint.width, currentBlueprint.height)
                  return (
                    <div
                      key={h.dir}
                      onPointerDown={(e) => onBgPointerDown(e, h.dir)}
                      className="absolute size-2.5 rounded-sm bg-card border-2 border-[#1A6B8A] dark:border-primary"
                      style={{ left: pos.left, top: pos.top, cursor: h.cursor }}
                    />
                  )
                })}
              </div>
            )}

            {/* zone-kind boxes render first so they sit behind shelf blocks */}
            {[...displayZones].sort((a, b) => (a.kind === "zone" ? 0 : 1) - (b.kind === "zone" ? 0 : 1)).map((zone) => {
              const req = showPendingOverlays ? pendingForZone(zone.id) : undefined
              const pItem = req ? pendingItemForZone(zone.id) : undefined
              const stagedEdit = stagedFor(zone.id)
              const geom = draftGeom[zone.id]
              const x = geom?.x ?? zone.x
              const y = geom?.y ?? zone.y
              const w = geom?.width ?? zone.width
              const h = geom?.height ?? zone.height
              const isZone = zone.kind === "zone"
              const occ = isZone ? "empty" : zoneOccupancy(zone, stock)
              const total = isZone ? 0 : zoneStockTotal(zone.id, stock)
              const pct = isZone || zone.capacity <= 0 ? 0 : Math.min(100, Math.round((total / zone.capacity) * 100))
              const selected = selectedIds.includes(zone.id)
              const liveIsDashed = !!req
              const showHandles = canEdit && !req && activeTool !== "pan" && selectedIds.length <= 1
              const realSize = scale ? `${(w / scale.pxPerUnit).toFixed(1)} × ${(h / scale.pxPerUnit).toFixed(1)} ${scale.unit}` : null

              return (
                <div key={zone.id}>
                  <div
                    onPointerDown={(e) => onZonePointerDown(e, zone, "move")}
                    onClick={(e) => onZoneClick(e, zone, req)}
                    className={`absolute rounded-md border-2 ${
                      isZone ? "border-dashed border-slate-400 dark:border-slate-600 bg-slate-500/[0.04] dark:bg-slate-400/[0.06]" : `bg-transparent ${occupancyBorder[occ]}`
                    } ${liveIsDashed ? "border-dashed opacity-60" : ""} ${
                      stagedEdit ? "border-amber-500 border-dashed" : ""
                    } ${
                      selected ? "ring-2 ring-[#1A6B8A] dark:ring-primary ring-offset-1" : ""
                    } ${canEdit && !req && activeTool !== "pan" ? "cursor-move" : ""}`}
                    style={{ left: x, top: y, width: w, height: h }}
                  >
                    {isZone ? (
                      <span className="absolute top-1.5 left-1.5 bg-card/80 text-muted-foreground text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded pointer-events-none">
                        {zone.code} · {zone.name}
                      </span>
                    ) : (
                      <div className="absolute top-1 left-1.5 right-1 leading-tight pointer-events-none">
                        <p className="text-xs font-bold font-mono text-foreground">{zone.code}</p>
                        {h >= 52 && w >= 90 && (
                          <p className="text-[10px] font-medium text-muted-foreground truncate">{zone.name}</p>
                        )}
                        {h >= 40 && (
                          <>
                            <p className={`text-[10px] font-mono font-medium ${occupancyText[occ]}`}>
                              {total.toLocaleString()} / {zone.capacity.toLocaleString()} · {pct}%
                            </p>
                            <div className="h-1 rounded-full bg-accent mt-0.5 overflow-hidden">
                              <div className={`h-full rounded-full ${occupancyBar[occ]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {showHandles && HANDLES.map((hd) => {
                      const pos = handleOffset(hd.dir, w, h)
                      return (
                        <div
                          key={hd.dir}
                          onPointerDown={(e) => onZonePointerDown(e, zone, hd.dir)}
                          className="absolute size-2 rounded-sm bg-card border-2 border-slate-400 dark:border-slate-600"
                          style={{ left: pos.left, top: pos.top, cursor: hd.cursor }}
                        />
                      )
                    })}
                  </div>

                  {realSize && selected && (
                    <span className="absolute text-[10px] font-medium text-muted-foreground bg-card/90 px-1 rounded pointer-events-none" style={{ left: x, top: y + h + 3 }}>
                      {realSize}
                    </span>
                  )}

                  {stagedEdit && (
                    <span className="absolute px-1.5 py-px rounded bg-amber-500 text-white text-[10px] font-semibold pointer-events-none" style={{ left: x + 4, top: y - 10 }}>
                      {stagedEdit.actionType === "create" ? "New · draft" : "Draft"}
                    </span>
                  )}

                  {pItem && pItem.actionType === "update" && pItem.proposedData && (
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setSelectedRequestId(req!.id); setSelectedIds([]) }}
                      className={`absolute rounded-md border-2 bg-transparent border-[#1A6B8A] dark:border-primary cursor-pointer ${
                        selectedRequestId === req!.id ? "ring-2 ring-[#1A6B8A] dark:ring-primary ring-offset-1" : ""
                      }`}
                      style={{
                        left:   pItem.proposedData.x ?? zone.x,
                        top:    pItem.proposedData.y ?? zone.y,
                        width:  pItem.proposedData.width ?? zone.width,
                        height: pItem.proposedData.height ?? zone.height,
                      }}
                    >
                      <div className="absolute top-1 left-1.5 leading-tight pointer-events-none">
                        <p className="text-xs font-bold text-[#1A6B8A] dark:text-primary">{pItem.proposedData.code ?? zone.code}</p>
                      </div>
                      <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-[#1A6B8A] dark:bg-primary text-white dark:text-primary-foreground text-[10px] font-semibold pointer-events-none">Pending</span>
                    </div>
                  )}

                  {pItem && pItem.actionType === "delete" && (
                    <span className="absolute px-1.5 py-px rounded bg-red-600 text-white text-[10px] font-semibold pointer-events-none" style={{ left: x + 4, top: y - 10 }}>
                      Delete pending
                    </span>
                  )}
                </div>
              )
            })}

            {pendingCreates.map(({ req, item }, i) => (
              <div
                key={`create-${req.id}-${i}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setSelectedRequestId(req.id); setSelectedIds([]) }}
                className={`absolute rounded-md border-2 bg-transparent border-[#1A6B8A] dark:border-primary cursor-pointer ${
                  selectedRequestId === req.id ? "ring-2 ring-[#1A6B8A] dark:ring-primary ring-offset-1" : ""
                }`}
                style={{ left: item.proposedData?.x ?? 20, top: item.proposedData?.y ?? 20, width: item.proposedData?.width ?? 160, height: item.proposedData?.height ?? 120 }}
              >
                <div className="absolute top-1 left-1.5 leading-tight pointer-events-none">
                  <p className="text-xs font-bold text-[#1A6B8A] dark:text-primary">{item.proposedData?.code}</p>
                </div>
                <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-[#1A6B8A] dark:bg-primary text-white dark:text-primary-foreground text-[10px] font-semibold pointer-events-none">Pending</span>
              </div>
            ))}

            {role === "manager" && staged
              .filter((d) => d.actionType === "delete" && d.sectionId != null && d.sectionId >= 0 && zoneFloorId(d.sectionId) === activeFloorId)
              .map((d) => d.previous && (
                <div
                  key={`staged-delete-${d.sectionId}`}
                  className="absolute rounded-md border-2 border-dashed border-red-400 bg-red-50/30 dark:bg-red-950/20 opacity-60 pointer-events-none"
                  style={{ left: d.previous.x, top: d.previous.y, width: d.previous.width, height: d.previous.height }}
                >
                  <div className="absolute top-1 left-1.5 leading-tight">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 line-through">{d.previous.code}</p>
                  </div>
                  <span className="absolute -top-2.5 right-1 px-1.5 py-px rounded bg-red-500 text-white text-[10px] font-semibold">Will delete</span>
                </div>
              ))}

            {drawRect && (
              <div
                className="absolute rounded-md border-2 border-dashed border-[#1A6B8A] dark:border-primary bg-[#E5F0F5]/50 dark:bg-primary/10 pointer-events-none"
                style={{
                  left: Math.min(drawRect.x0, drawRect.x1),
                  top: Math.min(drawRect.y0, drawRect.y1),
                  width: Math.abs(drawRect.x1 - drawRect.x0),
                  height: Math.abs(drawRect.y1 - drawRect.y0),
                }}
              />
            )}
            {marquee && marquee.moved && (
              <div
                className="absolute rounded-md border border-dashed border-[#1A6B8A] dark:border-primary bg-[#E5F0F5]/30 dark:bg-primary/5 pointer-events-none"
                style={{
                  left: Math.min(marquee.x0, marquee.x1),
                  top: Math.min(marquee.y0, marquee.y1),
                  width: Math.abs(marquee.x1 - marquee.x0),
                  height: Math.abs(marquee.y1 - marquee.y0),
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Manager draft tray — accumulated edits submitted as one proposal */}
      {role === "manager" && staged.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-medium ring-1 ring-amber-200 dark:ring-amber-800">
              {staged.length} unsubmitted change{staged.length === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80 truncate">Edits are held as a draft — submit them together as one proposal.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={discardStaged} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card/60 rounded-lg transition-colors disabled:opacity-50">
              Discard
            </button>
            <button onClick={openSubmitModal} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-white bg-[#1A6B8A] hover:bg-[#145570] dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground rounded-lg transition-colors disabled:opacity-50">
              Submit proposal ({staged.length})
            </button>
          </div>
        </div>
      )}

      {/* Multi-selection quick actions (replaces the single-box panel while 2+ boxes are selected) */}
      {selectedIds.length > 1 && !selectedRequest && (
        <div className="mt-4 border-t border-border pt-4 flex items-center justify-between gap-3 flex-wrap">
          <h4 className="text-sm font-semibold text-foreground">{selectedIds.length} items selected</h4>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={duplicateSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1A6B8A] hover:bg-[#145570] dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground rounded-lg transition-colors">
                <Copy className="size-3.5" /> Duplicate all
              </button>
              <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                <Trash2 className="size-3.5" /> Delete all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected box panel */}
      {selectedZone && !selectedRequest && selectedIds.length === 1 && (
        <div className="mt-4 border-t border-border pt-4 flex flex-col sm:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {selectedZone.kind === "zone" ? (
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-foreground">Zone box {selectedZone.code} · {selectedZone.name}</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-muted-foreground text-xs font-medium">Grouping</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-foreground">Shelf {selectedZone.code} · {selectedZone.name}</h4>
                <span className={`text-xs font-medium ${occupancyText[zoneOccupancy(selectedZone, stock)]}`}>
                  {occupancyLabel[zoneOccupancy(selectedZone, stock)]} · {zoneStockTotal(selectedZone.id, stock).toLocaleString()} / {selectedZone.capacity.toLocaleString()} units
                </span>
              </div>
            )}
            {scale && (
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Real size ≈ {(selectedZone.width / scale.pxPerUnit).toFixed(1)} × {(selectedZone.height / scale.pxPerUnit).toFixed(1)} {scale.unit}
              </p>
            )}
            {selectedZone.kind === "zone" ? (
              <p className="text-xs text-muted-foreground">A zone box groups shelf blocks — it carries no stock of its own.</p>
            ) : stock.filter((s) => s.sectionId === selectedZone.id).length === 0 ? (
              <p className="text-xs text-muted-foreground">No stock in this shelf.</p>
            ) : (
              <ul className="space-y-1">
                {stock.filter((s) => s.sectionId === selectedZone.id).map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{s.itemName}</span>
                    <span className="font-semibold text-foreground">{s.quantity.toLocaleString()} units</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-col gap-2.5 sm:w-64 shrink-0">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Code / label</span>
                <input value={formCode} onChange={(e) => setFormCode(e.target.value)} className="px-2.5 py-1.5 text-sm bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{selectedZone.kind === "zone" ? "Zone name" : "Shelf name"}</span>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="px-2.5 py-1.5 text-sm bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </label>
              {selectedZone.kind === "shelf" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Capacity (units)</span>
                  <input value={formCapacity} inputMode="numeric" onChange={(e) => setFormCapacity(e.target.value.replace(/[^0-9]/g, ""))} className="px-2.5 py-1.5 text-sm bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </label>
              )}
              <div className="flex items-center gap-2 mt-1">
                <button onClick={saveZoneForm} disabled={busy} className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#1A6B8A] hover:bg-[#145570] dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground rounded-lg transition-colors disabled:opacity-50">
                  {role === "manager" ? "Add to proposal" : "Save"}
                </button>
                <button onClick={deleteZone} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50">Delete</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected pending request panel */}
      {selectedRequest && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E5F0F5] dark:bg-primary/20 text-[#1A6B8A] dark:text-primary text-xs font-medium ring-1 ring-[#1A6B8A]/20 dark:ring-primary/30">Pending</span>
                <h4 className="text-sm font-semibold text-foreground">
                  Proposal · {selectedRequest.items.length} change{selectedRequest.items.length === 1 ? "" : "s"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requested by {selectedRequest.requestedBy}</p>
              <ul className="mt-2 space-y-1">
                {selectedRequest.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="text-muted-foreground">•</span>
                    <span>{actionSummary(item)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-2 bg-accent border border-border rounded-lg px-3 py-2">"{selectedRequest.requestNote}"</p>
            </div>

            {role === "admin" ? (
              <div className="flex flex-col gap-2 sm:w-72 shrink-0">
                <button onClick={() => onApprove(selectedRequest)} disabled={busy} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                  <Check className="size-4" /> Approve
                </button>
                <div className="flex flex-col gap-1.5">
                  <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection (required)" className="px-2.5 py-1.5 text-sm bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                  <button onClick={() => onReject(selectedRequest)} disabled={busy || !rejectNote.trim()} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40">
                    <X className="size-4" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground shrink-0">Awaiting admin review</p>
            )}
          </div>
        </div>
      )}

      {/* Manager proposal note modal — one note covers the whole batch */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border">
            <h3 className="text-base font-semibold text-foreground mb-1">Describe this proposal</h3>
            <p className="text-xs text-muted-foreground mb-3">
              This covers {staged.length} change{staged.length === 1 ? "" : "s"}. A short message is
              required — the admin will see it when reviewing.
            </p>
            <ul className="mb-4 max-h-32 overflow-y-auto space-y-1 bg-accent border border-border rounded-lg px-3 py-2">
              {staged.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">•</span>
                  <span>{actionSummary(toChangeItem(d))}</span>
                </li>
              ))}
            </ul>
            <textarea
              autoFocus value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3}
              placeholder="e.g. Re-layout of the receiving bay for Q3 inbound"
              className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors">Cancel</button>
              <button onClick={submitProposal} disabled={!noteDraft.trim() || busy} className="px-4 py-2 text-sm font-medium text-white bg-[#1A6B8A] hover:bg-[#145570] dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground rounded-lg transition-colors disabled:opacity-40">
                {busy ? "Submitting…" : "Submit proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

