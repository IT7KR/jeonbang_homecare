"""
SMS Log model
SMS 발송 로그 모델

PK: BIGSERIAL as per CLAUDE.md
상태: pending → sent / failed
"""

from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class SMSLog(Base):
    """SMS 발송 로그"""

    __tablename__ = "sms_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 발송 정보
    receiver_phone = Column(String(500), nullable=False)  # 수신자 (암호화)
    message = Column(Text, nullable=False)  # 발송 메시지

    # 발송 유형
    sms_type = Column(String(50), nullable=False)  # application_new, partner_new, etc.

    # 관련 데이터 참조 (FK 없음)
    reference_type = Column(String(50), nullable=True)  # application, partner
    reference_id = Column(BigInteger, nullable=True)  # 관련 ID

    # 복수 발송 참조 (FK 없음)
    bulk_job_id = Column(BigInteger, nullable=True, index=True)  # BulkSMSJob.id
    batch_index = Column(Integer, nullable=True)  # 배치 번호

    # 발송 상태
    # pending: 대기중
    # sent: 발송 완료
    # failed: 발송 실패
    status = Column(String(20), nullable=False, default="pending", index=True)

    # 알리고 API 응답
    result_code = Column(String(20), nullable=True)  # 결과 코드
    result_message = Column(String(500), nullable=True)  # 결과 메시지
    msg_id = Column(String(100), nullable=True)  # 알리고 메시지 ID

    # 발송자 정보
    sender_phone = Column(String(20), nullable=True)  # 발신번호

    # 템플릿 정보
    template_key = Column(String(50), nullable=True)  # 사용된 템플릿 키

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<SMSLog {self.id}: {self.sms_type} - {self.status}>"
