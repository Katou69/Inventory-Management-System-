# Database ERD

**Status: built and live.** Migration `c3d1a7b45e90` is applied to Supabase Postgres; SQLAlchemy models match. 22 app tables (plus `alembic_version`, and 3 pre-existing tables this project doesn't own — see below).

Everything the backend had plus everything the frontend needs, with the frontend/backend conflicts resolved (choices at the bottom).

```mermaid
erDiagram
    users ||--o{ refresh_sessions : ""
    users ||--o{ activity_events : "actor_id"
    users ||--o{ notification_reads : "user_id"
    users ||--o{ user_settings : ""
    users ||--o{ movement_tasks : "requested_by"
    users ||--o{ layout_requests : "requested_by / reviewed_by"
    activity_events ||--o{ notification_reads : "event_id"

    warehouses ||--o{ users : "warehouse_id (NULL = all)"
    warehouses ||--o{ zone_sections : ""
    warehouses ||--o{ stock_movements : ""
    warehouses ||--o{ orders : ""
    warehouses ||--o{ purchase_orders : ""
    warehouses ||--o{ movement_tasks : ""
    warehouses ||--o{ layout_requests : ""

    categories ||--o{ products : "category_id"
    suppliers ||--o{ products : "supplier_id"
    suppliers ||--o{ purchase_orders : "supplier_id"

    products ||--o{ stock_movements : ""
    products ||--o{ zone_stock_entries : ""
    products ||--o{ order_items : ""
    products ||--o{ purchase_order_items : ""
    products ||--o{ movement_tasks : ""

    zone_sections ||--o{ zone_stock_entries : ""
    zone_sections ||--o{ stock_movements : "section_id (nullable)"
    zone_sections ||--o{ order_picks : ""
    zone_sections ||--o{ purchase_placements : ""
    zone_sections ||--o{ movement_tasks : "from_/to_section_id"

    orders ||--o{ order_items : ""
    order_items ||--o{ order_picks : ""
    purchase_orders ||--o{ purchase_order_items : ""
    purchase_order_items ||--o{ purchase_placements : ""
    layout_requests ||--o{ layout_request_items : ""

    users {
        string id PK "uuid"
        string name
        string email UK
        string hashed_password
        string role "admin|manager|staff"
        int warehouse_id FK "NULL = all warehouses"
        string status "pending|active|inactive"
        date joined_date
        int login_attempts
        datetime lockout_until NULL
        datetime created_at
    }
    refresh_sessions {
        string id PK "uuid"
        string user_id FK
        string token_hash UK
        datetime expires_at
        bool revoked
        datetime created_at
    }
    user_settings {
        string user_id PK-FK
        bool notify_low_stock
        bool notify_order_update
        bool notify_po_approval
        string language
        string timezone
    }
    warehouses {
        int id PK
        string name
        string code UK "WH-001"
        string location
        int manager_id FK "users.id, NULL"
        string image
        int capacity_total
        string status "active|maintenance|closed"
        date last_inspection NULL
        date next_inspection NULL
        string phone
        string email
    }
    categories {
        int id PK
        string name UK
    }
    suppliers {
        int id PK
        string name
        string contact_email NULL
    }
    products {
        int id PK
        string sku UK
        string name
        int category_id FK
        int supplier_id FK NULL
        string image
        numeric unit_price
        numeric unit_cost
        int reorder_level "= frontend minStock"
        int primary_warehouse_id FK NULL
    }
    stock_movements {
        int id PK
        int product_id FK
        int warehouse_id FK
        int section_id FK "NULL = warehouse-level only"
        string kind "inbound|outbound|transfer_in|transfer_out|adjustment"
        int quantity "SIGNED: + in, - out"
        datetime occurred_at
        string note NULL
    }
    zone_sections {
        int id PK
        int warehouse_id FK
        string kind "shelf|zone"
        string code
        string name
        float x
        float y
        float width
        float height
        int capacity "shelves only"
    }
    zone_stock_entries {
        int id PK
        int section_id FK
        int product_id FK
        int quantity
    }
    orders {
        int id PK
        string order_no UK "ORD-0001"
        string customer_name
        int warehouse_id FK NULL
        string status "pending|picking|completed|cancelled"
        numeric total
        datetime placed_at
    }
    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    order_picks {
        int id PK
        int item_id FK
        int section_id FK "shelf picked from"
        int quantity
    }
    purchase_orders {
        int id PK
        string po_no UK "PO-2001"
        int supplier_id FK
        int warehouse_id FK
        string status "pending|receiving|completed|cancelled"
        numeric total
        date placed_at
    }
    purchase_order_items {
        int id PK
        int purchase_id FK
        int product_id FK
        int quantity
    }
    purchase_placements {
        int id PK
        int item_id FK
        int section_id FK "shelf placed on"
        int quantity
    }
    movement_tasks {
        int id PK
        int product_id FK
        int warehouse_id FK
        int from_section_id FK
        int to_section_id FK
        int quantity
        string requested_by FK "users.id"
        string reason
        string status "pending|completed"
    }
    layout_requests {
        int id PK
        int warehouse_id FK
        string requested_by FK "users.id"
        string request_note NULL
        string status "pending|approved|rejected"
        string reviewed_by FK "users.id, NULL"
        datetime reviewed_at NULL
        string review_note NULL
        datetime created_at
    }
    layout_request_items {
        int id PK
        int request_id FK
        string action_type "create|update|delete"
        int section_id FK "NULL when action=create"
        json proposed_data NULL
        json previous_data NULL
    }
    activity_events {
        int id PK
        string actor_id FK NULL
        string actor_name "denormalized"
        string actor_role "denormalized"
        string kind "stock|order|alert|user"
        string title
        string description
        datetime occurred_at
        bool is_alert
    }
    notification_reads {
        int id PK
        int event_id FK
        string user_id FK
        datetime read_at
    }
    app_settings {
        string key PK
        string value
    }
```

## Constraints

- `UNIQUE (section_id, product_id)` on `zone_stock_entries`
- `UNIQUE (event_id, user_id)` on `notification_reads`
- `CHECK (quantity > 0)` on `order_picks`, `purchase_placements`, `purchase_order_items`, `order_items`, `movement_tasks`
- Shelf capacity is enforced in app code, not the DB — the check spans rows (`SUM(zone_stock_entries.quantity) <= zone_sections.capacity`)

## Never stored — always derived

| Value | Derivation |
|---|---|
| Product on-hand | `SUM(stock_movements.quantity)` for the product |
| Warehouse `capacity_used` | `SUM(stock_movements.quantity)` for the warehouse |
| Shelf occupancy | `SUM(stock_movements.quantity) WHERE section_id = X` |
| `InventoryItem.status` | `in-stock` / `low-stock` / `out-of-stock` from on-hand vs `reorder_level` |
| Zone occupancy color | shelf stock vs `zone_sections.capacity` |

`AuditMixin` (`created_at`, `created_by`→users, `updated_at`, `updated_by`→users) on every table except `users`, `refresh_sessions`, `user_settings`. No soft delete — deletions are recorded in `activity_events`.

## Decisions baked in

1. **One stock ledger.** `stock_movements` gains a nullable `section_id`. Shelf stock is a `WHERE` clause on the same ledger, so shelf and warehouse totals cannot drift apart. `zone_stock_entries` stays only as a read cache — drop it if the aggregate is fast enough.
2. **Order status is the frontend's** (`pending|picking|completed|cancelled`). `picking` is load-bearing; backend's `fulfilled` is never produced by the UI.
3. **`users.warehouse_id` is a real FK**, nullable, where `NULL` means "all" — replaces the `"3"`-or-`"all"` string.
4. **Shelf stock keys on `product_id`**, not product name. Kills the string-matching in `getShelfStockForProduct` / `addInventory` / `deductInventory`, and makes the frontend's `ProductShelfStock` type redundant.
5. **`categories` is a table** — the Settings page edits it as a list.
6. **`user_settings`** for the notification toggles / language / timezone that Settings currently drops on refresh. `app_settings` stays key/value for app-wide knobs (`sales_target`).
7. **`requested_by` / `reviewed_by` are user FKs**, not free strings. `warehouses.manager_id` was *added alongside* the existing `manager` display-name column rather than replacing it — the API and UI already read `manager`, and a manager is often recorded before they have a user account.

## Migration notes (`c3d1a7b45e90`)

Applied against live data. What it did to rows that existed:

- **2 users pointed at warehouses 7 and 9, which don't exist.** A real FK rejects them, so they were set to `NULL` (= "all") rather than deleted. All 17 users survived. Post-migration: 11 on warehouse 1, 6 NULL (4 genuine admins + these 2).
- **`zone_stock_entries` held 2 rows keyed by name** (`'Widget A'`, `'Widget B'`) with an **empty `products` table** — nothing to map them onto, so they were deleted. Shelf stock rebuilds from `stock_movements`.
- **`orders.status`: `fulfilled` → `completed`.** The dashboard's revenue and sales-count KPIs filtered on `'fulfilled'` and were updated too — missing them would have silently zeroed the dashboard.
- Pre-migration backup of all 14 tables is in the **`backup_pre_c3d1a7b45e90` schema**. Drop it once you're satisfied.

**Not touched:** `profiles`, `login_security`, `users_backup_2026_07_12` live in the same Postgres database but are not in the models, not in any migration, and appear to be a half-finished Supabase-Auth migration. Left strictly alone. Worth deciding whether to remove.

**Test suite: 22 passed, 0 failed.** The 7 auth tests that failed on `main` were stale, not broken code: `login` and `register` enforce an `@grandroyal.com` domain ([app/auth/router.py](app/auth/router.py)), and the tests used `@example.com`. Login returns a deliberately vague `401 "Invalid email or password"` for a rejected domain, which is why it looked like a password failure. Test emails updated, and the domain rule now has direct coverage (it had none). One further stale test asserted that registering issues a session — it doesn't: new users are `pending` until an admin approves them.
