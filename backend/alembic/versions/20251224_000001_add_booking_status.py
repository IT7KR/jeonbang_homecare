"""add booking_status to service_types

Revision ID: 20251224_000001
Revises: 20251202_000001
Create Date: 2025-12-24 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251224_000001"
down_revision: Union[str, None] = "20251202_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add booking_status column
    op.add_column('service_types', sa.Column('booking_status', sa.String(20), server_default='AVAILABLE', nullable=False))
    
    # 2. Update specific rows
    # IDs 110, 111, 112 -> PREPARING
    op.execute("UPDATE service_types SET booking_status = 'PREPARING' WHERE id IN (110, 111, 112)")


def downgrade() -> None:
    op.drop_column('service_types', 'booking_status')
