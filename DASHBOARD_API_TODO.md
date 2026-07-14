# Dashboard API — remaining endpoints

Working checklist. Seven endpoints left; the models, migration, and seed already
exist, so every one of these is "query what's there and reshape it."

## Ground rules (same for every endpoint)

- **Query logic goes in `backend/app/dashboard/service.py`**, the route in
  `router.py`. Keep them separate — that's the convention the codebase follows.
- **Import the model at the top of `service.py` before you use it.** A missing
  import doesn't fail at import time, only when the function actually runs.
- **Every route needs `db: Session = Depends(get_db)`** and an auth guard
  `current_user: User = Depends(require_role(...))`.
- **`response_model=List[Foo]`** when returning a list, `response_model=Foo` for
  a single object. Getting this wrong is a 500.
- **Writes need `db.commit()`** — and put it *outside* the if/else so it runs on
  every path.
- **`func.sum()` returns `None` on zero rows**, so wrap it:
  `func.coalesce(func.sum(...), 0)`. `func.count()` doesn't have this problem.
- The wire format is **camelCase** (`capacityUsed`), the DB is **snake_case**
  (`capacity_total`). The mapping is your job.

## Helpers already written for you (in `service.py`)

| Helper | Returns |
|---|---|
| `on_hand_by_warehouse(db)` | `{warehouse_id: qty}` — this is `capacityUsed` |
| `on_hand_by_product(db, warehouse_id=None)` | `{product_id: qty}` |
| `low_stock_product_ids(db, warehouse_id=None)` | `[product_id, ...]` |
| `stock_value(db, warehouse_id=None)` | `Decimal` |
| `_money(v)` | `"$41,111"` |
| `_fmt_date(d)` | `"13-07-2026"`, handles `None` |

Source of truth for every shape: `src/types/dashboard.ts` and
`src/services/dashboard-service.ts`.

---

## Done

- [x] `GET /sales/overview`
- [x] `PUT /sales/goal`
- [x] `GET /activities`

---

## 1. `GET /warehouses` → `List[WarehouseOut]`

Do this next — it unlocks `/search-index` for free.

`WarehouseOut` already exists in `schemas.py`. Most fields map straight off the
`Warehouse` model. The two that don't:

- **`capacityUsed` is not a column.** Call `on_hand_by_warehouse(db)` **once**
  before the loop (not inside it — that would be one query per row), then
  `used.get(w.id, 0)`. Use `.get` with a default: a warehouse with no movements
  won't be a key in that dict at all, and `used[w.id]` raises `KeyError`.
- **`warehouseId` is the `code` column** (`"WH-001"`), not `id`. Confusing, but
  that's the frontend's contract — `id` is the int, `warehouseId` is the string.

`lastInspection` is a nullable `Date` → use `_fmt_date()`.

Role: admin/manager/staff.

## 2. `POST /warehouses` → `WarehouseOut`

Input shape (`CreateWarehouseInput` in the TS types) — write a `WarehouseIn`
schema:

```
name: str, location: str, manager: str, capacityTotal: int, image: str | None
```

**The wrinkle:** `code` is `f"WH-{id:03d}"`, but the id doesn't exist until the
row hits the database. So:

1. `db.add(warehouse)` with everything except `code`
2. `db.flush()` — assigns the id without committing
3. now set `warehouse.code = f"WH-{warehouse.id:03d}"`
4. `db.commit()`

A new warehouse has no movements, so `capacityUsed` is `0`.

Role: **admin only**. Optionally call `log_event(db, ...)` from
`app/activity/service.py` so the creation shows up in the activity feed — it
deliberately does not commit, so it joins your transaction.

## 3. `PUT /warehouses/{id}/profile`

Input (`UpdateWarehouseProfileInput`): `manager`, `address`, `phone`, `email`,
`nextInspection`, optional `image`. Returns the same shape back.

Same write pattern as `/sales/goal`. Two things:

- **`address` maps to the `location` column** — there is no `address` column.
- `nextInspection` arrives as a **string**, but the column is a `Date`. Parse it:
  `datetime.strptime(value, "%d-%m-%Y").date()`.
- 404 if the warehouse doesn't exist — `_get_warehouse_or_404(db, id)` is already
  in `router.py`.

Role: admin/manager.

## 4. `GET /staff/stats` → `List[StaffStat]`

Four cards for the staff dashboard:
`{id, title, value: int, description, color: "blue"|"green"|"amber"|"red"}`

Scoped to **the current user's warehouse** — `current_user.warehouse_id`. Note
that column is a **string** on the User model (`"1"`, or `"all"` for admins), so
it needs `int()`, and `"all"` needs handling.

You pick the four stats. Reasonable set, all available from existing helpers:
total SKUs on hand, low-stock count (`low_stock_product_ids(db, wid)`), pending
inbound, today's movements. Colors are yours to choose — amber/red for the
low-stock one is the obvious call.

Role: admin/manager/staff.

## 5. `GET /search-index` → `{products, warehouses}`

Trivial once #1 exists — powers the header search box:

```python
return {
    "products": get_top_products(db, limit=50),   # or all products
    "warehouses": get_warehouses(db),
}
```

Just reuse the two functions. Role: admin/manager/staff.

---

## 6-8. Notifications — save these for last

The only genuinely fiddly part of the batch, because read-state is **per user**.

### `GET /notifications` → `List[NotificationItem]`

Shape: `{id, type, title, description, time, unread}`

- Rows come from `ActivityEvent` **where `is_alert == True`**.
- `type` is the event's `kind` (`stock|order|alert|user`).
- **`unread` is not a column.** It's `True` when there is *no* `NotificationRead`
  row for `(event_id, current_user.id)`. Two users must be able to read the same
  alert independently — that's why it's a separate table and not a bool on the
  event.
  - Simplest approach: fetch the current user's read event-ids into a `set()`,
    then `unread = event.id not in read_ids`. A LEFT JOIN also works; the set is
    easier to get right.
- **`time` is relative** — `"10 min ago"`, `"2 hours ago"`. Compute from
  `datetime.now(timezone.utc) - event.occurred_at`. Watch out: `occurred_at`
  from SQLite may come back **timezone-naive**, and subtracting a naive datetime
  from an aware one raises `TypeError`. If it bites, that's why.

### `POST /notifications/{id}/read` → 204

Insert a `NotificationRead(event_id=id, user_id=current_user.id)`. **Must be
idempotent** — there's a unique constraint on `(event_id, user_id)`, so marking
the same one twice raises `IntegrityError`. Check whether the row exists first.

Use `status_code=204` on the decorator and return `None` — see the approve/reject
routes in `app/zones/router.py` for the pattern.

### `POST /notifications/read-all` → 204

Same, for every alert event the user hasn't read yet. Fetch the unread ids, bulk
insert, one commit.

---

## How to run and test

```
set DATABASE_URL=sqlite:///./dev.db     # PowerShell: $env:DATABASE_URL="sqlite:///./dev.db"
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

Then `http://localhost:8000/docs` → **log in first** via `POST /auth/login`
(`admin@grandroyal.com` / `password123`), or every guarded endpoint returns 401.
The browser holds the cookie from there.

**Test writes with a separate GET.** A PUT/POST response can look correct even
when the write never committed, because it reads back from the same open
session. Only a fresh request proves it persisted.

## When all seven are done

Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local` and load `/dashboard`. Every
widget should render real data with **no frontend code changed** — the service
layer in `src/services/dashboard-service.ts` already has the `apiFetch` branches
wired for all of these.
