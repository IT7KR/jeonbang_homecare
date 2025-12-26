"""Apply SMS templates to actual sending

SMS 발송에 템플릿 적용을 위한 스키마 확장 및 추가 템플릿 생성

- sms_logs 테이블에 template_key 컬럼 추가
- 관리자용 및 일정 변경 템플릿 3개 추가

Revision ID: 20251226_000007
Revises: 20251226_000006
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '20251226_000007'
down_revision = '20251226_000006'
branch_labels = None
depends_on = None


def upgrade():
    # 1. sms_logs 테이블에 template_key 컬럼 추가
    op.add_column(
        'sms_logs',
        sa.Column('template_key', sa.String(50), nullable=True)
    )

    # 2. 추가 시스템 템플릿 삽입 (관리자용 + 일정 변경)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES
        ('admin_new_application', '관리자용 신규 신청 알림', '신규 견적 신청 시 관리자에게 발송',
         '[전방홈케어] 새 견적 신청
신청번호: {application_number}
연락처: {customer_phone}
서비스: {services}
희망일: {schedule_info}',
         '["application_number", "customer_phone", "services", "schedule_info"]', true, true),

        ('admin_new_partner', '관리자용 신규 협력사 알림', '신규 협력사 등록 시 관리자에게 발송',
         '[전방홈케어] 새 협력사 등록
업체명: {company_name}
연락처: {contact_phone}
서비스: {services}',
         '["company_name", "contact_phone", "services"]', true, true),

        ('schedule_changed', '일정 변경 알림', '일정이 변경되었을 때 고객/협력사에게 발송',
         '[전방홈케어] 일정이 변경되었습니다.
신청번호: {application_number}
기존: {old_date}
변경: {new_date} {new_time}',
         '["application_number", "old_date", "new_date", "new_time"]', true, true);
    """)


def downgrade():
    # 추가된 템플릿 삭제
    op.execute("""
        DELETE FROM sms_templates
        WHERE template_key IN ('admin_new_application', 'admin_new_partner', 'schedule_changed');
    """)

    # template_key 컬럼 삭제
    op.drop_column('sms_logs', 'template_key')
