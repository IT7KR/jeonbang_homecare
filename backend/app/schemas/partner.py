"""
Partner schemas for request/response validation
협력사 등록 스키마
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re

from app.core.validators import validate_no_xss


# 전화번호 정규식
PHONE_REGEX = re.compile(r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$")
# 사업자등록번호 정규식
BUSINESS_NUMBER_REGEX = re.compile(r"^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$")


class SelectedRegion(BaseModel):
    """선택된 지역 스키마"""

    provinceCode: str
    provinceName: str
    districtCodes: list[str]
    districtNames: list[str]
    isAllDistricts: bool


class PartnerCreate(BaseModel):
    """협력사 등록 요청"""

    # 기본 정보
    company_name: str = Field(..., min_length=2, max_length=100, alias="companyName", description="회사/상호명")
    representative_name: str = Field(..., min_length=2, max_length=50, alias="representativeName", description="대표자명")
    business_number: Optional[str] = Field(None, alias="businessNumber", description="사업자등록번호")

    # 연락처 정보
    contact_phone: str = Field(..., alias="contactPhone", description="연락처")
    contact_email: Optional[str] = Field(None, alias="contactEmail", description="이메일")

    # 주소 정보
    address: str = Field(..., min_length=5, description="주소")
    address_detail: Optional[str] = Field(None, max_length=200, alias="addressDetail", description="상세 주소")

    # 서비스 정보
    service_areas: list[str] = Field(..., min_length=1, alias="serviceAreas", description="서비스 분야")
    work_regions: list[SelectedRegion] = Field(..., min_length=1, alias="workRegions", description="활동 지역")

    # 소개 및 경력
    introduction: Optional[str] = Field(None, max_length=500, description="회사/본인 소개")
    experience: Optional[str] = Field(None, max_length=500, description="경력 및 자격")
    remarks: Optional[str] = Field(None, max_length=500, description="비고")

    model_config = {"populate_by_name": True}

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError("올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)")
        return v

    @field_validator("business_number")
    @classmethod
    def validate_business_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if not BUSINESS_NUMBER_REGEX.match(v):
            raise ValueError("올바른 사업자등록번호 형식이 아닙니다 (예: 123-45-67890)")
        return v

    @field_validator("contact_email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        # Basic email validation
        if "@" not in v or "." not in v:
            raise ValueError("올바른 이메일 형식이 아닙니다")
        return v

    @field_validator("service_areas")
    @classmethod
    def validate_service_areas(cls, v: list[str]) -> list[str]:
        if not v or len(v) == 0:
            raise ValueError("최소 1개 이상의 서비스 분야를 선택해주세요")
        return v

    @field_validator("work_regions")
    @classmethod
    def validate_work_regions(cls, v: list[SelectedRegion]) -> list[SelectedRegion]:
        if not v or len(v) == 0:
            raise ValueError("최소 1개 이상의 활동 지역을 선택해주세요")
        return v

    @field_validator(
        "company_name",
        "representative_name",
        "address",
        "address_detail",
        "introduction",
        "experience",
        "remarks",
    )
    @classmethod
    def validate_xss(cls, v: Optional[str]) -> Optional[str]:
        """XSS 위험 패턴 검증"""
        return validate_no_xss(v)


class PartnerResponse(BaseModel):
    """협력사 응답 (공개용 - 민감정보 제외)"""

    id: int
    company_name: str
    status: str
    service_areas: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PartnerDetailResponse(BaseModel):
    """협력사 상세 응답 (관리자용)"""

    id: int
    company_name: str
    representative_name: str
    business_number: Optional[str]
    contact_phone: str
    contact_email: Optional[str]
    address: str
    address_detail: Optional[str]
    service_areas: list[str]
    work_regions: list[dict]
    introduction: Optional[str]
    experience: Optional[str]
    remarks: Optional[str]
    business_registration_file: Optional[str]  # 사업자등록증 파일 경로
    status: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    admin_memo: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DuplicatePartnerInfo(BaseModel):
    """중복 협력사 정보"""

    existing_id: int
    existing_company_name: str
    existing_status: str
    existing_created_at: datetime
    duplicate_type: str  # "business_number" | "phone_company"


class PartnerCreateResponse(BaseModel):
    """협력사 등록 응답"""

    success: bool
    partner_id: int
    message: str
    # 중복 협력사 정보 (있는 경우)
    duplicate_info: Optional[DuplicatePartnerInfo] = None
    is_duplicate: bool = False


# ===== 관리자용 스키마 =====

class PartnerListItem(BaseModel):
    """협력사 목록 아이템 (관리자용)"""

    id: int
    company_name: str
    representative_name: str  # 복호화된 값
    contact_phone: str  # 복호화된 값
    service_areas: list[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PartnerListResponse(BaseModel):
    """협력사 목록 응답 (관리자용)"""

    items: list[PartnerListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class PartnerUpdate(BaseModel):
    """협력사 수정 요청 (관리자용)"""

    status: Optional[str] = None
    rejection_reason: Optional[str] = None
    admin_memo: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = ["pending", "approved", "rejected", "inactive"]
            if v not in valid_statuses:
                raise ValueError(f"유효하지 않은 상태: {v}")
        return v

    @field_validator("rejection_reason", "admin_memo")
    @classmethod
    def validate_xss(cls, v: Optional[str]) -> Optional[str]:
        """XSS 위험 패턴 검증"""
        return validate_no_xss(v)


class PartnerApprove(BaseModel):
    """협력사 승인/거절 요청"""

    action: str  # approve / reject
    rejection_reason: Optional[str] = None
    send_sms: bool = True  # SMS 발송 여부 (기본: True)

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in ["approve", "reject"]:
            raise ValueError("action은 'approve' 또는 'reject'만 가능합니다")
        return v

    @field_validator("rejection_reason")
    @classmethod
    def validate_rejection_xss(cls, v: Optional[str]) -> Optional[str]:
        """거절 사유 XSS 검증"""
        return validate_no_xss(v)
