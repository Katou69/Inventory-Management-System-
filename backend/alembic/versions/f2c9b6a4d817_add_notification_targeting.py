"""add notification targeting to activity_events

Revision ID: f2c9b6a4d817
Revises: ba71818cc1fb
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2c9b6a4d817'
# NOTE: the live DB's alembic_version is actually stamped 'e7a3f9c15d22'
# (from orphaned commit 171d077, not on this branch's history -- see the
# "Alembic reconciliation" note left in this repo). down_revision is kept as
# the local head so `alembic history` stays a valid chain for anyone running
# this app from a clean DB; it does NOT match what's stamped on the shared DB
# right now. Do not `alembic upgrade` against that DB until the gap is fixed.
down_revision: Union[str, Sequence[str], None] = 'ba71818cc1fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("activity_events", sa.Column("target_roles", sa.String(), nullable=True))
    op.add_column("activity_events", sa.Column("target_user_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_activity_events_target_user_id_users",
        "activity_events",
        "users",
        ["target_user_id"],
        ["id"],
    )
    op.create_index(
        "ix_activity_events_target_user_id",
        "activity_events",
        ["target_user_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_activity_events_target_user_id", table_name="activity_events")
    op.drop_constraint("fk_activity_events_target_user_id_users", "activity_events", type_="foreignkey")
    op.drop_column("activity_events", "target_user_id")
    op.drop_column("activity_events", "target_roles")
