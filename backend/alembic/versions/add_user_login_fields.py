"""add_user_login_fields

Revision ID: add_user_login_fields
Revises: 143e8f9f1bdd
Create Date: 2026-07-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_login_fields'
down_revision = '143e8f9f1bdd'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to users table
    op.add_column('users', sa.Column('login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('lockout_until', sa.DateTime(timezone=True), nullable=True))
    
    # Update status column to accept 'pending'
    # For SQLite, we can't alter enum directly, but our schema uses string so it's fine
    pass


def downgrade():
    op.drop_column('users', 'lockout_until')
    op.drop_column('users', 'login_attempts')
