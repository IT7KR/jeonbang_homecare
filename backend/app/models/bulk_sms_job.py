"""
Bulk SMS Job model
대량 SMS 발송 작업 모델

PK: BIGSERIAL as per CLAUDE.md
상태: pending → processing → completed / partial_failed / failed
"""

from sqlalchemy import Column, BigInteger, String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class BulkSMSJob(Base):
    """대량 SMS 발송 작업"""

    __tablename__ = "bulk_sms_jobs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # Job 정보
    job_type = Column(String(50), nullable=False)  # announcement, status_notify, manual_select
    title = Column(String(200), nullable=True)  # Job 제목 (관리자 식별용)

    # 발송 대상 설정
    target_type = Column(String(20), nullable=False)  # customer, partner
    target_filter = Column(JSONB, nullable=True)  # {"status": "new", "region": "양평군"}
    target_ids = Column(JSONB, nullable=True)  # 선택 발송 시 ID 목록 [1, 2, 3]

    # 메시지
    message = Column(Text, nullable=False)

    # 통계
    total_count = Column(Integer, default=0)  # 전체 수신자 수
    sent_count = Column(Integer, default=0)  # 발송 완료
    failed_count = Column(Integer, default=0)  # 발송 실패

    # 상태
    # pending: 대기
    # processing: 처리 중
    # completed: 완료
    # partial_failed: 부분 실패
    # failed: 전체 실패
    # cancelled: 취소
    status = Column(String(20), nullable=False, default="pending", index=True)

    # 진행 정보
    current_batch = Column(Integer, default=0)
    total_batches = Column(Integer, default=0)

    # 에러 정보
    error_message = Column(Text, nullable=True)
    failed_recipients = Column(JSONB, nullable=True)  # [{"phone": "5678", "error": "..."}]

    # 관리자 (FK 없음, 애플리케이션 레벨에서 관리)
    created_by = Column(BigInteger, nullable=False)  # Admin.id

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<BulkSMSJob {self.id}: {self.job_type} - {self.status}>"
