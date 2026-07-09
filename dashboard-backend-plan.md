# Plan: Real FastAPI Backend for the Admin Dashboard

## Context

The admin dashboard (`app/dashboard/page.tsx` + `src/components/dashboard/*`) is currently 100% mock data. Every function in `src/services/dashboard-service.ts` branches on `config.useMock` (which defaults to `true`), and the corresponding `apiFetch` branches point at endpoints that don't exist yet — `backend/app/routers/dashboard.py` is a 1-line stub. This was flagged in item 4 of `plan.md` ("Review dashboard + warehouse detail + settings — catalog dead buttons, decide what needs real endpoints"). This plan tackles the dashboard slice of that item: build the real backend (models, schemas, service layer, router, migration, seed data) so flipping `NEXT_PUBLIC_USE_MOCK_API=false` makes the admin dashboard fully real, with **zero changes to frontend types or components** (the TS contracts in `src/types/dashboard.ts` are treated as fixed).

A manager-scoped dashboard is planned to come later, reusing these same stats filtered to one warehouse. The service layer is designed with that in mind now (scope parameter on every function) so it isn't rewritten later — but this pass only wires the **admin (unscoped)** path through the router.

## Confirmed decisions

1. **Router**: single flat `dashboard.router` (`prefix=""`), matching the frontend's flat paths (`/status-cards`, `/warehouses`, `/sales/overview`, etc.) exactly — not `/dashboard/*`.
2. **Service layer**: introduced now in `backend/app/services/dashboard_service.py`. Every function takes `db: Session, warehouse_id: str | None = None`; `None` = platform-wide (admin, used everywhere in this pass), a numeric string = scoped (wired up when the manager dashboard is built later — routes pass `None` explicitly with a `# TODO(manager-dashboard)` comment, not derived from the current user yet).
3. **String formatting**: DB stores real numbers/timestamps; the service/schema layer formats them into the exact display strings the frontend expects (`"120 units"`, `"$13,945"`, `"10 min ago"`). No frontend changes.
4. **Inventory statistics**: backend matches the current contract exactly — `GET /inventory-statistics` takes no query param and returns `{ days: [...], months: [...], years: [...] }` in one response. No frontend service change needed.
5. **Warehouse detail**: build the full real version now. `ProductStock`, `StockMovement`, and `ActivityLog` are needed anyway for `/products/top`, `/activities`, and `/inventory-statistics`, so `GET /warehouses/{id}` becomes a real query against tables that exist regardless — no extra modeling cost. Seed data will be sparser than the mock's PRNG-generated richness; that's expected, not a bug.
6. **Total Suppliers**: add a minimal `Supplier` model (`id`, `name`, `created_at`) so the KPI is a real `COUNT(*)`, not a hardcoded number wearing a backend costume. Seed ~187 rows to match the current mock's displayed value for visual continuity.

## Endpoints in scope (all 13)

`GET /status-cards`, `GET /inventory-statistics`, `GET /warehouses`, `GET /warehouses/{id}`, `POST /warehouses`, `GET /products/top?period=`, `GET /activities`, `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/{id}/read`, `GET /sales/overview`, `PUT /sales/goal`, `GET /search-index`.

All admin-only for this pass via `Depends(require_role("admin"))` (existing dep in `backend/app/deps.py`).

## Files

| File | Action |
|---|---|
| `backend/app/models/warehouse.py` | implement (currently a stub) |
| `backend/app/models/product.py` | new — `Product`, `ProductStock` |
| `backend/app/models/stock_movement.py` | new — `StockMovement` |
| `backend/app/models/activity.py` | new — `ActivityLog` |
| `backend/app/models/notification.py` | new — `Notification` |
| `backend/app/models/sales.py` | new — `SalesRecord`, `SalesGoal` |
| `backend/app/models/supplier.py` | new — `Supplier` |
| `backend/app/schemas/warehouse.py` | implement — `WarehouseOut`, `WarehouseDetailOut`, `WarehouseCreate`, sub-schemas |
| `backend/app/schemas/dashboard.py` | new — `StatusCardOut`, `InventoryDataPointOut`, `ProductOut`, `ActivityEntryOut`, `NotificationOut`, `SalesOverviewOut`, `SalesGoalUpdate`, `SearchIndexOut` |
| `backend/app/services/dashboard_service.py` | implement — all query/aggregation/formatting logic |
| `backend/app/routers/dashboard.py` | implement — thin handlers, `router = APIRouter(prefix="", tags=["dashboard"])` |
| `backend/app/main.py` | edit — `app.include_router(dashboard.router)` |
| `backend/app/seed.py` | edit — seed warehouses/products/stock/movements/activities/notifications/suppliers/sales |
| `backend/tests/conftest.py` | edit — **required**: add new model modules to the `from app.models import ...  # noqa: F401` line, or `Base.metadata.create_all` won't create their tables in the in-memory test DB |
| `backend/alembic/versions/<hash>_create_dashboard_tables.py` | new — one migration, chained after `143e8f9f1bdd` (current head) |
| `backend/tests/test_dashboard.py` | new — smoke tests for all 13 endpoints |

