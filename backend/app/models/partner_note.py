"""
Partner Note model for admin memo and status change history
협력사 관리 히스토리 모델

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level
"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class PartnerNote(Base):
    """협력사 관리 히스토리 (메모 + 상태변경)"""

    __tablename__ = "partner_notes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 협력사 연결
    partner_id = Column(BigInteger, nullable=False, index=True)  # Partner.id

    # 작성자
    admin_id = Column(BigInteger, nullable=True)  # Admin.id (시스템 자동 생성 시 null)
    admin_name = Column(String(100), nullable=False)  # 작성자 이름 (조인 없이 표시용)

    # 노트 유형: memo(메모), status_change(상태변경), system(시스템 자동)
    note_type = Column(String(20), nullable=False, default="memo")

    # 메모 내용
    content = Column(Text, nullable=False)

    # 상태 변경 시 추가 정보
    old_status = Column(String(20), nullable=True)  # 이전 상태
    new_status = Column(String(20), nullable=True)  # 변경된 상태

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<PartnerNote {self.id} for Partner {self.partner_id}>"
