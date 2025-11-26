"""Add sms_logs table

Revision ID: 20251126_000006
Revises: 20251126_000005
Create Date: 2025-11-26 15:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251126_000006"
down_revision: Union[str, None] = "20251126_000005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sms_logs table
    op.create_table(
        "sms_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        # 발송 정보
        sa.Column("receiver_phone", sa.String(500), nullable=False),  # 수신자 (암호화)
        sa.Column("message", sa.Text(), nullable=False),  # 발송 메시지
        # 발송 유형
        sa.Column("sms_type", sa.String(50), nullable=False),  # application_new, partner_new, etc.
        # 관련 데이터 참조 (FK 없음)
        sa.Column("reference_type", sa.String(50), nullable=True),  # application, partner
        sa.Column("reference_id", sa.BigInteger(), nullable=True),  # 관련 ID
        # 발송 상태: pending → sent / failed
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        # 알리고 API 응답
        sa.Column("result_code", sa.String(20), nullable=True),  # 결과 코드
        sa.Column("result_message", sa.String(500), nullable=True),  # 결과 메시지
        sa.Column("msg_id", sa.String(100), nullable=True),  # 알리고 메시지 ID
        # 발송자 정보
        sa.Column("sender_phone", sa.String(20), nullable=True),  # 발신번호
        # 타임스탬프
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sms_logs_status"), "sms_logs", ["status"], unique=False)
    op.create_index(op.f("ix_sms_logs_sms_type"), "sms_logs", ["sms_type"], unique=False)
    op.create_index(op.f("ix_sms_logs_reference_type_id"), "sms_logs", ["reference_type", "reference_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_sms_logs_reference_type_id"), table_name="sms_logs")
    op.drop_index(op.f("ix_sms_logs_sms_type"), table_name="sms_logs")
    op.drop_index(op.f("ix_sms_logs_status"), table_name="sms_logs")
    op.drop_table("sms_logs")
