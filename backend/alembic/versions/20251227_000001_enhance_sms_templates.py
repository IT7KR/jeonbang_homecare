"""Enhance SMS templates

SMS 템플릿 기능 개선:
- partner_assigned: 일정/견적 정보 추가
- application_cancelled: 취소 사유 포함
- assignment_changed: 배정 변경 알림 신규

Revision ID: 20251227_000001
Revises: 20251226_000009
Create Date: 2025-12-27
"""
from alembic import op


# revision identifiers
revision = '20251227_000001'
down_revision = '20251226_000009'
branch_labels = None
depends_on = None


def upgrade():
    # 1. partner_assigned 템플릿 업데이트 (일정/견적 추가)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 담당 협력사({partner_name})가 배정되었습니다.
예정일: {scheduled_date} {scheduled_time}
견적: {estimated_cost}
곧 연락드릴 예정입니다.',
            available_variables = '["customer_name", "partner_name", "application_number", "scheduled_date", "scheduled_time", "estimated_cost"]'
        WHERE template_key = 'partner_assigned';
    """)

    # 2. application_cancelled 템플릿 업데이트 (취소 사유 추가)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스 신청(번호: {application_number})이 취소되었습니다.
사유: {cancel_reason}
문의사항은 연락주세요.',
            available_variables = '["customer_name", "application_number", "cancel_reason"]'
        WHERE template_key = 'application_cancelled';
    """)

    # 3. assignment_changed 템플릿 추가 (신규)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES (
            'assignment_changed',
            '배정 정보 변경 알림',
            '협력사 배정 정보(일정/견적) 변경 시 발송',
            '[전방홈케어] {customer_name}님, 배정 정보가 변경되었습니다.
변경일: {scheduled_date} {scheduled_time}
견적: {estimated_cost}',
            '["customer_name", "application_number", "scheduled_date", "scheduled_time", "estimated_cost"]',
            true,
            true
        );
    """)


def downgrade():
    # 신규 템플릿 삭제
    op.execute("""
        DELETE FROM sms_templates WHERE template_key = 'assignment_changed';
    """)

    # partner_assigned 템플릿 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 담당 협력사({partner_name})가 배정되었습니다. 곧 연락드릴 예정입니다.',
            available_variables = '["customer_name", "partner_name", "application_number"]'
        WHERE template_key = 'partner_assigned';
    """)

    # application_cancelled 템플릿 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스 신청(번호: {application_number})이 취소되었습니다. 문의사항은 연락주세요.',
            available_variables = '["customer_name", "application_number"]'
        WHERE template_key = 'application_cancelled';
    """)
