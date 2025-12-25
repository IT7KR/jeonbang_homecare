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

    model_config = {"from_attributes": True}


class AssignmentListResponse(BaseModel):
    """배정 목록 응답"""

    items: list[AssignmentResponse]
    total: int


# AssignmentSummary는 application.py에 정의되어 있음
# 신청 상세 조회 시 포함되는 요약 정보
