"""
Audit Log model
변경 이력 추적 모델

PK: BIGSERIAL as per CLAUDE.md
"""

from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    """변경 이력 로그"""

    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 대상 엔티티
    # application, partner, admin, sms_template 등
    entity_type = Column(String(50), nullable=False, index=True)

    # 대상 엔티티 ID
    entity_id = Column(BigInteger, nullable=False, index=True)

    # 변경 유형
    # create, update, delete, status_change, assignment, approval 등
    action = Column(String(50), nullable=False, index=True)

    # 변경 전 값 (JSON)
    old_value = Column(JSONB, nullable=True)

    # 변경 후 값 (JSON)
    new_value = Column(JSONB, nullable=True)

    # 변경 요약 (표시용)
    summary = Column(String(255), nullable=True)

    # 변경자 (FK 없음)
    admin_id = Column(BigInteger, nullable=True, index=True)
    admin_name = Column(String(100), nullable=True)  # 조회 편의를 위해 이름도 저장

    # IP 주소
    ip_address = Column(String(50), nullable=True)

    # User Agent
    user_agent = Column(String(500), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AuditLog {self.id}: {self.entity_type}:{self.entity_id} - {self.action}>"
