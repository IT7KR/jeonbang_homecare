"""
Application schemas for request/response validation
서비스 신청 스키마
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re


# 전화번호 정규식
PHONE_REGEX = re.compile(r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$")


class ApplicationCreate(BaseModel):
    """서비스 신청 생성 요청"""

    customer_name: str = Field(..., min_length=2, max_length=50, description="고객 이름")
    customer_phone: str = Field(..., description="연락처")
    address: str = Field(..., min_length=5, description="주소")
    address_detail: Optional[str] = Field(None, max_length=200, description="상세 주소")
    selected_services: list[str] = Field(..., min_length=1, description="선택한 서비스 목록")
    description: str = Field(..., min_length=10, max_length=1000, description="상세 요청 내용")

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError("올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)")
        return v

    @field_validator("selected_services")
    @classmethod
    def validate_services(cls, v: list[str]) -> list[str]:
        if not v or len(v) == 0:
            raise ValueError("최소 1개 이상의 서비스를 선택해주세요")
        return v


class ApplicationResponse(BaseModel):
    """서비스 신청 응답 (공개용 - 민감정보 제외)"""

    id: int
    application_number: str
    status: str
    selected_services: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationDetailResponse(BaseModel):
    """서비스 신청 상세 응답 (관리자용)"""

    id: int
    application_number: str
    customer_name: str
    customer_phone: str
    address: str
    address_detail: Optional[str]
    selected_services: list[str]
    description: str
    photos: list[str]
    status: str
    assigned_partner_id: Optional[int]
    assigned_admin_id: Optional[int]
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    estimated_cost: Optional[int]
    final_cost: Optional[int]
    admin_memo: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ApplicationCreateResponse(BaseModel):
    """서비스 신청 생성 응답"""

    success: bool
    application_number: str
    message: str


# ===== 관리자용 스키마 =====

class ApplicationListItem(BaseModel):
    """신청 목록 아이템 (관리자용)"""

    id: int
    application_number: str
    customer_name: str  # 복호화된 값
    customer_phone: str  # 복호화된 값
    address: str  # 복호화된 값
    selected_services: list[str]
    status: str
    assigned_partner_id: Optional[int]
    scheduled_date: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    """신청 목록 응답 (관리자용)"""

    items: list[ApplicationListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ApplicationUpdate(BaseModel):
    """신청 수정 요청 (관리자용)"""

    status: Optional[str] = None
    assigned_partner_id: Optional[int] = None
    assigned_admin_id: Optional[int] = None
    scheduled_date: Optional[str] = None  # YYYY-MM-DD
    scheduled_time: Optional[str] = None
    estimated_cost: Optional[int] = None
    final_cost: Optional[int] = None
    admin_memo: Optional[str] = None
    # SMS 발송 옵션
    send_sms: Optional[bool] = Field(False, description="SMS 알림 발송 여부")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = ["new", "consulting", "assigned", "scheduled", "completed", "cancelled"]
            if v not in valid_statuses:
                raise ValueError(f"유효하지 않은 상태: {v}")
        return v
