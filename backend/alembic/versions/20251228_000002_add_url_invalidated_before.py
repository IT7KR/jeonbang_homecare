"""Add url_invalidated_before to application_partner_assignments

URL 재발급 시 이전 토큰 무효화를 위한 타임스탬프 필드 추가:
- 이 시간 이전에 발급된 토큰은 무효로 처리
- NULL인 경우 모든 유효 토큰 허용

Revision ID: 20251228_000002
Revises: 20251228_000001
Create Date: 2025-12-28
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251228_000002'
down_revision = '30405eff1222'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'application_partner_assignments',
        sa.Column('url_invalidated_before', sa.DateTime(timezone=True), nullable=True)
    )


def downgrade():
    op.drop_column('application_partner_assignments', 'url_invalidated_before')
