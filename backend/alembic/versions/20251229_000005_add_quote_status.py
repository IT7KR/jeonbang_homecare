"""Add quote_status column to application_partner_assignments

견적 상태 관리를 위한 컬럼 추가
- quote_status: none(없음), draft(작성중), sent(발송됨), viewed(확인됨), confirmed(동의), rejected(거절)
- quote_sent_at: 견적 발송 시간
- quote_viewed_at: 고객 확인 시간

Revision ID: 20251229_000005
Revises: 20251229_000004
Create Date: 2025-12-29
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251229_000005'
down_revision = '20251229_000004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. quote_status 컬럼 추가 (기본값: none)
    op.add_column(
        'application_partner_assignments',
        sa.Column('quote_status', sa.String(20), nullable=False, server_default='none')
    )

    # 2. quote_sent_at 컬럼 추가 (견적 발송 시간)
    op.add_column(
        'application_partner_assignments',
        sa.Column('quote_sent_at', sa.DateTime(timezone=True), nullable=True)
    )

    # 3. quote_viewed_at 컬럼 추가 (고객 확인 시간)
    op.add_column(
        'application_partner_assignments',
        sa.Column('quote_viewed_at', sa.DateTime(timezone=True), nullable=True)
    )

    # 4. 기존 데이터 처리: 견적 항목이 있으면 'draft'로 설정
    op.execute("""
        UPDATE application_partner_assignments a
        SET quote_status = 'draft'
        WHERE EXISTS (
            SELECT 1 FROM quote_items q WHERE q.assignment_id = a.id
        )
    """)


def downgrade() -> None:
    op.drop_column('application_partner_assignments', 'quote_viewed_at')
    op.drop_column('application_partner_assignments', 'quote_sent_at')
    op.drop_column('application_partner_assignments', 'quote_status')
