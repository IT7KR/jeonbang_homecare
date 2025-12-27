"""
Application schemas for request/response validation
서비스 신청 스키마
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date
import re

from app.core.validators import validate_no_xss


# 전화번호 정규식
PHONE_REGEX = re.compile(r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$")


class ApplicationCreate(BaseModel):
    """서비스 신청 생성 요청"""

    customer_name: str = Field(..., min_length=2, max_length=50, description="고객 이름")
    customer_phone: str = Field(..., description="연락처")
    address: str = Field(..., min_length=5, description="주소")
    address_detail: Optional[str] = Field(None, max_length=200, description="상세 주소")
    selected_services: list[str] = Field(..., min_length=1, description="선택한 서비스 목록")
    description: str = Field(..., min_length=20, max_length=1000, description="전달 사항")
    preferred_consultation_date: Optional[date] = Field(None, description="희망 상담일")
    preferred_work_date: Optional[date] = Field(None, description="희망 작업일")

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

    @field_validator("preferred_consultation_date", "preferred_work_date")
    @classmethod
    def validate_future_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("희망일은 오늘 이후 날짜여야 합니다")
        return v

    @field_validator("customer_name", "address", "address_detail", "description")
    @classmethod
    def validate_xss(cls, v: Optional[str]) -> Optional[str]:
        """XSS 위험 패턴 검증"""
        return validate_no_xss(v)


class ApplicationResponse(BaseModel):
    """서비스 신청 응답 (공개용 - 민감정보 제외)"""

    id: int
    application_number: str
    status: str
    selected_services: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ScheduleConflict(BaseModel):
    """일정 충돌 정보"""

    application_id: int
    application_number: str
    customer_name: str
    scheduled_time: Optional[str]


class AssignmentSummary(BaseModel):
    """배정 요약 (신청 상세 조회 시 포함)"""

    id: int
    partner_id: int
    partner_name: str
    partner_company: Optional[str]
    assigned_services: list[str]
    status: str
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    estimated_cost: Optional[int]
    final_cost: Optional[int]
    estimate_note: Optional[str]
    note: Optional[str]

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
    preferred_consultation_date: Optional[date]
    preferred_work_date: Optional[date]
    status: str
    # 레거시 필드 (단일 배정 호환용) - 새 배정은 assignments 사용
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
    # 일정 충돌 경고 (업데이트 응답에서만 사용)
    schedule_conflicts: Optional[list[ScheduleConflict]] = None
    # 다중 배정 목록 (1:N 관계)
    assignments: Optional[list[AssignmentSummary]] = None

    model_config = {"from_attributes": True}


class DuplicateApplicationInfo(BaseModel):
    """중복 신청 정보"""

    existing_id: int
    existing_application_number: str
    existing_status: str
    existing_created_at: datetime


class ApplicationCreateResponse(BaseModel):
    """서비스 신청 생성 응답"""

    success: bool
    application_number: str
    message: str
    # 중복 신청 정보 (있는 경우)
    duplicate_info: Optional[DuplicateApplicationInfo] = None
    is_duplicate: bool = False


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
    preferred_consultation_date: Optional[date]
    preferred_work_date: Optional[date]
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

    @field_validator("admin_memo")
    @classmethod
    def validate_admin_memo_xss(cls, v: Optional[str]) -> Optional[str]:
        """관리자 메모 XSS 검증"""
        return validate_no_xss(v)


class BulkAssignRequest(BaseModel):
    """신청 일괄 배정 요청"""

    application_ids: list[int] = Field(..., min_length=1, description="배정할 신청 ID 목록")
    partner_id: int = Field(..., description="배정할 협력사 ID")
    send_sms: bool = Field(False, description="SMS 알림 발송 여부")

    @field_validator("application_ids")
    @classmethod
    def validate_application_ids(cls, v: list[int]) -> list[int]:
        if not v or len(v) == 0:
            raise ValueError("최소 1개 이상의 신청을 선택해주세요")
        if len(v) > 50:
            raise ValueError("한 번에 최대 50개까지만 배정할 수 있습니다")
        return v


class BulkAssignResult(BaseModel):
    """일괄 배정 결과 (개별 신청)"""

    application_id: int
    application_number: str
    success: bool
    message: str


class BulkAssignResponse(BaseModel):
    """신청 일괄 배정 응답"""

    total: int
    success_count: int
    failed_count: int
    results: list[BulkAssignResult]
    partner_name: str
