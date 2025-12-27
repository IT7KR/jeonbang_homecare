"""add work_photos and customer_token columns

Revision ID: 20251228_000004
Revises: 20251228_000003
Create Date: 2025-12-28

시공 사진(work_photos_before/after) 및 고객 열람 토큰(customer_token) 컬럼 추가
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '20251228_000004'
down_revision = '20251228_000003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 시공 사진 컬럼 추가
    op.add_column('application_partner_assignments',
        sa.Column('work_photos_before', postgresql.JSONB(astext_type=sa.Text()),
                  nullable=True, server_default='[]'))
    op.add_column('application_partner_assignments',
        sa.Column('work_photos_after', postgresql.JSONB(astext_type=sa.Text()),
                  nullable=True, server_default='[]'))
    op.add_column('application_partner_assignments',
        sa.Column('work_photos_uploaded_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('application_partner_assignments',
        sa.Column('work_photos_updated_at', sa.DateTime(timezone=True), nullable=True))

    # 고객 열람 토큰 컬럼 추가
    op.add_column('application_partner_assignments',
        sa.Column('customer_token', sa.String(500), nullable=True))
    op.add_column('application_partner_assignments',
        sa.Column('customer_token_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('application_partner_assignments',
        sa.Column('customer_token_invalidated_before', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # 고객 열람 토큰 컬럼 제거
    op.drop_column('application_partner_assignments', 'customer_token_invalidated_before')
    op.drop_column('application_partner_assignments', 'customer_token_expires_at')
    op.drop_column('application_partner_assignments', 'customer_token')

    # 시공 사진 컬럼 제거
    op.drop_column('application_partner_assignments', 'work_photos_updated_at')
    op.drop_column('application_partner_assignments', 'work_photos_uploaded_at')
    op.drop_column('application_partner_assignments', 'work_photos_after')
    op.drop_column('application_partner_assignments', 'work_photos_before')
