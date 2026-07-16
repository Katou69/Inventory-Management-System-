"""drop warehouses capacity_total

Revision ID: ba71818cc1fb
Revises: c3d1a7b45e90
Create Date: 2026-07-16 13:45:41.896775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba71818cc1fb'
down_revision: Union[str, Sequence[str], None] = 'c3d1a7b45e90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("warehouses", "capacity_total")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "warehouses",
        sa.Column("capacity_total", sa.Integer(), nullable=False, server_default="0"),
    )
