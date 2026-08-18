"""add floor blueprint and scale fields

Revision ID: 7b1e4c9a2f56
Revises: 504f4efd5b8d
Create Date: 2026-08-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b1e4c9a2f56'
down_revision: Union[str, Sequence[str], None] = '504f4efd5b8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("floors", sa.Column("blueprint_data_url", sa.Text(), nullable=True))
    op.add_column("floors", sa.Column("blueprint_x", sa.Float(), nullable=True))
    op.add_column("floors", sa.Column("blueprint_y", sa.Float(), nullable=True))
    op.add_column("floors", sa.Column("blueprint_width", sa.Float(), nullable=True))
    op.add_column("floors", sa.Column("blueprint_height", sa.Float(), nullable=True))
    op.add_column("floors", sa.Column("scale_px_per_unit", sa.Float(), nullable=True))
    op.add_column("floors", sa.Column("scale_unit", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("floors", "scale_unit")
    op.drop_column("floors", "scale_px_per_unit")
    op.drop_column("floors", "blueprint_height")
    op.drop_column("floors", "blueprint_width")
    op.drop_column("floors", "blueprint_y")
    op.drop_column("floors", "blueprint_x")
    op.drop_column("floors", "blueprint_data_url")
