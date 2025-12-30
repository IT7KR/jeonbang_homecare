"""Add SMS templates table

Revision ID: 20251225_000001
Revises: 20251224_000002
Create Date: 2025-12-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251225_000001'
down_revision: Union[str, None] = '20251224_000002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SMS 템플릿 테이블 생성
    op.create_table(
        'sms_templates',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('template_key', sa.String(50), nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('available_variables', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('updated_by', sa.BigInteger(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 인덱스 생성
    op.create_index('idx_sms_templates_key', 'sms_templates', ['template_key'], unique=True)

    # 기본 시스템 템플릿 삽입
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES
        ('new_application', '신규 신청 접수', '고객이 신규 신청을 완료했을 때 발송',
         '[전방홈케어] {customer_name}님, 서비스 신청이 접수되었습니다. (신청번호: {application_number}) 담당자가 곧 연락드리겠습니다.',
         '["customer_name", "application_number"]', true, true),

        ('partner_assigned', '협력사 배정 완료', '협력사가 배정되었을 때 고객에게 발송',
         '[전방홈케어] {customer_name}님, 담당 협력사({partner_name})가 배정되었습니다. 곧 연락드릴 예정입니다.',
         '["customer_name", "partner_name", "application_number"]', true, true),

        ('partner_notify_assignment', '협력사 배정 알림', '협력사에게 배정 알림 발송',
         '[전방홈케어] 새로운 서비스 요청이 배정되었습니다. (신청번호: {application_number}) 고객: {customer_name}, 주소: {address}',
         '["application_number", "customer_name", "address"]', true, true),

        ('schedule_confirmed', '일정 확정 안내', '일정이 확정되었을 때 고객에게 발송',
         '[전방홈케어] {customer_name}님, 서비스 일정이 확정되었습니다. 일시: {scheduled_date} {scheduled_time}. 담당: {partner_name}',
         '["customer_name", "scheduled_date", "scheduled_time", "partner_name", "application_number"]', true, true),

        ('partner_schedule_notify', '협력사 일정 알림', '협력사에게 일정 확정 알림',
         '[전방홈케어] 일정이 확정되었습니다. 일시: {scheduled_date} {scheduled_time}. 고객: {customer_name}, 주소: {address}',
         '["scheduled_date", "scheduled_time", "customer_name", "address", "application_number"]', true, true),

        ('service_completed', '서비스 완료 안내', '서비스가 완료되었을 때 고객에게 발송',
         '[전방홈케어] {customer_name}님, 서비스가 완료되었습니다. 이용해 주셔서 감사합니다. 문의: 1551-6640',
         '["customer_name", "application_number"]', true, true),

        ('application_cancelled', '신청 취소 안내', '신청이 취소되었을 때 고객에게 발송',
         '[전방홈케어] {customer_name}님, 서비스 신청(번호: {application_number})이 취소되었습니다. 문의사항은 연락주세요.',
         '["customer_name", "application_number"]', true, true),

        ('new_partner', '협력사 등록 접수', '협력사가 신규 등록했을 때 발송',
         '[전방홈케어] {company_name} 협력사 등록이 접수되었습니다. 검토 후 결과를 안내드리겠습니다.',
         '["company_name", "representative_name"]', true, true),

        ('partner_approved', '협력사 승인 완료', '협력사가 승인되었을 때 발송',
         '[전방홈케어] {company_name} 협력사 등록이 승인되었습니다. 서비스 배정이 시작됩니다.',
         '["company_name", "representative_name"]', true, true),

        ('partner_rejected', '협력사 등록 반려', '협력사가 반려되었을 때 발송',
         '[전방홈케어] {company_name} 협력사 등록이 반려되었습니다. 사유: {rejection_reason}. 문의: 1551-6640',
         '["company_name", "rejection_reason"]', true, true);
    """)


def downgrade() -> None:
    op.drop_index('idx_sms_templates_key', table_name='sms_templates')
    op.drop_table('sms_templates')