Note: `order.py`, `purchase.py`, `zone.py`, `inventory.py` model/schema stubs are **not** touched — out of scope, belong to other pages.

## Models — key shapes

Follow the existing convention from `backend/app/models/user.py` (typed `Mapped[...]`/`mapped_column`, `Base` from `app.database`).

- **`Warehouse`**: `id: Integer` autoincrement PK (maps directly to frontend `Warehouse.id: number`; `User.warehouse_id` stays the existing `String` column — compare via `str(warehouse.id) == user.warehouse_id`). Columns: `name, image, warehouse_code (unique, "WH-001" format), location, manager, capacity_used, capacity_total, last_inspection (Date), next_inspection (Date, nullable), status (default "Active"), phone, email, address, created_at`.
- **`Product`**: `id, sku (unique), name, image, category, unit_price (Numeric)`.
- **`ProductStock`**: `id, product_id FK, warehouse_id FK, quantity, revenue (Numeric, period revenue for this SKU), low_stock_threshold (default 90), critical_stock_threshold (default 40), updated_at`. Unique constraint on `(product_id, warehouse_id)`. `status` (`Normal|Low|Critical`) is derived from thresholds at read time, not stored.
- **`StockMovement`**: `id, warehouse_id FK, product_id FK, movement_type (Inbound|Outbound|Transfer In|Transfer Out), quantity (unsigned magnitude; sign applied in schema), occurred_at`. Backs `WarehouseDetail.movements`/`.dailyMovement` and `inventory-statistics` stockIn/stockOut aggregation.
- **`ActivityLog`**: `id, warehouse_id FK (nullable = platform-wide), actor_name, actor_role, avatar, description, category (Stock|Inspection|User), occurred_at`. Single table backs both `/activities` (unscoped) and `WarehouseDetail.activities` (filtered).
- **`Notification`**: `id, user_id FK (nullable = broadcast), type (stock|order|alert|user), title, description, unread (bool), created_at`. `time` ("10 min ago") computed relative to `created_at` at read time.
- **`SalesRecord`**: `id, warehouse_id FK (nullable), amount (Numeric), occurred_at`.
- **`SalesGoal`**: `id, warehouse_id FK (nullable, unique — null row = platform-wide goal), target (Numeric)`.
- **`Supplier`**: `id, name, created_at`.

## Schemas — key shapes

Follow the convention from `backend/app/schemas/user.py` (camelCase via `Field(validation_alias="snake_case")`, `ConfigDict(from_attributes=True, populate_by_name=True)`).

- `WarehouseOut`: maps `last_inspection` (Date) → `lastInspection` formatted `"%d-%m-%Y"`; `warehouse_code` → `warehouseId`; `capacity_used`/`capacity_total` → `capacityUsed`/`capacityTotal`.
- `WarehouseCreate`: `name, location, manager, capacityTotal` — matches `CreateWarehouseInput`.
- `WarehouseDetailOut(WarehouseOut)` adds `status, phone, email, address, nextInspection, totalSkus, lowStockCount, pendingInbound, throughput, dailyMovement, movements, products, activities`. These extra fields aren't ORM columns — the service builds a small transient object/namespace with all attributes set before Pydantic validates it (still works with `from_attributes=True`).
- `DailyMovementOut {day, inbound, outbound}`, `StockMovementOut {id, item, type, qty (signed), date}`, `WarehouseProductOut {id, sku, name, category, quantity, status, lastUpdated}`, `WarehouseActivityOut {id, name, role, initials, description, category, date, time}`.
- `dashboard.py` schemas (`StatusCardOut`, `InventoryDataPointOut`, `ProductOut`, `ActivityEntryOut`, `NotificationOut`, `SalesOverviewOut`, `SalesGoalUpdate`, `SearchIndexOut`) are plain `BaseModel`s built from dicts the service returns — no `from_attributes` needed since they're aggregates, not 1:1 table rows.

