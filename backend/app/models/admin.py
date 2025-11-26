"""
Admin Model
관리자 모델
"""

from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Admin(Base):
    """관리자 모델"""

    __tablename__ = "admins"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)  # SMS 알림 수신용
    role = Column(String(20), nullable=False, default="super_admin")  # 모든 관리자는 최고관리자
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Admin {self.email}>"
