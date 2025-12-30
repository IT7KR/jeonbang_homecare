"""Fix SMS templates - add missing and update existing

SMS 템플릿 수정:
- admin_new_application 신규 추가 (관리자 알림용)
- admin_new_partner 신규 추가 (관리자 알림용)
- schedule_changed 신규 추가 (일정 변경 알림)
- partner_assigned 수정 (협력사 연락처 추가)
- partner_notify_assignment 수정 (정보 보강)
- schedule_confirmed 수정 (신청번호 추가)
- service_completed 수정 (실제 전화번호)
- partner_rejected 수정 (실제 전화번호)

Revision ID: 20251227_000002
Revises: 20251227_000001
Create Date: 2025-12-27
"""
from alembic import op


# revision identifiers
revision = '20251227_000002'
down_revision = '20251227_000001'
branch_labels = None
depends_on = None


def upgrade():
    # 1. admin_new_application 템플릿 추가/수정 (관리자용 - 신규 신청 알림)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES (
            'admin_new_application',
            '관리자 신규 신청 알림',
            '고객이 서비스 신청 시 관리자에게 발송',
            '[전방홈케어] 신규 서비스 신청
신청번호: {application_number}
고객연락처: {customer_phone}
서비스: {services}
희망일정: {schedule_info}
관리자 페이지에서 확인해주세요.',
            '["application_number", "customer_phone", "services", "schedule_info"]',
            true,
            true
        )
        ON CONFLICT (template_key) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            content = EXCLUDED.content,
            available_variables = EXCLUDED.available_variables;
    """)

    # 2. admin_new_partner 템플릿 추가/수정 (관리자용 - 신규 협력사 알림)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES (
            'admin_new_partner',
            '관리자 신규 협력사 알림',
            '협력사가 등록 신청 시 관리자에게 발송',
            '[전방홈케어] 신규 협력사 등록
업체명: {company_name}
연락처: {contact_phone}
서비스분야: {services}
관리자 페이지에서 확인해주세요.',
            '["company_name", "contact_phone", "services"]',
            true,
            true
        )
        ON CONFLICT (template_key) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            content = EXCLUDED.content,
            available_variables = EXCLUDED.available_variables;
    """)

    # 3. schedule_changed 템플릿 추가/수정 (일정 변경 알림)
    op.execute("""
        INSERT INTO sms_templates (template_key, title, description, content, available_variables, is_active, is_system)
        VALUES (
            'schedule_changed',
            '일정 변경 알림',
            '확정된 일정이 변경되었을 때 고객/협력사에게 발송',
            '[전방홈케어] 일정이 변경되었습니다.
신청번호: {application_number}
변경 전: {old_date}
변경 후: {new_date} {new_time}',
            '["application_number", "old_date", "new_date", "new_time"]',
            true,
            true
        )
        ON CONFLICT (template_key) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            content = EXCLUDED.content,
            available_variables = EXCLUDED.available_variables;
    """)

    # 4. partner_assigned 템플릿 수정 (협력사 연락처 추가)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 담당 협력사({partner_name})가 배정되었습니다.
연락처: {partner_phone}
예정일: {scheduled_date} {scheduled_time}
견적: {estimated_cost}
곧 연락드릴 예정입니다.',
            available_variables = '["customer_name", "partner_name", "partner_phone", "application_number", "scheduled_date", "scheduled_time", "estimated_cost"]'
        WHERE template_key = 'partner_assigned';
    """)

    # 5. partner_notify_assignment 템플릿 수정 (정보 보강 + 열람 링크)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] 새로운 서비스가 배정되었습니다.
신청번호: {application_number}
고객: {customer_name}
연락처: {customer_phone}
주소: {address}
서비스: {services}
예정일: {scheduled_date}
상세보기: {view_url}',
            available_variables = '["application_number", "customer_name", "customer_phone", "address", "services", "scheduled_date", "view_url"]'
        WHERE template_key = 'partner_notify_assignment';
    """)

    # 6. schedule_confirmed 템플릿 수정 (신청번호 추가)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스 일정이 확정되었습니다.
신청번호: {application_number}
일시: {scheduled_date} {scheduled_time}
담당: {partner_name}'
        WHERE template_key = 'schedule_confirmed';
    """)

    # 7. service_completed 템플릿 수정 (실제 전화번호)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스가 완료되었습니다.
이용해 주셔서 감사합니다.
문의: 1551-6640'
        WHERE template_key = 'service_completed';
    """)

    # 8. partner_rejected 템플릿 수정 (실제 전화번호)
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {company_name} 협력사 등록이 반려되었습니다.
사유: {rejection_reason}
문의: 1551-6640'
        WHERE template_key = 'partner_rejected';
    """)


def downgrade():
    # 신규 템플릿 삭제
    op.execute("DELETE FROM sms_templates WHERE template_key = 'admin_new_application';")
    op.execute("DELETE FROM sms_templates WHERE template_key = 'admin_new_partner';")
    op.execute("DELETE FROM sms_templates WHERE template_key = 'schedule_changed';")

    # partner_assigned 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 담당 협력사({partner_name})가 배정되었습니다.
예정일: {scheduled_date} {scheduled_time}
견적: {estimated_cost}
곧 연락드릴 예정입니다.',
            available_variables = '["customer_name", "partner_name", "application_number", "scheduled_date", "scheduled_time", "estimated_cost"]'
        WHERE template_key = 'partner_assigned';
    """)

    # partner_notify_assignment 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] 새로운 서비스 요청이 배정되었습니다. (신청번호: {application_number}) 고객: {customer_name}, 주소: {address}',
            available_variables = '["application_number", "customer_name", "address"]'
        WHERE template_key = 'partner_notify_assignment';
    """)

    # schedule_confirmed 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스 일정이 확정되었습니다. 일시: {scheduled_date} {scheduled_time}. 담당: {partner_name}'
        WHERE template_key = 'schedule_confirmed';
    """)

    # service_completed 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {customer_name}님, 서비스가 완료되었습니다. 이용해 주셔서 감사합니다. 문의: 1551-6640'
        WHERE template_key = 'service_completed';
    """)

    # partner_rejected 원복
    op.execute("""
        UPDATE sms_templates
        SET content = '[전방홈케어] {company_name} 협력사 등록이 반려되었습니다. 사유: {rejection_reason}. 문의: 1551-6640'
        WHERE template_key = 'partner_rejected';
    """)
