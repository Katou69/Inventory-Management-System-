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
  ZoneChangeItem,
  ZoneOccupancy,
} from "@/types/dashboard"

// ---------------------------------------------------------------------------
// Mock store (module-level, survives across calls within a browser session)
// ---------------------------------------------------------------------------

// Shelf blocks are square by default (equal width/height); zone boxes are
// free-form grouping containers rendered behind the shelves.
const seedZones: ZoneSection[] = [
  // Warehouse 1 — floor plan (see grgi_mock_layout_plan.md): Receiving → Storage
  // → Packing → Shipping flow, plus an Office. Grouping zone boxes render behind
  // the shelf blocks that sit spatially inside them.
  { id: 1, warehouseId: 1, kind: "zone", code: "Shipping",  name: "Shipping Bay",  x: 60,   y: 120, width: 460,  height: 290, capacity: 0 },
  { id: 2, warehouseId: 1, kind: "zone", code: "Receiving", name: "Receiving Bay", x: 820,  y: 120, width: 480,  height: 220, capacity: 0 },
  { id: 3, warehouseId: 1, kind: "zone", code: "Storage",   name: "Storage Hall",  x: 520,  y: 420, width: 780,  height: 640, capacity: 0 },
  { id: 4, warehouseId: 1, kind: "zone", code: "Packing",   name: "Packing Area",  x: 80,   y: 440, width: 340,  height: 200, capacity: 0 },
  { id: 5, warehouseId: 1, kind: "zone", code: "Office",    name: "Office",        x: 80,   y: 700, width: 320,  height: 190, capacity: 0 },

  { id: 6, warehouseId: 1, kind: "shelf", code: "R1", name: "Receiving Rack 1", x: 850,  y: 190, width: 120, height: 90, capacity: 150 },
  { id: 7, warehouseId: 1, kind: "shelf", code: "R2", name: "Receiving Rack 2", x: 1000, y: 190, width: 120, height: 90, capacity: 150 },
  { id: 8, warehouseId: 1, kind: "shelf", code: "R3", name: "Receiving Rack 3", x: 1150, y: 190, width: 120, height: 90, capacity: 150 },

  { id: 9,  warehouseId: 1, kind: "shelf", code: "S1",     name: "Shipping Rack 1", x: 90,   y: 190, width: 110, height: 90, capacity: 120 },
  { id: 10, warehouseId: 1, kind: "shelf", code: "S2",     name: "Shipping Rack 2", x: 220,  y: 190, width: 110, height: 90, capacity: 120 },
  { id: 11, warehouseId: 1, kind: "shelf", code: "S3",     name: "Shipping Rack 3", x: 350,  y: 190, width: 110, height: 90, capacity: 120 },
  { id: 12, warehouseId: 1, kind: "shelf", code: "S-Rack", name: "Shipping Narrow Rack", x: 90, y: 300, width: 110, height: 90, capacity: 80 },

  { id: 13, warehouseId: 1, kind: "shelf", code: "ST-L1", name: "Storage Left 1",  x: 560,  y: 460, width: 300, height: 80, capacity: 300 },
  { id: 14, warehouseId: 1, kind: "shelf", code: "ST-R1", name: "Storage Right 1", x: 920,  y: 460, width: 300, height: 80, capacity: 300 },
  { id: 15, warehouseId: 1, kind: "shelf", code: "ST-L2", name: "Storage Left 2",  x: 560,  y: 560, width: 300, height: 80, capacity: 300 },
  { id: 16, warehouseId: 1, kind: "shelf", code: "ST-R2", name: "Storage Right 2", x: 920,  y: 560, width: 300, height: 80, capacity: 300 },
  { id: 17, warehouseId: 1, kind: "shelf", code: "ST-L3", name: "Storage Left 3",  x: 560,  y: 660, width: 300, height: 80, capacity: 300 },
  { id: 18, warehouseId: 1, kind: "shelf", code: "ST-R3", name: "Storage Right 3", x: 920,  y: 660, width: 300, height: 80, capacity: 300 },
  { id: 19, warehouseId: 1, kind: "shelf", code: "ST-L4", name: "Storage Left 4",  x: 560,  y: 760, width: 300, height: 80, capacity: 300 },
  { id: 20, warehouseId: 1, kind: "shelf", code: "ST-R4", name: "Storage Right 4", x: 920,  y: 760, width: 300, height: 80, capacity: 300 },
  { id: 21, warehouseId: 1, kind: "shelf", code: "ST-L5", name: "Storage Left 5",  x: 560,  y: 860, width: 300, height: 80, capacity: 300 },
  { id: 22, warehouseId: 1, kind: "shelf", code: "ST-R5", name: "Storage Right 5", x: 920,  y: 860, width: 300, height: 80, capacity: 300 },
  { id: 23, warehouseId: 1, kind: "shelf", code: "ST-Bulk1",   name: "Storage Bulk Floor",  x: 560, y: 960, width: 660, height: 80, capacity: 600 },
  { id: 24, warehouseId: 1, kind: "shelf", code: "ST-Reserve", name: "Storage Reserve Rack", x: 1240, y: 460, width: 40, height: 580, capacity: 400 },
  // Warehouse 3 (Taunggyi — the detail-page example)
  { id: 31, warehouseId: 3, kind: "zone",  code: "COLD CHAIN", name: "Cold Chain", x: 420, y: 20, width: 200, height: 240, capacity: 0 },
  { id: 32, warehouseId: 3, kind: "shelf", code: "A", name: "Bulk Storage 1", x: 40,  y: 40,  width: 150, height: 150, capacity: 450 },
  { id: 33, warehouseId: 3, kind: "shelf", code: "B", name: "Bulk Storage 2", x: 240, y: 40,  width: 150, height: 150, capacity: 300 },
  { id: 34, warehouseId: 3, kind: "shelf", code: "C", name: "Bulk Storage 3", x: 40,  y: 240, width: 150, height: 150, capacity: 350 },
  { id: 35, warehouseId: 3, kind: "shelf", code: "COLD", name: "Cold Store",   x: 440, y: 60, width: 150, height: 150, capacity: 120 },
]

