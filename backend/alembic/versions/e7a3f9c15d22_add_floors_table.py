"""replace zone_sections.floor ordinal with a real floors table

Revision ID: e7a3f9c15d22
Revises: d5e2b8f31c04
Create Date: 2026-07-17 11:04:52.330119

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7a3f9c15d22'
down_revision: Union[str, Sequence[str], None] = 'd5e2b8f31c04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "floors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["warehouse_id"], ["warehouses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("warehouse_id", "level", name="uq_floor_warehouse_level"),
    )
    op.create_index(op.f("ix_floors_warehouse_id"), "floors", ["warehouse_id"])

    op.add_column("zone_sections", sa.Column("floor_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_zone_sections_floor_id"), "zone_sections", ["floor_id"])
    op.create_foreign_key(
        "fk_zone_sections_floor_id", "zone_sections", "floors", ["floor_id"], ["id"]
    )

    # Backfill: one floors row per (warehouse, level) actually in use, then
    # repoint each section at its new row. Done in SQL so existing layouts
    # migrate without a data-loss window.
    op.execute(
        """
        INSERT INTO floors (warehouse_id, level, name)
        SELECT DISTINCT warehouse_id, floor, 'Floor ' || floor
        FROM zone_sections
        """
    )
    op.execute(
        """
        UPDATE zone_sections s
        SET floor_id = f.id
        FROM floors f
        WHERE f.warehouse_id = s.warehouse_id AND f.level = s.floor
        """
    )

    op.drop_column("zone_sections", "floor")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "zone_sections",
        sa.Column("floor", sa.Integer(), nullable=False, server_default="1"),
    )
    op.execute(
        """
        UPDATE zone_sections s
        SET floor = f.level
        FROM floors f
        WHERE f.id = s.floor_id
        """
    )
    op.drop_constraint("fk_zone_sections_floor_id", "zone_sections", type_="foreignkey")
    op.drop_index(op.f("ix_zone_sections_floor_id"), table_name="zone_sections")
    op.drop_column("zone_sections", "floor_id")
    op.drop_index(op.f("ix_floors_warehouse_id"), table_name="floors")
    op.drop_table("floors")
