"""add application_received SMS template

Revision ID: 20251229_000002
Revises: 20251229_000001
Create Date: 2025-12-29

접수 확인 SMS 템플릿 추가 (new -> consulting 상태 전환 시 발송)
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '20251229_000002'
down_revision = '20251229_000001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # application_received 템플릿 추가 (접수 확인 알림)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES (
            'application_received',
            '접수 확인 알림',
            '고객 신청 접수 확인 시 발송',
            '[전방홈케어] {customer_name}님, 서비스 신청이 접수되었습니다.
신청번호: {application_number}
담당자가 곧 연락드릴 예정입니다.
문의: 1551-6640',
            '["customer_name", "application_number"]',
            true,
            true
        )
        ON CONFLICT (template_key) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            content = EXCLUDED.content,
            available_variables = EXCLUDED.available_variables;
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM sms_templates WHERE template_key = 'application_received';
    """)
