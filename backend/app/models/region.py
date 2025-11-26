"""
Region models for Korean administrative divisions
시/도 (Province) → 시/군/구 (District)

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level
"""

from sqlalchemy import Column, BigInteger, String, Boolean, Integer, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Province(Base):
    """시/도 (Province) - First level administrative division"""

    __tablename__ = "provinces"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(2), unique=True, nullable=False, index=True)  # 행정구역코드 (예: "11" 서울)
    name = Column(String(50), nullable=False)  # 전체 이름 (예: "서울특별시")
    short_name = Column(String(20), nullable=False)  # 짧은 이름 (예: "서울")
    sort_order = Column(Integer, default=0)  # 정렬 순서
    is_active = Column(Boolean, default=True)  # 활성화 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Province {self.code}: {self.name}>"


class District(Base):
    """시/군/구 (District) - Second level administrative division"""

    __tablename__ = "districts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(5), unique=True, nullable=False, index=True)  # 행정구역코드 (예: "11010" 종로구)
    province_code = Column(String(2), nullable=False, index=True)  # 상위 시/도 코드 (FK 없음)
    name = Column(String(50), nullable=False)  # 이름 (예: "종로구")
    sort_order = Column(Integer, default=0)  # 정렬 순서
    is_active = Column(Boolean, default=True)  # 활성화 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<District {self.code}: {self.name}>"
