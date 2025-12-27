"""add estimate_note column to application_partner_assignments

Revision ID: 20251227_100001
Revises: 20251227_000002_fix_sms_templates
Create Date: 2025-12-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251227_100001'
down_revision: Union[str, None] = '20251227_000002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """estimate_note 컬럼 추가"""
    op.add_column(
        'application_partner_assignments',
        sa.Column('estimate_note', sa.Text(), nullable=True, comment='견적 메모 (견적에 대한 설명)')
    )


def downgrade() -> None:
    """estimate_note 컬럼 제거"""
    op.drop_column('application_partner_assignments', 'estimate_note')
