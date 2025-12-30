"""add view_url to service_completed template

Revision ID: 20251229_000001
Revises: 20251228_000004_add_work_photos_and_customer_token
Create Date: 2025-12-29

완료 SMS 템플릿에 시공 결과 열람 URL 변수 추가
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '20251229_000001'
down_revision = '20251228_000004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # service_completed 템플릿 업데이트 (view_url 변수 추가)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스가 완료되었습니다.
이용해 주셔서 감사합니다.
시공 결과 확인: {view_url}
문의: 1551-6640',
            available_variables = '["customer_name", "application_number", "partner_name", "view_url"]'
        WHERE template_key = 'service_completed';
    """)


def downgrade() -> None:
    # service_completed 템플릿 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스가 완료되었습니다.
이용해 주셔서 감사합니다.
문의: 1551-6640',
            available_variables = '["customer_name", "application_number"]'
        WHERE template_key = 'service_completed';
    """)