## Service layer (`dashboard_service.py`)

Shared scope helper:
```python
def _scope_filter(query, model, warehouse_id: str | None):
    if warehouse_id is not None:
        query = query.filter(model.warehouse_id == int(warehouse_id))
    return query
```

- **`get_status_cards(db, warehouse_id=None)`**: `total_stocks` = `SUM(ProductStock.quantity)` scoped; `total_value` = `SUM(quantity * unit_price)` join Product, scoped; `total_suppliers` = `COUNT(Supplier)` (always unscoped — suppliers aren't warehouse-specific); `total_revenue` = `SUM(SalesRecord.amount)` scoped; `low_stock` = `COUNT(ProductStock WHERE quantity < low_stock_threshold)` scoped; `orders_completed` = `COUNT(StockMovement WHERE type='Outbound')` this calendar month, scoped. `changeText`/`changeDirection` computed by comparing current-month vs prior-month aggregate over the same table (real delta, not hardcoded — needs seed data spanning >1 month).
- **`get_inventory_statistics(db, warehouse_id=None)`**: returns `{days: [...], months: [...], years: [...]}` — group `StockMovement` by day (last 30), month (last 12), year (last 7); sum `quantity` per `movement_type` for `stockIn`/`stockOut`; `stockValue` = period-end `SUM(ProductStock.quantity * unit_price)` snapshot (simplification — true historical valuation would need a separate value-history table, not otherwise required). Note: SQLite (tests) vs Postgres (dev/prod) date-grouping functions differ — use `func.strftime` for SQLite-compatible grouping, verified against both via the test suite and manual Postgres check.
- **`list_warehouses(db)`**: `db.query(Warehouse).all()` — admin-only list, no scoping (a scoped caller would use `get_warehouse_detail` for their own warehouse instead).
- **`get_warehouse_detail(db, warehouse_id: int)`**: fetch `Warehouse` (return `None` if missing → router raises 404). Join `ProductStock`+`Product` for `products`/`totalSkus`/`lowStockCount`. Last N `StockMovement` for `movements`. Group last 7 days of `StockMovement` for `dailyMovement` (zero-filled for days with no rows). `ActivityLog` filtered by warehouse for `activities`. `pendingInbound` = count of Inbound movements in the last 7 days (simplification — no separate "pending" state modeled). `throughput` = sum of `dailyMovement` inbound+outbound.
- **`create_warehouse(db, data: WarehouseCreate)`**: allocate next id, `warehouse_code = f"WH-{id:03d}"`, `capacity_used=0`, `last_inspection=today`, `status="Active"`.
- **`get_top_products(db, period, warehouse_id=None)`**: join `Product`+`ProductStock`, scoped, ordered by `revenue desc`, limited (~6); format `quantity` → `f"{qty} units"`, `revenue` → `f"${revenue:,.0f}"`.
- **`list_activities(db, warehouse_id=None)`**: scoped, ordered `occurred_at desc`, limited (~20); format `date` → `"%d %b %Y"`, `time` → 12-hour format (handle Windows/POSIX `%-I` vs `%#I` divergence explicitly, don't rely on platform-specific strftime flags — build the string manually if needed).
- **`list_notifications(db, user)`**: `Notification WHERE user_id = user.id OR user_id IS NULL`, ordered `created_at desc`; relative-time helper (`<1h` → "N min ago", same day → "N hours ago", yesterday → "Yesterday", else → "DD Mon YYYY").
- **`mark_all_notifications_read(db, user)`** / **`mark_notification_read(db, user, id)`**: bulk/single update; 404 if the single-id lookup doesn't match or isn't owned.
- **`get_sales_overview(db, warehouse_id=None)`**: `numberOfSales` = `COUNT(SalesRecord)` scoped, `totalSales` = `SUM(amount)` scoped, `target` = `SalesGoal.target` for that scope (or the `NULL`-warehouse row for admin).
- **`update_sales_goal(db, target, warehouse_id=None)`**: upsert `SalesGoal` row for the scope, return `get_sales_overview`.
- **`get_search_index(db, warehouse_id=None)`**: `{products: get_top_products(db, "months", warehouse_id), warehouses: list_warehouses(db)}` — reuses existing functions, no new queries.

## Router (`backend/app/routers/dashboard.py`)

Thin handlers, each `Depends(require_role("admin"))` + `Depends(get_db)`, calling into the service with `warehouse_id=None`. Example:
```python
router = APIRouter(prefix="", tags=["dashboard"])

@router.get("/status-cards", response_model=list[StatusCardOut])
def status_cards(db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    return dashboard_service.get_status_cards(db)
```
`GET /warehouses/{id}` raises `HTTPException(404)` if the service returns `None` (matches `WarehouseDetail | null` on the frontend — `apiFetch` throws `ApiError` on non-2xx, which `getWarehouseDetail`'s caller already needs to handle; verify this doesn't need a frontend try/catch addition during manual testing). `POST /warehouses` uses `response_model=WarehouseOut, status_code=201`.

## Migration

One new file in `backend/alembic/versions/`, `down_revision = '143e8f9f1bdd'`. `op.create_table` in dependency order: `warehouses` → `products` → `product_stocks` (FKs + unique constraint) → `stock_movements` → `activity_logs` → `notifications` → `sales_records` → `sales_goals` → `suppliers`. Indexes on `product_stocks.warehouse_id`, `stock_movements.warehouse_id`, `stock_movements.occurred_at`, `activity_logs.warehouse_id`, `notifications.user_id`, `sales_records.warehouse_id`. `downgrade()` drops in reverse order.

Generate via `uv run alembic revision --autogenerate -m "create dashboard tables"` after models are written, then hand-verify the autogenerated file against this table list (autogenerate sometimes misses named constraints).

## Seed data (`backend/app/seed.py`)

Extend the existing idempotent-loop pattern (mirrors `DEV_USERS`): seed 10 warehouses (ids aligned so warehouse id=1 matches the existing seeded manager's `warehouse_id: "1"`), 8 products (matching the mock's `productPool`), cross product×warehouse `ProductStock` rows, ~5-10 `StockMovement` rows per warehouse spread over the last 30 days (needed for inventory-statistics + movements + dailyMovement + month-over-month status-card deltas), 8+ `ActivityLog` rows (mix of platform-wide and per-warehouse), 5 `Notification` rows, ~187 `Supplier` rows (matches the mock's displayed count), `SalesRecord` rows spread over multiple months, one `SalesGoal` row (`warehouse_id=None, target=21365`, matching the mock default).

## Tests (`backend/tests/test_dashboard.py`)

Follow `test_auth.py`/`conftest.py` conventions (in-memory SQLite, `client`/`db_session` fixtures, integration-through-router style, no service unit tests). A `_login_admin` helper creates a user + logs in to get the auth cookie (all endpoints are `require_role("admin")`-gated). Cover:
- Smoke test per GET endpoint (seed minimal rows, assert `200` + key shape fields).
- `test_get_warehouse_detail_not_found` → 404.
- `test_create_warehouse` → 201, `warehouseId` format `WH-0NN`.
- `test_mark_notification_read` / `test_mark_all_notifications_read` → `unread` flips.
- `test_update_sales_goal` → PUT then GET `/sales/overview` reflects the new target.
- `test_dashboard_endpoints_require_admin` → 401 unauthenticated, 403 as staff/manager.

**Critical**: `backend/tests/conftest.py` line 9's model-import list must be extended to include every new model module, or their tables silently don't exist in the test DB and every test fails with "no such table".

## Verification

1. `cd backend && uv run alembic upgrade head` — migration applies cleanly on top of the existing 2 migrations.
2. `uv run python -m app.seed` — idempotent, runs twice with no errors/duplicates.
3. `uv run pytest` — all new + existing tests green.
4. `uv run uvicorn app.main:app --reload` — manually hit each of the 13 endpoints (login as `admin@example.com`/`password123` first for the cookie), spot-check JSON shape against the TS interfaces, especially formatted strings (`"120 units"`, `"$13,945"`, relative notification times).
5. Frontend: set `NEXT_PUBLIC_USE_MOCK_API=false`, `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`, `npm run dev`, log in as admin, load `/dashboard`. Confirm: status cards show real numbers, inventory chart renders per period toggle, warehouse table + detail page load, top products render formatted strings, activity feed renders, notification bell unread count + mark-read/mark-all-read work, sales overview + goal edit persist, header search returns real matches. Watch browser console/network tab for 401/404/500s — React silently renders `undefined` on shape mismatches rather than crashing, so also visually diff against mock-mode output.
6. Confirm cross-origin cookie auth (`credentials: "include"`) carries over to `dashboard.router` the same way it already works for `auth.router` (same `require_role`/`get_current_user` deps, so should be automatic).
