"""Add application_notes table for admin memo history

Revision ID: 20251226_000002
Revises: 20251226_000001
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251226_000002'
down_revision = '20251226_000001'
branch_labels = None
depends_on = None


def upgrade():
    """Create application_notes table for admin memo history"""
    op.create_table(
        'application_notes',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('application_id', sa.BigInteger(), nullable=False),
        sa.Column('admin_id', sa.BigInteger(), nullable=False),
        sa.Column('admin_name', sa.String(100), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Index for faster queries by application_id
    op.create_index(
        'ix_application_notes_application_id',
        'application_notes',
        ['application_id']
    )


def downgrade():
    """Drop application_notes table"""
    op.drop_index('ix_application_notes_application_id', table_name='application_notes')
    op.drop_table('application_notes')
