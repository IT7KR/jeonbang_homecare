"""
Application Partner Assignment schemas
신청-협력사 배정 관계 스키마
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AssignmentCreate(BaseModel):
    """배정 생성 요청"""

    partner_id: int = Field(..., description="협력사 ID")
    assigned_services: list[str] = Field(..., min_length=1, description="담당 서비스 목록")
    scheduled_date: Optional[str] = Field(None, description="예정일 (YYYY-MM-DD)")
    scheduled_time: Optional[str] = Field(None, description="예정 시간 (오전/오후/HH:MM)")
    estimated_cost: Optional[int] = Field(None, ge=0, description="견적 금액")
    estimate_note: Optional[str] = Field(None, max_length=1000, description="견적 메모")
    note: Optional[str] = Field(None, max_length=500, description="배정 메모")
    send_sms: bool = Field(False, description="SMS 알림 발송 여부")

    @field_validator("assigned_services")
    @classmethod
    def validate_services(cls, v: list[str]) -> list[str]:
        if not v or len(v) == 0:
            raise ValueError("최소 1개 이상의 서비스를 선택해주세요")
        return v


class AssignmentUpdate(BaseModel):
    """배정 수정 요청"""

    assigned_services: Optional[list[str]] = Field(None, description="담당 서비스 목록")
    status: Optional[str] = Field(None, description="배정 상태")
    scheduled_date: Optional[str] = Field(None, description="예정일 (YYYY-MM-DD)")
    scheduled_time: Optional[str] = Field(None, description="예정 시간")
    estimated_cost: Optional[int] = Field(None, ge=0, description="견적 금액")
    final_cost: Optional[int] = Field(None, ge=0, description="최종 금액")
    estimate_note: Optional[str] = Field(None, max_length=1000, description="견적 메모")
    quote_status: Optional[str] = Field(None, description="견적 상태")
    note: Optional[str] = Field(None, max_length=500, description="배정 메모")
    send_sms: bool = Field(False, description="SMS 알림 발송 여부")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = [
                "pending", "notified", "accepted",
                "scheduled", "in_progress", "completed", "cancelled"
            ]
            if v not in valid_statuses:
                raise ValueError(f"유효하지 않은 상태: {v}")
        return v

    @field_validator("quote_status")
    @classmethod
    def validate_quote_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = ["none", "draft", "sent", "viewed", "confirmed", "rejected"]
            if v not in valid_statuses:
                raise ValueError(f"유효하지 않은 견적 상태: {v}")
        return v


class AssignmentResponse(BaseModel):
    """배정 응답"""

    id: int
    application_id: int
    partner_id: int
    assigned_services: list[str]
    status: str
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    estimated_cost: Optional[int]
    final_cost: Optional[int]
    estimate_note: Optional[str] = None

    # 견적 상태
    quote_status: str = "none"  # none, draft, sent, viewed, confirmed, rejected
    quote_sent_at: Optional[datetime] = None
    quote_viewed_at: Optional[datetime] = None

    assigned_by: Optional[int]
    assigned_at: Optional[datetime]
    note: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]

    # 협력사 정보 (조인 시 포함)
    partner_name: Optional[str] = None
    partner_phone: Optional[str] = None
    partner_company: Optional[str] = None

    # 시공 사진 (관리자 업로드)
    work_photos_before: Optional[list[str]] = None
    work_photos_after: Optional[list[str]] = None
    work_photos_uploaded_at: Optional[datetime] = None
    work_photos_updated_at: Optional[datetime] = None

    # 고객 열람 토큰 (URL 정보도 포함)
    customer_token: Optional[str] = None
    customer_token_expires_at: Optional[datetime] = None
    customer_url: Optional[str] = None  # 프론트엔드에서 조립된 전체 URL

    model_config = {"from_attributes": True}


class WorkPhotoUploadResponse(BaseModel):
    """시공 사진 업로드 응답"""

    assignment_id: int
    photo_type: str  # "before" | "after"
    photos: list[str]  # 업로드된 사진 경로 목록
    total_count: int
    message: str


class WorkPhotosResponse(BaseModel):
    """시공 사진 조회 응답"""

    assignment_id: int
    before_photos: list[str]
    after_photos: list[str]
    before_photo_urls: list[str]  # 토큰화된 URL
    after_photo_urls: list[str]  # 토큰화된 URL
    before_thumbnail_urls: list[str] = []  # 시공 전 썸네일 URL
    after_thumbnail_urls: list[str] = []  # 시공 후 썸네일 URL
    uploaded_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CustomerUrlCreate(BaseModel):
    """고객 열람 URL 생성 요청"""

    expires_in_days: int = Field(7, ge=1, le=365, description="유효 기간 (일, 기본값 7일)")


class CustomerUrlExtend(BaseModel):
    """고객 열람 URL 기간 연장 요청"""

    additional_days: int = Field(..., ge=1, le=365, description="추가 연장 일수")


class PartnerUrlExtend(BaseModel):
    """협력사 열람 URL 기간 연장 요청"""

    additional_days: int = Field(..., ge=1, le=365, description="추가 연장 일수")


class CustomerUrlResponse(BaseModel):
    """고객 열람 URL 응답"""

    assignment_id: int
    token: Optional[str] = None
    url: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_valid: bool = False
    message: Optional[str] = None


class AssignmentListResponse(BaseModel):
    """배정 목록 응답"""

    items: list[AssignmentResponse]
    total: int


class QuoteStatusUpdate(BaseModel):
    """견적 상태 변경 요청"""

    quote_status: str = Field(..., description="변경할 견적 상태")
    send_sms: bool = Field(False, description="SMS 발송 여부 (sent 상태로 변경 시)")

    @field_validator("quote_status")
    @classmethod
    def validate_quote_status(cls, v: str) -> str:
        valid_statuses = ["none", "draft", "sent", "viewed", "confirmed", "rejected"]
        if v not in valid_statuses:
            raise ValueError(f"유효하지 않은 견적 상태: {v}")
        return v


# AssignmentSummary는 application.py에 정의되어 있음
# 신청 상세 조회 시 포함되는 요약 정보
