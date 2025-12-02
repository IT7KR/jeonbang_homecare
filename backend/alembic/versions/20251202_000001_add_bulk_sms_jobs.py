"""Add bulk_sms_jobs table and sms_logs bulk fields

Revision ID: 20251202_000001
Revises: 20251127_000001
Create Date: 2025-12-02 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20251202_000001"
down_revision: Union[str, None] = "20251127_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. bulk_sms_jobs 테이블 생성
    op.create_table(
        "bulk_sms_jobs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        # Job 정보
        sa.Column("job_type", sa.String(50), nullable=False),  # announcement, status_notify, manual_select
        sa.Column("title", sa.String(200), nullable=True),  # Job 제목
        # 발송 대상 설정
        sa.Column("target_type", sa.String(20), nullable=False),  # customer, partner
        sa.Column("target_filter", postgresql.JSONB(), nullable=True),  # {"status": "new"}
        sa.Column("target_ids", postgresql.JSONB(), nullable=True),  # [1, 2, 3]
        # 메시지
        sa.Column("message", sa.Text(), nullable=False),
        # 통계
        sa.Column("total_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("sent_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=True, server_default="0"),
        # 상태
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        # 진행 정보
        sa.Column("current_batch", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("total_batches", sa.Integer(), nullable=True, server_default="0"),
        # 에러 정보
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("failed_recipients", postgresql.JSONB(), nullable=True),
        # 관리자 (FK 없음)
        sa.Column("created_by", sa.BigInteger(), nullable=False),
        # 타임스탬프
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bulk_sms_jobs_status"), "bulk_sms_jobs", ["status"], unique=False)
    op.create_index(op.f("ix_bulk_sms_jobs_created_by"), "bulk_sms_jobs", ["created_by"], unique=False)
    op.create_index(op.f("ix_bulk_sms_jobs_created_at"), "bulk_sms_jobs", ["created_at"], unique=False)

    # 2. sms_logs 테이블에 bulk 관련 컬럼 추가
    op.add_column("sms_logs", sa.Column("bulk_job_id", sa.BigInteger(), nullable=True))
    op.add_column("sms_logs", sa.Column("batch_index", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_sms_logs_bulk_job_id"), "sms_logs", ["bulk_job_id"], unique=False)


def downgrade() -> None:
    # sms_logs에서 bulk 관련 컬럼 제거
    op.drop_index(op.f("ix_sms_logs_bulk_job_id"), table_name="sms_logs")
    op.drop_column("sms_logs", "batch_index")
    op.drop_column("sms_logs", "bulk_job_id")

    # bulk_sms_jobs 테이블 삭제
    op.drop_index(op.f("ix_bulk_sms_jobs_created_at"), table_name="bulk_sms_jobs")
    op.drop_index(op.f("ix_bulk_sms_jobs_created_by"), table_name="bulk_sms_jobs")
    op.drop_index(op.f("ix_bulk_sms_jobs_status"), table_name="bulk_sms_jobs")
    op.drop_table("bulk_sms_jobs")
