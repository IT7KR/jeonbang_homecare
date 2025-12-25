"""Add application_partner_assignments table for 1:N mapping

Revision ID: 20251226_000004
Revises: 20251226_000003
Create Date: 2025-12-26

신청-협력사 1:N 매핑 지원을 위한 중간 테이블 추가
기존 assigned_partner_id 데이터를 새 테이블로 마이그레이션
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers
revision = '20251226_000004'
down_revision = '20251226_000003'
branch_labels = None
depends_on = None


def upgrade():
    """Create application_partner_assignments table and migrate existing data"""

    # 1. 새 테이블 생성
    op.create_table(
        'application_partner_assignments',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('application_id', sa.BigInteger(), nullable=False),
        sa.Column('partner_id', sa.BigInteger(), nullable=False),
        sa.Column('assigned_services', JSONB(), nullable=False, server_default='[]'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('scheduled_date', sa.Date(), nullable=True),
        sa.Column('scheduled_time', sa.String(20), nullable=True),
        sa.Column('estimated_cost', sa.Integer(), nullable=True),
        sa.Column('final_cost', sa.Integer(), nullable=True),
        sa.Column('assigned_by', sa.BigInteger(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. 인덱스 생성
    op.create_index(
        'ix_application_partner_assignments_application_id',
        'application_partner_assignments',
        ['application_id']
    )
    op.create_index(
        'ix_application_partner_assignments_partner_id',
        'application_partner_assignments',
        ['partner_id']
    )
    op.create_index(
        'ix_application_partner_assignments_status',
        'application_partner_assignments',
        ['status']
    )

    # 3. 기존 데이터 마이그레이션 (assigned_partner_id가 있는 경우)
    # Raw SQL로 기존 배정 데이터를 새 테이블로 복사
    op.execute("""
        INSERT INTO application_partner_assignments (
            application_id,
            partner_id,
            assigned_services,
            status,
            scheduled_date,
            scheduled_time,
            estimated_cost,
            final_cost,
            assigned_by,
            assigned_at,
            created_at,
            updated_at,
            completed_at,
            cancelled_at
        )
        SELECT
            a.id as application_id,
            a.assigned_partner_id as partner_id,
            a.selected_services as assigned_services,
            CASE
                WHEN a.status = 'completed' THEN 'completed'
                WHEN a.status = 'cancelled' THEN 'cancelled'
                WHEN a.status = 'scheduled' THEN 'scheduled'
                WHEN a.status IN ('assigned', 'consulting') THEN 'pending'
                ELSE 'pending'
            END as status,
            a.scheduled_date,
            a.scheduled_time,
            a.estimated_cost,
            a.final_cost,
            a.assigned_admin_id as assigned_by,
            a.updated_at as assigned_at,
            a.created_at,
            a.updated_at,
            a.completed_at,
            a.cancelled_at
        FROM applications a
        WHERE a.assigned_partner_id IS NOT NULL
    """)


def downgrade():
    """Drop application_partner_assignments table"""
    op.drop_index('ix_application_partner_assignments_status', table_name='application_partner_assignments')
    op.drop_index('ix_application_partner_assignments_partner_id', table_name='application_partner_assignments')
    op.drop_index('ix_application_partner_assignments_application_id', table_name='application_partner_assignments')
    op.drop_table('application_partner_assignments')
