"""Update audit log status labels to Korean

Revision ID: 20251226_000009
Revises: 20251226_000008
Create Date: 2025-12-26

기존 감사 로그의 상태 변경 summary를 영어에서 한글로 변환
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '20251226_000009'
down_revision: Union[str, None] = '20251226_000008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# 신청(Application) 상태 매핑
APPLICATION_STATUS_MAP = {
    'new': '신규',
    'consulting': '상담중',
    'assigned': '배정완료',
    'scheduled': '일정확정',
    'completed': '완료',
    'cancelled': '취소',
}

# 협력사(Partner) 상태 매핑
PARTNER_STATUS_MAP = {
    'pending': '대기중',
    'approved': '승인됨',
    'rejected': '거절됨',
    'inactive': '비활성',
}


def upgrade() -> None:
    """기존 감사 로그의 영어 상태값을 한글로 변환"""

    # Application 상태 변환
    for eng, kor in APPLICATION_STATUS_MAP.items():
        # old_status 변환 (예: "상태 변경: new →" -> "상태 변경: 신규 →")
        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '상태 변경: {eng} →', '상태 변경: {kor} →')
            WHERE action = 'status_change'
              AND entity_type = 'application'
              AND summary LIKE '%상태 변경: {eng} →%'
        """)

        # new_status 변환 (예: "→ new" -> "→ 신규")
        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '→ {eng}', '→ {kor}')
            WHERE action = 'status_change'
              AND entity_type = 'application'
              AND summary LIKE '%→ {eng}%'
        """)

    # Partner 상태 변환
    for eng, kor in PARTNER_STATUS_MAP.items():
        # old_status 변환
        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '상태 변경: {eng} →', '상태 변경: {kor} →')
            WHERE action = 'status_change'
              AND entity_type = 'partner'
              AND summary LIKE '%상태 변경: {eng} →%'
        """)

        # new_status 변환
        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '→ {eng}', '→ {kor}')
            WHERE action = 'status_change'
              AND entity_type = 'partner'
              AND summary LIKE '%→ {eng}%'
        """)


def downgrade() -> None:
    """한글 상태값을 다시 영어로 변환 (rollback)"""

    # Application 상태 역변환
    for eng, kor in APPLICATION_STATUS_MAP.items():
        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '상태 변경: {kor} →', '상태 변경: {eng} →')
            WHERE action = 'status_change'
              AND entity_type = 'application'
              AND summary LIKE '%상태 변경: {kor} →%'
        """)

        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '→ {kor}', '→ {eng}')
            WHERE action = 'status_change'
              AND entity_type = 'application'
              AND summary LIKE '%→ {kor}%'
        """)

    # Partner 상태 역변환
    for eng, kor in PARTNER_STATUS_MAP.items():
        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '상태 변경: {kor} →', '상태 변경: {eng} →')
            WHERE action = 'status_change'
              AND entity_type = 'partner'
              AND summary LIKE '%상태 변경: {kor} →%'
        """)

        op.execute(f"""
            UPDATE audit_logs
            SET summary = REPLACE(summary, '→ {kor}', '→ {eng}')
            WHERE action = 'status_change'
              AND entity_type = 'partner'
              AND summary LIKE '%→ {kor}%'
        """)
