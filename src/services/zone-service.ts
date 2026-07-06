/**
 * Zone layout data-access layer (see grgi_zone_layout_spec.md).
 *
 * Same pattern as dashboard-service: an in-memory mock adapter by default,
 * with apiFetch branches ready for the real backend. The maker-checker rules
 * live here so the UI stays presentational:
 *
 *  - admin edits  → applied to live sections immediately, logged as a
 *                   self-approved layout_change_requests row
 *  - manager edits → pending request only; sections untouched until review
 *  - approve      → proposed data written into live sections
 *  - reject       → requires review_note; sections untouched
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import type {
  ZoneSection,
  ZoneStockEntry,
  ZoneChangeRequest,
  ZoneChangeAction,
  ZoneFields,
  ZoneOccupancy,
} from "@/types/dashboard"

// ---------------------------------------------------------------------------
// Mock store (module-level, survives across calls within a browser session)
// ---------------------------------------------------------------------------

// Shelf blocks are square by default (equal width/height); zone boxes are
// free-form grouping containers rendered behind the shelves.
const seedZones: ZoneSection[] = [
  // Warehouse 1 — grouping zone boxes (rendered behind, organize the shelves)
  { id: 20, warehouseId: 1, kind: "zone", code: "INBOUND",  x: 20,  y: 20,  width: 380, height: 190, capacity: 0 },
  { id: 21, warehouseId: 1, kind: "zone", code: "STORAGE",  x: 20,  y: 220, width: 380, height: 190, capacity: 0 },
  // Warehouse 1 — shelf blocks (square)
  { id: 1, warehouseId: 1, kind: "shelf", code: "A", x: 40,  y: 40,  width: 150, height: 150, capacity: 400 },
  { id: 2, warehouseId: 1, kind: "shelf", code: "B", x: 240, y: 40,  width: 150, height: 150, capacity: 250 },
  { id: 3, warehouseId: 1, kind: "shelf", code: "C", x: 40,  y: 240, width: 150, height: 150, capacity: 300 },
  { id: 4, warehouseId: 1, kind: "shelf", code: "D", x: 240, y: 240, width: 150, height: 150, capacity: 500 },
  { id: 5, warehouseId: 1, kind: "shelf", code: "RET", x: 440, y: 40, width: 150, height: 150, capacity: 80 },
  // Warehouse 3 (Taunggyi — the detail-page example)
  { id: 9,  warehouseId: 3, kind: "zone",  code: "COLD CHAIN", x: 420, y: 20, width: 200, height: 240, capacity: 0 },
  { id: 6,  warehouseId: 3, kind: "shelf", code: "A", x: 40,  y: 40,  width: 150, height: 150, capacity: 450 },
  { id: 7,  warehouseId: 3, kind: "shelf", code: "B", x: 240, y: 40,  width: 150, height: 150, capacity: 300 },
  { id: 8,  warehouseId: 3, kind: "shelf", code: "C", x: 40,  y: 240, width: 150, height: 150, capacity: 350 },
  { id: 10, warehouseId: 3, kind: "shelf", code: "COLD", x: 440, y: 60, width: 150, height: 150, capacity: 120 },
]

const seedStock: ZoneStockEntry[] = [
  { id: 1, sectionId: 1, itemName: "Grand Royal Signature", quantity: 260 },
  { id: 2, sectionId: 1, itemName: "Grand Royal Black",     quantity: 140 }, // zone 1: 400/400 full
  { id: 3, sectionId: 2, itemName: "Chingu Soju (Peach)",   quantity: 90  }, // zone 2: partial
  { id: 4, sectionId: 4, itemName: "Grand Royal Smooth",    quantity: 180 },
  { id: 5, sectionId: 4, itemName: "Chingu Soju (Yogurt)",  quantity: 120 }, // zone 4: partial
  { id: 6, sectionId: 6, itemName: "Grand Royal Signature", quantity: 450 }, // zone 6: full
  { id: 7, sectionId: 7, itemName: "Grand Royal Double Cask", quantity: 60 }, // zone 7: partial
  { id: 8, sectionId: 10, itemName: "Chingu Soju (Grape)",  quantity: 120 }, // shelf 10 (COLD): full
  // shelves 3, 5, 8: empty
]

// Default zones for any warehouse without an explicit seed, so every detail
// page has something to show.
function defaultZones(warehouseId: number): ZoneSection[] {
  const base = warehouseId * 100
  return [
    { id: base + 1, warehouseId, kind: "shelf", code: "A", x: 40,  y: 40,  width: 150, height: 150, capacity: 300 },
    { id: base + 2, warehouseId, kind: "shelf", code: "B", x: 240, y: 40,  width: 150, height: 150, capacity: 300 },
    { id: base + 3, warehouseId, kind: "shelf", code: "C", x: 40,  y: 240, width: 150, height: 150, capacity: 200 },
  ]
}

const store = {
  zones: [...seedZones],
  stock: [...seedStock],
  requests: [] as ZoneChangeRequest[],
  seededWarehouses: new Set(seedZones.map((z) => z.warehouseId)),
  nextZoneId: 1000,
  nextRequestId: 1,
}

function ensureWarehouse(warehouseId: number) {
  if (!store.seededWarehouses.has(warehouseId)) {
    store.zones.push(...defaultZones(warehouseId))
    store.seededWarehouses.add(warehouseId)
  }
}

const clone = <T>(v: T): T => structuredClone(v)
const now = () => new Date().toISOString()

function applyToSections(req: ZoneChangeRequest) {
  if (req.actionType === "create") {
    const id = store.nextZoneId++
    store.zones.push({
      id,
      warehouseId: req.warehouseId,
      kind: req.proposedData?.kind ?? "shelf",
      code: req.proposedData?.code ?? "NEW",
      x: req.proposedData?.x ?? 40,
      y: req.proposedData?.y ?? 40,
      width: req.proposedData?.width ?? 150,
      height: req.proposedData?.height ?? 150,
      capacity: req.proposedData?.capacity ?? 100,
    })
  } else if (req.actionType === "update" && req.sectionId != null) {
    const zone = store.zones.find((z) => z.id === req.sectionId)
    if (zone && req.proposedData) Object.assign(zone, req.proposedData)
  } else if (req.actionType === "delete" && req.sectionId != null) {
    store.zones = store.zones.filter((z) => z.id !== req.sectionId)
    store.stock = store.stock.filter((s) => s.sectionId !== req.sectionId)
  }
}

// ---------------------------------------------------------------------------
// Derived helpers (shared by all roles)
// ---------------------------------------------------------------------------

export function zoneOccupancy(zone: ZoneSection, stock: ZoneStockEntry[]): ZoneOccupancy {
  const total = stock.filter((s) => s.sectionId === zone.id).reduce((sum, s) => sum + s.quantity, 0)
  if (total <= 0) return "empty"
  if (total >= zone.capacity) return "full"
  return "partial"
}

export function zoneStockTotal(zoneId: number, stock: ZoneStockEntry[]): number {
  return stock.filter((s) => s.sectionId === zoneId).reduce((sum, s) => sum + s.quantity, 0)
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getZones(warehouseId: number): Promise<ZoneSection[]> {
  if (config.useMock) {
    ensureWarehouse(warehouseId)
    return clone(store.zones.filter((z) => z.warehouseId === warehouseId))
  }
  return apiFetch<ZoneSection[]>(`/warehouses/${warehouseId}/zones`)
}

export async function getZoneStock(warehouseId: number): Promise<ZoneStockEntry[]> {
  if (config.useMock) {
    ensureWarehouse(warehouseId)
    const zoneIds = new Set(store.zones.filter((z) => z.warehouseId === warehouseId).map((z) => z.id))
    return clone(store.stock.filter((s) => zoneIds.has(s.sectionId)))
  }
  return apiFetch<ZoneStockEntry[]>(`/warehouses/${warehouseId}/zone-stock`)
}

export async function getPendingRequests(warehouseId: number): Promise<ZoneChangeRequest[]> {
  if (config.useMock) {
    return clone(store.requests.filter((r) => r.warehouseId === warehouseId && r.status === "pending"))
  }
  return apiFetch<ZoneChangeRequest[]>(`/warehouses/${warehouseId}/layout-requests?status=pending`)
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface ZoneChangeInput {
  warehouseId: number
  actionType: ZoneChangeAction
  sectionId: number | null
  proposedData: ZoneFields | null
  previousData: ZoneFields | null
  requestNote: string
  requestedBy: string
}

/** Admin path: live immediately, logged as a self-approved request. */
export async function applyDirectChange(input: ZoneChangeInput): Promise<ZoneChangeRequest> {
  if (config.useMock) {
    const req: ZoneChangeRequest = {
      id: store.nextRequestId++,
      ...input,
      status: "approved",
      reviewedBy: input.requestedBy,
      reviewedAt: now(),
      reviewNote: null,
    }
    applyToSections(req)
    store.requests.push(req)
    return clone(req)
  }
  return apiFetch<ZoneChangeRequest>(`/warehouses/${input.warehouseId}/layout-requests/direct`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/** Manager path: pending proposal only — sections untouched until review. */
export async function proposeChange(input: ZoneChangeInput): Promise<ZoneChangeRequest> {
  if (!input.requestNote.trim()) {
    throw new Error("A message describing the change is required for proposals.")
  }
  if (config.useMock) {
    const req: ZoneChangeRequest = {
      id: store.nextRequestId++,
      ...input,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    }
    store.requests.push(req)
    return clone(req)
  }
  return apiFetch<ZoneChangeRequest>(`/warehouses/${input.warehouseId}/layout-requests`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function approveRequest(requestId: number, reviewedBy: string): Promise<void> {
  if (config.useMock) {
    const req = store.requests.find((r) => r.id === requestId && r.status === "pending")
    if (!req) return
    applyToSections(req)
    req.status = "approved"
    req.reviewedBy = reviewedBy
    req.reviewedAt = now()
    return
  }
  await apiFetch<void>(`/layout-requests/${requestId}/approve`, { method: "POST" })
}

export async function rejectRequest(requestId: number, reviewedBy: string, reviewNote: string): Promise<void> {
  if (!reviewNote.trim()) {
    throw new Error("A review note explaining the rejection is required.")
  }
  if (config.useMock) {
    const req = store.requests.find((r) => r.id === requestId && r.status === "pending")
    if (!req) return
    req.status = "rejected"
    req.reviewedBy = reviewedBy
    req.reviewedAt = now()
    req.reviewNote = reviewNote
    return
  }
  await apiFetch<void>(`/layout-requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reviewNote }),
  })
}