const seedStock: ZoneStockEntry[] = [
  // Warehouse 1 (grgi_mock_layout_plan.md) — mix of Empty/Partial/Full, with
  // ST-R3 (shelf 18) deliberately holding two SKUs to test mixed-product shelves.
  { id: 1,  sectionId: 6,  itemName: "Grand Royal Whisky Reserve 700ml", quantity: 150 }, // R1: 150/150 full
  { id: 2,  sectionId: 8,  itemName: "Grand Royal Gin Classic 700ml",    quantity: 60  }, // R3: 60/150 partial
  { id: 3,  sectionId: 9,  itemName: "Grand Royal Vodka Original 700ml", quantity: 120 }, // S1: 120/120 full
  { id: 4,  sectionId: 11, itemName: "Grand Royal Soju 360ml",           quantity: 45  }, // S3: 45/120 partial
  { id: 5,  sectionId: 12, itemName: "Grand Royal Whisky Reserve 700ml", quantity: 80  }, // S-Rack: 80/80 full
  { id: 6,  sectionId: 13, itemName: "Grand Royal Vodka Original 700ml", quantity: 300 }, // ST-L1: full
  { id: 7,  sectionId: 15, itemName: "Grand Royal Gin Classic 700ml",    quantity: 150 }, // ST-L2: partial
  { id: 8,  sectionId: 16, itemName: "Grand Royal Soju 360ml",           quantity: 300 }, // ST-R2: full
  { id: 9,  sectionId: 18, itemName: "Grand Royal Whisky Reserve 700ml", quantity: 100 }, // ST-R3: mixed SKU…
  { id: 10, sectionId: 18, itemName: "Grand Royal Gin Classic 700ml",    quantity: 80  }, // ST-R3: …180/300 partial
  { id: 11, sectionId: 19, itemName: "Grand Royal Vodka Original 700ml", quantity: 300 }, // ST-L4: full
  { id: 12, sectionId: 21, itemName: "Grand Royal Soju 360ml",           quantity: 90  }, // ST-L5: partial
  { id: 13, sectionId: 23, itemName: "Grand Royal Whisky Reserve 700ml", quantity: 600 }, // ST-Bulk1: full
  { id: 14, sectionId: 24, itemName: "Grand Royal Gin Classic 700ml",    quantity: 200 }, // ST-Reserve: 200/400 partial
  // R2, S2, ST-R1, ST-L3, ST-R4, ST-R5: empty
  // Warehouse 3
  { id: 15, sectionId: 32, itemName: "Grand Royal Signature",   quantity: 450 }, // WH3 A: full
  { id: 16, sectionId: 33, itemName: "Grand Royal Double Cask", quantity: 60  }, // WH3 B: partial
  { id: 17, sectionId: 35, itemName: "Chingu Soju (Grape)",     quantity: 120 }, // WH3 COLD store: full
  // WH3 C: empty
]

// Default zones for any warehouse without an explicit seed, so every detail
// page has something to show.
function defaultZones(warehouseId: number): ZoneSection[] {
  const base = warehouseId * 100
  return [
    { id: base + 1, warehouseId, kind: "shelf", code: "A", name: "Bulk Storage 1", x: 40,  y: 40,  width: 150, height: 150, capacity: 300 },
    { id: base + 2, warehouseId, kind: "shelf", code: "B", name: "Bulk Storage 2", x: 240, y: 40,  width: 150, height: 150, capacity: 300 },
    { id: base + 3, warehouseId, kind: "shelf", code: "C", name: "Bulk Storage 3", x: 40,  y: 240, width: 150, height: 150, capacity: 200 },
  ]
}

