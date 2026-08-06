# Known issues

## Orders and Purchases tabs are read-only on the backend — mock data kept intentionally

**Status:** open
**Affects:** `/dashboard/orders`, `/dashboard/purchase` (all roles)

`backend/app/orders/router.py` and `backend/app/purchases/router.py` only implement
`GET /orders` and `GET /purchase-orders` (list, correctly role/warehouse-scoped —
verified in `backend/tests/test_role_crud_matrix.py`). There is no backend
support yet for:

- Creating an order
- Receiving a purchase order (`ReceivingChecklistModal`)
- Placing received stock into inventory (`PlaceInInventoryChecklist`)
- Moving an order to shipping / picking (`MoveToShipModal`, `PickingChecklist`)

`src/services/purchase-service.ts`'s `deductInventory`, `addInventory`,
`getShelfStockForProduct`, and `getAllShelves` mutate the frontend's in-memory
mock arrays directly and have no live-backend branch at all.

**Why still mocked:** `NEXT_PUBLIC_USE_MOCK_ORDERS` / `NEXT_PUBLIC_USE_MOCK_PURCHASES`
in `.env.local` are deliberately left `true`. Flipping them would make the
table listings real but leave every mutating action in these tabs broken or
silently writing to now-disconnected mock state.

**To close:** implement `POST /orders`, the PO receiving/placement endpoints,
and the order picking/ship endpoints, give `purchase-service.ts` real
`apiFetch` branches for the four functions above, then flip both flags.

(Inventory's equivalent flag, `NEXT_PUBLIC_USE_MOCK_INVENTORY`, was flipped to
`false` — `/items`, `/warehouses/{id}/inventory`, `/suppliers`, and
movement-tasks are fully implemented and live.)
