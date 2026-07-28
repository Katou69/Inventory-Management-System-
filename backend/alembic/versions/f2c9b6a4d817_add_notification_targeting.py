"""add notification targeting to activity_events

Revision ID: f2c9b6a4d817
Revises: e7a3f9c15d22
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2c9b6a4d817'
down_revision: Union[str, Sequence[str], None] = 'e7a3f9c15d22'
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
