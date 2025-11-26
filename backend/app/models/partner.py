"""
Partner model for service providers
협력사(협력업체/개인사업자) 모델

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level
상태: pending → approved / rejected / inactive
"""

from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class Partner(Base):
    """협력사 (Partner) - 협력업체/개인사업자"""

    __tablename__ = "partners"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 기본 정보
    company_name = Column(String(200), nullable=False)  # 회사/상호명
    representative_name = Column(String(500), nullable=False)  # 대표자명 (암호화)
    business_number = Column(String(100), nullable=True)  # 사업자등록번호 (암호화)

    # 연락처 정보 (암호화)
    contact_phone = Column(String(500), nullable=False)  # 연락처 (암호화)
    contact_email = Column(String(500), nullable=True)  # 이메일 (암호화)

    # 주소 정보 (암호화)
    address = Column(String(1000), nullable=False)  # 주소 (암호화)
    address_detail = Column(String(500), nullable=True)  # 상세 주소 (암호화)

    # 서비스 정보
    service_areas = Column(JSONB, nullable=False, default=list)  # ["제초", "잔디관리", "정원관리"]

    # 활동 지역 (2depth 선택 데이터)
    # [{"provinceCode": "41", "provinceName": "경기도", "districtCodes": ["41830"], "districtNames": ["양평군"], "isAllDistricts": false}]
    work_regions = Column(JSONB, nullable=False, default=list)

    # 소개 및 경력
    introduction = Column(Text, nullable=True)  # 회사/본인 소개
    experience = Column(Text, nullable=True)  # 경력 및 자격
    remarks = Column(Text, nullable=True)  # 비고

    # 협력사 상태
    # pending: 승인 대기
    # approved: 승인됨
    # rejected: 거절됨
    # inactive: 비활성화
    status = Column(String(20), nullable=False, default="pending", index=True)

    # 승인/거절 정보
    approved_by = Column(BigInteger, nullable=True)  # Admin.id (FK 없음)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # 관리자 메모
    admin_memo = Column(Text, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Partner {self.company_name}: {self.status}>"
