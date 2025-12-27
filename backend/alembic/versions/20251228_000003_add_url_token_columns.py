"""Add url_token and url_expires_at to application_partner_assignments

URL을 명시적으로 발급하고 DB에 저장하기 위한 컬럼 추가:
- url_token: 발급된 토큰 문자열 (모달 열기만으로 생성되지 않음)
- url_expires_at: 토큰 만료 시간

Revision ID: 20251228_000003
Revises: 20251228_000002
Create Date: 2025-12-28
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251228_000003'
down_revision = '20251228_000002'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'application_partner_assignments',
        sa.Column('url_token', sa.String(500), nullable=True)
    )
    op.add_column(
        'application_partner_assignments',
        sa.Column('url_expires_at', sa.DateTime(timezone=True), nullable=True)
    )


def downgrade():
    op.drop_column('application_partner_assignments', 'url_expires_at')
    op.drop_column('application_partner_assignments', 'url_token')
