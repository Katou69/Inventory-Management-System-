"""add zone_sections.floor

Revision ID: d5e2b8f31c04
Revises: ba71818cc1fb
Create Date: 2026-07-17 10:12:03.114820

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e2b8f31c04'
down_revision: Union[str, Sequence[str], None] = 'ba71818cc1fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # server_default backfills existing rows onto floor 1 — without it the
    # NOT NULL add fails on any table that already has sections.
    op.add_column(
        "zone_sections",
        sa.Column("floor", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("zone_sections", "floor")
