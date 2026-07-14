"""dashboard inventory tables: products, movements, orders, activity, settings

Also extends warehouses with the columns the dashboard renders.

Revision ID: a1f4c7d92b30
Revises: 8c762212de67
Create Date: 2026-07-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f4c7d92b30'
down_revision: Union[str, Sequence[str], None] = '8c762212de67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _audit_columns() -> list[sa.Column]:
    return [
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id']),
    ]


def upgrade() -> None:
    """Upgrade schema."""
    # --- warehouses: add the columns the dashboard table renders -----------
    # Existing rows are already seeded, so NOT NULL columns need a server_default.
    op.add_column('warehouses', sa.Column('code', sa.String(), nullable=True))
    # Backfill in Python — LPAD is Postgres-only and tests run on SQLite.
    conn = op.get_bind()
    for (wid,) in conn.execute(sa.text("SELECT id FROM warehouses WHERE code IS NULL")).fetchall():
        conn.execute(
            sa.text("UPDATE warehouses SET code = :code WHERE id = :id"),
            {"code": f"WH-{wid:03d}", "id": wid},
        )
    # batch_alter_table: SQLite cannot ALTER COLUMN, so alembic rebuilds the
    # table there and emits a plain ALTER on Postgres.
    with op.batch_alter_table('warehouses') as batch:
        batch.alter_column('code', nullable=False)
    op.create_index(op.f('ix_warehouses_code'), 'warehouses', ['code'], unique=True)

    op.add_column('warehouses', sa.Column('location', sa.String(), nullable=False, server_default=''))
    op.add_column('warehouses', sa.Column('manager', sa.String(), nullable=False, server_default=''))
    op.add_column('warehouses', sa.Column('image', sa.String(), nullable=False,
                                          server_default='/images/ellipse-2.png'))
    op.add_column('warehouses', sa.Column('capacity_total', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('warehouses', sa.Column('status', sa.String(), nullable=False, server_default='active'))
    op.add_column('warehouses', sa.Column('last_inspection', sa.Date(), nullable=True))
    op.add_column('warehouses', sa.Column('next_inspection', sa.Date(), nullable=True))
    op.add_column('warehouses', sa.Column('phone', sa.String(), nullable=False, server_default=''))
    op.add_column('warehouses', sa.Column('email', sa.String(), nullable=False, server_default=''))
    # A literal, not CURRENT_TIMESTAMP: SQLite rejects non-constant defaults in
    # ADD COLUMN. New rows get created_at from the model's Python default.
    op.add_column('warehouses', sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                                          server_default=sa.text("'1970-01-01 00:00:00+00'")))
    op.add_column('warehouses', sa.Column('created_by', sa.String(), nullable=True))
    op.add_column('warehouses', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('warehouses', sa.Column('updated_by', sa.String(), nullable=True))
    with op.batch_alter_table('warehouses') as batch:
        batch.create_foreign_key('fk_warehouses_created_by', 'users', ['created_by'], ['id'])
        batch.create_foreign_key('fk_warehouses_updated_by', 'users', ['updated_by'], ['id'])

    # --- suppliers ---------------------------------------------------------
    op.create_table(
        'suppliers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('contact_email', sa.String(), nullable=True),
        *_audit_columns(),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- products ----------------------------------------------------------
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('sku', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('image', sa.String(), nullable=False, server_default='/images/ellipse-2.png'),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('unit_cost', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('reorder_level', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('supplier_id', sa.Integer(), nullable=True),
        *_audit_columns(),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)
    op.create_index(op.f('ix_products_supplier_id'), 'products', ['supplier_id'], unique=False)

    # --- stock_movements: the ledger ---------------------------------------
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),  # signed
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        *_audit_columns(),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_stock_movements_product_id'), 'stock_movements', ['product_id'], unique=False)
    op.create_index(op.f('ix_stock_movements_warehouse_id'), 'stock_movements', ['warehouse_id'], unique=False)
    op.create_index(op.f('ix_stock_movements_occurred_at'), 'stock_movements', ['occurred_at'], unique=False)

    # --- orders ------------------------------------------------------------
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_no', sa.String(), nullable=False),
        sa.Column('customer_name', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('total', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('placed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=True),
        *_audit_columns(),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_orders_order_no'), 'orders', ['order_no'], unique=True)
    op.create_index(op.f('ix_orders_placed_at'), 'orders', ['placed_at'], unique=False)
    op.create_index(op.f('ix_orders_warehouse_id'), 'orders', ['warehouse_id'], unique=False)

    # --- activity_events: feed + notifications -----------------------------
    op.create_table(
        'activity_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('actor_id', sa.String(), nullable=True),
        sa.Column('actor_name', sa.String(), nullable=False, server_default='System'),
        sa.Column('actor_role', sa.String(), nullable=False, server_default='system'),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False, server_default=''),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_alert', sa.Boolean(), nullable=False, server_default=sa.false()),
        *_audit_columns(),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activity_events_actor_id'), 'activity_events', ['actor_id'], unique=False)
    op.create_index(op.f('ix_activity_events_occurred_at'), 'activity_events', ['occurred_at'], unique=False)

    op.create_table(
        'notification_reads',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=False),
        *_audit_columns(),
        sa.ForeignKeyConstraint(['event_id'], ['activity_events.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_notification_read'),
    )
    op.create_index(op.f('ix_notification_reads_event_id'), 'notification_reads', ['event_id'], unique=False)
    op.create_index(op.f('ix_notification_reads_user_id'), 'notification_reads', ['user_id'], unique=False)

    # --- app_settings ------------------------------------------------------
    op.create_table(
        'app_settings',
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.String(), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint('key'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('app_settings')
    op.drop_index(op.f('ix_notification_reads_user_id'), table_name='notification_reads')
    op.drop_index(op.f('ix_notification_reads_event_id'), table_name='notification_reads')
    op.drop_table('notification_reads')
    op.drop_index(op.f('ix_activity_events_occurred_at'), table_name='activity_events')
    op.drop_index(op.f('ix_activity_events_actor_id'), table_name='activity_events')
    op.drop_table('activity_events')
    op.drop_index(op.f('ix_orders_warehouse_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_placed_at'), table_name='orders')
    op.drop_index(op.f('ix_orders_order_no'), table_name='orders')
    op.drop_table('orders')
    op.drop_index(op.f('ix_stock_movements_occurred_at'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_warehouse_id'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_product_id'), table_name='stock_movements')
    op.drop_table('stock_movements')
    op.drop_index(op.f('ix_products_supplier_id'), table_name='products')
    op.drop_index(op.f('ix_products_category'), table_name='products')
    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_table('products')
    op.drop_table('suppliers')

    op.drop_index(op.f('ix_warehouses_code'), table_name='warehouses')
    with op.batch_alter_table('warehouses') as batch:
        batch.drop_constraint('fk_warehouses_updated_by', type_='foreignkey')
        batch.drop_constraint('fk_warehouses_created_by', type_='foreignkey')
        for col in ('updated_by', 'updated_at', 'created_by', 'created_at', 'email', 'phone',
                    'next_inspection', 'last_inspection', 'status', 'capacity_total',
                    'image', 'manager', 'location', 'code'):
            batch.drop_column(col)
