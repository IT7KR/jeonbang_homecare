"""Add trigger_source column to sms_logs

Revision ID: 20251229_000003
Revises: 20251229_000002
Create Date: 2025-12-29

SMS 발송 출처 구분을 위한 trigger_source 컬럼 추가
- system: 시스템 자동 발송 (이벤트 트리거)
- manual: 관리자 직접 발송
- bulk: 대량 발송
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251229_000003"
down_revision = "20251229_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # trigger_source 컬럼 추가
    op.add_column(
        "sms_logs",
        sa.Column(
            "trigger_source",
            sa.String(20),
            nullable=False,
            server_default="system",
            comment="발송 출처: system(시스템 자동), manual(수동 발송), bulk(대량 발송)",
        ),
    )

    # 인덱스 추가 (필터링 성능 향상)
    op.create_index(
        "ix_sms_logs_trigger_source",
        "sms_logs",
        ["trigger_source"],
    )

    # 기존 데이터 업데이트: bulk_job_id가 있으면 bulk, sms_type이 manual이면 manual
    op.execute("""
        UPDATE sms_logs
        SET trigger_source = 'bulk'
        WHERE bulk_job_id IS NOT NULL
    """)
    op.execute("""
        UPDATE sms_logs
        SET trigger_source = 'manual'
        WHERE sms_type = 'manual' AND bulk_job_id IS NULL
    """)


def downgrade() -> None:
    op.drop_index("ix_sms_logs_trigger_source", table_name="sms_logs")
    op.drop_column("sms_logs", "trigger_source")
