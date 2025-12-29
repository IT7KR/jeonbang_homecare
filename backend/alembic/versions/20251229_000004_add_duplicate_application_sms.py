"""Add duplicate application SMS template

중복 신청 시 관리자 알림용 SMS 템플릿 추가
- admin_new_application_duplicate: 동일 전화번호로 진행 중인 신청이 있을 때 발송

Revision ID: 20251229_000004
Revises: 20251229_000003
Create Date: 2025-12-29
"""
from alembic import op


# revision identifiers
revision = '20251229_000004'
down_revision = '20251229_000003'
branch_labels = None
depends_on = None


def upgrade():
    # admin_new_application_duplicate 템플릿 추가 (중복 신청용)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES (
            'admin_new_application_duplicate',
            '관리자 중복 신청 알림',
            '동일 전화번호로 진행 중인 신청이 있을 때 관리자에게 발송',
            '[전방홈케어] 신규 서비스 신청 (중복)
신청번호: {application_number}
고객연락처: {customer_phone}
서비스: {services}
희망일정: {schedule_info}
[중복알림] 기존 신청({existing_application_number}, {existing_status}) 진행 중
관리자 페이지에서 확인해주세요.',
            '["application_number", "customer_phone", "services", "schedule_info", "existing_application_number", "existing_status"]',
            true,
            true
        )
        ON CONFLICT (template_key) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            content = EXCLUDED.content,
            available_variables = EXCLUDED.available_variables;
    """)


def downgrade():
    op.execute("DELETE FROM sms_templates WHERE template_key = 'admin_new_application_duplicate';")
