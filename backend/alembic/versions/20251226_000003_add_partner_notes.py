"""Add partner_notes table for memo history

Revision ID: 20251226_000003
Revises: 20251226_000002
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251226_000003'
down_revision = '20251226_000002'
branch_labels = None
depends_on = None


def upgrade():
    """Create partner_notes table for admin memo and status change history"""
    op.create_table(
        'partner_notes',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('partner_id', sa.BigInteger(), nullable=False),
        sa.Column('admin_id', sa.BigInteger(), nullable=True),
        sa.Column('admin_name', sa.String(100), nullable=False),
        sa.Column('note_type', sa.String(20), nullable=False, server_default='memo'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('old_status', sa.String(20), nullable=True),
        sa.Column('new_status', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create index for partner_id for faster lookups
    op.create_index('ix_partner_notes_partner_id', 'partner_notes', ['partner_id'])


def downgrade():
    """Drop partner_notes table"""
    op.drop_index('ix_partner_notes_partner_id', table_name='partner_notes')
    op.drop_table('partner_notes')
