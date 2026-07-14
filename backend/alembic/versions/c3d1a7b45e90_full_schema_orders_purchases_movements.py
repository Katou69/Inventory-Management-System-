"""Full schema: categories, order/purchase lines, shelf-level ledger, movement tasks

Brings the DB up to what the frontend actually needs:
  - categories table (Settings edits the category list)
  - products.category (string) -> category_id FK
  - users.warehouse_id (string, "all" sentinel) -> nullable int FK (NULL = all)
  - warehouses.manager_id FK alongside the existing display-name column
  - stock_movements.section_id -> shelf-level ledger, so shelf and warehouse
    totals derive from ONE table and cannot drift
  - zone_stock_entries.item_name (string) -> product_id FK
  - order_items / order_picks, purchase_orders / items / placements
  - movement_tasks (shelf-to-shelf transfer requests)
  - user_settings (notification toggles, language, timezone)
  - orders.status: 'fulfilled' -> 'completed' (frontend also has 'picking')
  - layout_requests.requested_by/reviewed_by -> real user FKs

Data notes (checked against the live DB before writing this):
  - 2 users referenced warehouses 7 and 9, which do not exist. A real FK rejects
    them, so they are set to NULL ("all") rather than dropped.
  - zone_stock_entries held 2 rows keyed by item_name ('Widget A'/'Widget B')
    with an EMPTY products table — there is nothing to map them to, so they are
    deleted. Shelf stock is rebuilt from stock_movements going forward.

Revision ID: c3d1a7b45e90
Revises: a1f4c7d92b30
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "c3d1a7b45e90"
down_revision: Union[str, Sequence[str], None] = "a1f4c7d92b30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- categories -------------------------------------------------------
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
    )

    # products.category (string) -> category_id FK.
    # Backfill any distinct category strings that exist before dropping the column.
    op.execute(
        "INSERT INTO categories (name, created_at) "
        "SELECT DISTINCT category, now() FROM products "
        "WHERE category IS NOT NULL AND category <> '' "
        "ON CONFLICT (name) DO NOTHING"
    )
    op.add_column("products", sa.Column("category_id", sa.Integer(), nullable=True))
    op.execute("UPDATE products p SET category_id = c.id FROM categories c WHERE c.name = p.category")
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_foreign_key("fk_products_category", "products", "categories", ["category_id"], ["id"])
    op.drop_column("products", "category")

    # --- users.warehouse_id: string ("3" | "all") -> nullable int FK -------
    # NULL now means "all warehouses". Rows pointing at warehouses that do not
    # exist (7, 9 in the live DB) become NULL rather than blocking the FK.
    # Order matters: NOT NULL has to go before the values can be nulled, and
    # Postgres forbids a subquery inside ALTER ... USING, so the dangling refs
    # ('all', plus ids with no matching warehouse) are blanked in their own step.
    op.execute("ALTER TABLE users ALTER COLUMN warehouse_id DROP NOT NULL")
    op.execute("UPDATE users SET warehouse_id = NULL WHERE warehouse_id !~ '^[0-9]+$'")
    op.execute(
        "UPDATE users SET warehouse_id = NULL "
        "WHERE warehouse_id IS NOT NULL "
        "AND NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id = warehouse_id::integer)"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN warehouse_id TYPE integer USING warehouse_id::integer"
    )
    op.create_index("ix_users_warehouse_id", "users", ["warehouse_id"])
    op.create_foreign_key("fk_users_warehouse", "users", "warehouses", ["warehouse_id"], ["id"])

    # --- user_settings ----------------------------------------------------
    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("notify_low_stock", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notify_order_update", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notify_po_approval", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("language", sa.String(), nullable=False, server_default="English"),
        sa.Column("timezone", sa.String(), nullable=False, server_default="UTC"),
    )

    # --- warehouses.manager_id (alongside the display-name column) ---------
    op.add_column("warehouses", sa.Column("manager_id", sa.String(), nullable=True))
    op.create_index("ix_warehouses_manager_id", "warehouses", ["manager_id"])
    op.create_foreign_key("fk_warehouses_manager", "warehouses", "users", ["manager_id"], ["id"])

    # --- stock_movements.section_id: shelf-level ledger --------------------
    op.add_column("stock_movements", sa.Column("section_id", sa.Integer(), nullable=True))
    op.create_index("ix_stock_movements_section_id", "stock_movements", ["section_id"])
    op.create_foreign_key(
        "fk_stock_movements_section", "stock_movements", "zone_sections", ["section_id"], ["id"]
    )

    # --- zone_stock_entries.item_name -> product_id ------------------------
    # No products exist to map the 2 legacy 'Widget A'/'Widget B' rows onto;
    # shelf stock is rebuilt from stock_movements from here on.
    op.execute("DELETE FROM zone_stock_entries")
    op.drop_column("zone_stock_entries", "item_name")
    op.add_column("zone_stock_entries", sa.Column("product_id", sa.Integer(), nullable=False))
    op.create_index("ix_zone_stock_entries_product_id", "zone_stock_entries", ["product_id"])
    op.create_foreign_key(
        "fk_zone_stock_product", "zone_stock_entries", "products", ["product_id"], ["id"]
    )
    op.create_unique_constraint(
        "uq_zone_stock_section_product", "zone_stock_entries", ["section_id", "product_id"]
    )

    # --- orders: status enum + line items ----------------------------------
    op.execute("UPDATE orders SET status = 'completed' WHERE status = 'fulfilled'")

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False, index=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.CheckConstraint("quantity > 0", name="ck_order_items_qty_positive"),
    )
    op.create_table(
        "order_picks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("order_items.id"), nullable=False, index=True),
        sa.Column("section_id", sa.Integer(), sa.ForeignKey("zone_sections.id"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.CheckConstraint("quantity > 0", name="ck_order_picks_qty_positive"),
    )

    # --- purchases ---------------------------------------------------------
    op.create_table(
        "purchase_orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("po_no", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=True, index=True),
        sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=True, index=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending", index=True),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("placed_at", sa.Date(), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_table(
        "purchase_order_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "purchase_id", sa.Integer(), sa.ForeignKey("purchase_orders.id"), nullable=False, index=True
        ),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.CheckConstraint("quantity > 0", name="ck_po_items_qty_positive"),
    )
    op.create_table(
        "purchase_placements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "item_id", sa.Integer(), sa.ForeignKey("purchase_order_items.id"), nullable=False, index=True
        ),
        sa.Column("section_id", sa.Integer(), sa.ForeignKey("zone_sections.id"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.CheckConstraint("quantity > 0", name="ck_po_placements_qty_positive"),
    )

    # --- movement_tasks ----------------------------------------------------
    op.create_table(
        "movement_tasks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False, index=True),
        sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False, index=True),
        sa.Column("from_section_id", sa.Integer(), sa.ForeignKey("zone_sections.id"), nullable=False),
        sa.Column("to_section_id", sa.Integer(), sa.ForeignKey("zone_sections.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("requested_by", sa.String(), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("reason", sa.String(), nullable=False, server_default=""),
        sa.Column("status", sa.String(), nullable=False, server_default="pending", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.CheckConstraint("quantity > 0", name="ck_movement_tasks_qty_positive"),
    )

    # --- layout_requests actor FKs ----------------------------------------
    # Existing rows hold free-text names / emails, not user ids; null them so the
    # FK holds. NOT NULL must be dropped before the values can be nulled.
    op.alter_column("layout_requests", "requested_by", existing_type=sa.String(), nullable=True)
    op.execute(
        "UPDATE layout_requests SET requested_by = NULL "
        "WHERE requested_by IS NOT NULL "
        "AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = layout_requests.requested_by)"
    )
    op.execute(
        "UPDATE layout_requests SET reviewed_by = NULL "
        "WHERE reviewed_by IS NOT NULL "
        "AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = layout_requests.reviewed_by)"
    )
    op.create_index("ix_layout_requests_requested_by", "layout_requests", ["requested_by"])
    op.create_foreign_key(
        "fk_layout_requests_requested_by", "layout_requests", "users", ["requested_by"], ["id"]
    )
    op.create_foreign_key(
        "fk_layout_requests_reviewed_by", "layout_requests", "users", ["reviewed_by"], ["id"]
    )


def downgrade() -> None:
    op.drop_constraint("fk_layout_requests_reviewed_by", "layout_requests", type_="foreignkey")
    op.drop_constraint("fk_layout_requests_requested_by", "layout_requests", type_="foreignkey")
    op.drop_index("ix_layout_requests_requested_by", table_name="layout_requests")

    op.drop_table("movement_tasks")
    op.drop_table("purchase_placements")
    op.drop_table("purchase_order_items")
    op.drop_table("purchase_orders")
    op.drop_table("order_picks")
    op.drop_table("order_items")

    op.execute("UPDATE orders SET status = 'fulfilled' WHERE status IN ('completed', 'picking')")

    op.drop_constraint("uq_zone_stock_section_product", "zone_stock_entries", type_="unique")
    op.drop_constraint("fk_zone_stock_product", "zone_stock_entries", type_="foreignkey")
    op.drop_index("ix_zone_stock_entries_product_id", table_name="zone_stock_entries")
    op.drop_column("zone_stock_entries", "product_id")
    op.add_column("zone_stock_entries", sa.Column("item_name", sa.String(), nullable=False, server_default=""))

    op.drop_constraint("fk_stock_movements_section", "stock_movements", type_="foreignkey")
    op.drop_index("ix_stock_movements_section_id", table_name="stock_movements")
    op.drop_column("stock_movements", "section_id")

    op.drop_constraint("fk_warehouses_manager", "warehouses", type_="foreignkey")
    op.drop_index("ix_warehouses_manager_id", table_name="warehouses")
    op.drop_column("warehouses", "manager_id")

    op.drop_table("user_settings")

    op.drop_constraint("fk_users_warehouse", "users", type_="foreignkey")
    op.drop_index("ix_users_warehouse_id", table_name="users")
    op.execute(
        "ALTER TABLE users ALTER COLUMN warehouse_id TYPE varchar "
        "USING COALESCE(warehouse_id::varchar, 'all')"
    )
    op.execute("UPDATE users SET warehouse_id = 'all' WHERE warehouse_id IS NULL")
    op.alter_column("users", "warehouse_id", existing_type=sa.String(), nullable=False)

    op.add_column("products", sa.Column("category", sa.String(), nullable=True))
    op.execute("UPDATE products p SET category = c.name FROM categories c WHERE c.id = p.category_id")
    op.execute("UPDATE products SET category = '' WHERE category IS NULL")
    op.alter_column("products", "category", existing_type=sa.String(), nullable=False)
    op.drop_constraint("fk_products_category", "products", type_="foreignkey")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_column("products", "category_id")

    op.drop_table("categories")
