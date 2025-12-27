"""add_mms_images_to_sms_logs

Revision ID: 30405eff1222
Revises: 20251228_000001
Create Date: 2025-12-28 06:10:42.062007+09:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '30405eff1222'
down_revision: Union[str, None] = '20251228_000001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SMS 로그에 MMS 이미지 경로 컬럼 추가
    op.add_column('sms_logs', sa.Column('mms_images', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('sms_logs', 'mms_images')
