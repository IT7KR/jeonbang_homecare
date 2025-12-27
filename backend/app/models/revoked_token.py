"""
Revoked Token model
만료(취소)된 토큰 블랙리스트

PK: BIGSERIAL as per CLAUDE.md
"""

from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class RevokedToken(Base):
    """만료된 토큰 (Revoked Token)"""

    __tablename__ = "revoked_tokens"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 토큰 해시 (SHA256) - 원본 토큰 저장 안함
    token_hash = Column(String(64), nullable=False, index=True)

    # 관련 배정 ID
    assignment_id = Column(BigInteger, nullable=False, index=True)

    # 만료 처리 정보
    revoked_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_by = Column(BigInteger, nullable=True)  # Admin.id
    reason = Column(String(255), nullable=True)

    def __repr__(self):
        return f"<RevokedToken hash={self.token_hash[:8]}... assignment={self.assignment_id}>"
