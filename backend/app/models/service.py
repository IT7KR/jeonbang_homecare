"""
Service models for service categories and types

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level
"""

from sqlalchemy import Column, BigInteger, String, Boolean, Integer, DateTime, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ServiceCategory(Base):
    """서비스 카테고리 (외부 관리, 조경 공사 등)"""

    __tablename__ = "service_categories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(30), unique=True, nullable=False, index=True)  # "exterior", "landscaping"
    name = Column(String(50), nullable=False)  # "외부 관리", "조경 공사"
    icon = Column(String(30), nullable=True)  # Lucide 아이콘명: "Leaf", "Trees"
    description = Column(Text, nullable=True)  # 카테고리 설명
    sort_order = Column(Integer, default=0)  # 정렬 순서
    is_active = Column(Boolean, default=True)  # 활성화 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ServiceCategory {self.code}: {self.name}>"


class ServiceType(Base):
    """서비스 타입 (제초, 제설, 벌집 제거 등)"""

    __tablename__ = "service_types"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(30), unique=True, nullable=False, index=True)  # "WEEDING", "SNOW_REMOVAL"
    name = Column(String(100), nullable=False)  # "제초", "제설"
    category_code = Column(String(30), nullable=False, index=True)  # 카테고리 코드 (FK 없음)
    description = Column(Text, nullable=True)  # 서비스 설명
    sort_order = Column(Integer, default=0)  # 카테고리 내 정렬 순서
    is_active = Column(Boolean, default=True)  # 활성화 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ServiceType {self.code}: {self.name}>"