// A demo pending proposal so an admin landing on warehouse 1 has something to
// review immediately (mock store is empty on load otherwise). One batch, two
// changes: nudge shelf S3 and relabel Receiving Rack 2.
const seedRequests: ZoneChangeRequest[] = [
  {
    id: 1,
    warehouseId: 1,
    requestedBy: "Aung Htoo Pyae",
    items: [
      {
        actionType: "update",
        sectionId: 11, // S3 "Shipping Rack 3"
        previousData: { code: "S3", name: "Shipping Rack 3", x: 350, y: 190, width: 110, height: 90, capacity: 120 },
        proposedData: { code: "S3", name: "Shipping Rack 3", x: 350, y: 300, width: 110, height: 90, capacity: 120 },
      },
      {
        actionType: "update",
        sectionId: 7, // R2 "Receiving Rack 2"
        previousData: { code: "R2", name: "Receiving Rack 2", capacity: 150 },
        proposedData: { code: "R2", name: "Receiving Rack 2 (Fast-movers)", capacity: 200 },
      },
    ],
    requestNote: "Re-layout: move S3 clear of the aisle and bump R2 capacity for fast-movers.",
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
  },
]

const store = {
  zones: [...seedZones],
  stock: [...seedStock],
  requests: [...seedRequests],
  seededWarehouses: new Set(seedZones.map((z) => z.warehouseId)),
  nextZoneId: 1000,
  nextRequestId: seedRequests.length + 1,
}

function ensureWarehouse(warehouseId: number) {
  if (!store.seededWarehouses.has(warehouseId)) {
    store.zones.push(...defaultZones(warehouseId))
    store.seededWarehouses.add(warehouseId)
  }
}

const clone = <T>(v: T): T => structuredClone(v)
const now = () => new Date().toISOString()

function applyItem(warehouseId: number, item: ZoneChangeItem) {
  if (item.actionType === "create") {
    const id = store.nextZoneId++
    store.zones.push({
      id,
      warehouseId,
      kind: item.proposedData?.kind ?? "shelf",
      code: item.proposedData?.code ?? "NEW",
      name: item.proposedData?.name ?? "",
      x: item.proposedData?.x ?? 40,
      y: item.proposedData?.y ?? 40,
      width: item.proposedData?.width ?? 150,
      height: item.proposedData?.height ?? 150,
      capacity: item.proposedData?.capacity ?? 100,
    })
  } else if (item.actionType === "update" && item.sectionId != null) {
    const zone = store.zones.find((z) => z.id === item.sectionId)
    if (zone && item.proposedData) Object.assign(zone, item.proposedData)
  } else if (item.actionType === "delete" && item.sectionId != null) {
    store.zones = store.zones.filter((z) => z.id !== item.sectionId)
    store.stock = store.stock.filter((s) => s.sectionId !== item.sectionId)
  }
}

/** Apply every change in a batch, in submitted order. */
function applyRequest(req: ZoneChangeRequest) {
  for (const item of req.items) applyItem(req.warehouseId, item)
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
  items: ZoneChangeItem[]
  requestNote: string
  requestedBy: string
}

/**
 * Admin path: apply a single change live immediately, logged as a self-approved
 * one-item batch. Admins edit per-change (no batching), so this takes one item.
 */
export async function applyDirectChange(
  input: { warehouseId: number; item: ZoneChangeItem; requestedBy: string },
): Promise<ZoneChangeRequest> {
  if (config.useMock) {
    const req: ZoneChangeRequest = {
      id: store.nextRequestId++,
      warehouseId: input.warehouseId,
      requestedBy: input.requestedBy,
      items: [input.item],
      requestNote: "",
      status: "approved",
      reviewedBy: input.requestedBy,
      reviewedAt: now(),
      reviewNote: null,
    }
    applyRequest(req)
    store.requests.push(req)
    return clone(req)
  }
  // requestedBy is NOT sent: the server takes the author from the session. It used
  // to be client-supplied, which meant the caller chose who the audit trail blamed.
  return apiFetch<ZoneChangeRequest>(`/warehouses/${input.warehouseId}/layout-requests/direct`, {
    method: "POST",
    body: JSON.stringify({ item: input.item }),
  })
}

/**
 * Manager path: pending proposal batching several changes under one note —
 * sections untouched until review.
 */
export async function proposeChange(input: ZoneChangeInput): Promise<ZoneChangeRequest> {
  if (!input.requestNote.trim()) {
    throw new Error("A message describing the change is required for proposals.")
  }
  if (input.items.length === 0) {
    throw new Error("A proposal must contain at least one change.")
  }
  if (config.useMock) {
    const req: ZoneChangeRequest = {
      id: store.nextRequestId++,
      warehouseId: input.warehouseId,
      requestedBy: input.requestedBy,
      items: input.items,
      requestNote: input.requestNote,
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
    body: JSON.stringify({ items: input.items, requestNote: input.requestNote }),
  })
}

export async function approveRequest(requestId: number, reviewedBy: string): Promise<void> {
  if (config.useMock) {
    const req = store.requests.find((r) => r.id === requestId && r.status === "pending")
    if (!req) return
    applyRequest(req)
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
