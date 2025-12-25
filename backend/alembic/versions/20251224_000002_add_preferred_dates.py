"""add preferred dates to applications

Revision ID: 20251224_000002
Revises: 20251224_000001
Create Date: 2025-12-24 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251224_000002"
down_revision: Union[str, None] = "20251224_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 희망 상담일 컬럼 추가
    op.add_column('applications', sa.Column('preferred_consultation_date', sa.Date(), nullable=True))
    # 희망 작업일 컬럼 추가
    op.add_column('applications', sa.Column('preferred_work_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('applications', 'preferred_work_date')
    op.drop_column('applications', 'preferred_consultation_date')
