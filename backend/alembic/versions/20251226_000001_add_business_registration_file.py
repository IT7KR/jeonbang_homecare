"""Add business_registration_file column to partners table

Revision ID: 20251226_000001
Revises: 20251225_000002
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251226_000001'
down_revision = '20251225_000002'
branch_labels = None
depends_on = None


def upgrade():
    """Add business_registration_file column for partner business license uploads"""
    op.add_column(
        'partners',
        sa.Column('business_registration_file', sa.String(500), nullable=True)
    )


def downgrade():
    """Remove business_registration_file column"""
    op.drop_column('partners', 'business_registration_file')
