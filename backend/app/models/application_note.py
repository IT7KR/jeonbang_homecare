"""
Application Note model for admin memo history
관리자 메모 히스토리 모델

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level
"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class ApplicationNote(Base):
    """신청 관리자 메모 (히스토리)"""

    __tablename__ = "application_notes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 신청 연결
    application_id = Column(BigInteger, nullable=False, index=True)  # Application.id

    # 작성자
    admin_id = Column(BigInteger, nullable=False)  # Admin.id
    admin_name = Column(String(100), nullable=False)  # 작성자 이름 (조인 없이 표시용)

    # 메모 내용
    content = Column(Text, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ApplicationNote {self.id} for Application {self.application_id}>"
