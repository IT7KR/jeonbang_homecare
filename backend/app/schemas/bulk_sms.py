"""
Bulk SMS schemas for request/response validation
대량 SMS 발송 스키마
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class BulkSMSSendRequest(BaseModel):
    """대량 SMS 발송 요청"""

    job_type: str  # announcement, status_notify, manual_select
    title: Optional[str] = None
    target_type: str  # customer, partner
    target_filter: Optional[dict] = None  # {"status": "new"}
    target_ids: Optional[list[int]] = None  # [1, 2, 3]
    message: str

    @field_validator("job_type")
    @classmethod
    def validate_job_type(cls, v: str) -> str:
        allowed = ["announcement", "status_notify", "manual_select"]
        if v not in allowed:
            raise ValueError(f"job_type은 {allowed} 중 하나여야 합니다")
        return v

    @field_validator("target_type")
    @classmethod
    def validate_target_type(cls, v: str) -> str:
        allowed = ["customer", "partner"]
        if v not in allowed:
            raise ValueError(f"target_type은 {allowed} 중 하나여야 합니다")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("메시지는 필수입니다")
        if len(v) > 2000:
            raise ValueError("메시지는 2000자 이내여야 합니다")
        return v


class BulkSMSJobResponse(BaseModel):
    """대량 SMS Job 생성 응답"""

    job_id: int
    status: str
    message: str


class FailedRecipient(BaseModel):
    """발송 실패 수신자"""

    phone: str
    name: Optional[str] = None
    error: str


class BulkSMSJobDetailResponse(BaseModel):
    """대량 SMS Job 상세 응답"""

    id: int
    job_type: str
    title: Optional[str]
    target_type: str
    status: str
    total_count: int
    sent_count: int
    failed_count: int
    progress: float  # 0-100%
    current_batch: int
    total_batches: int
    failed_recipients: Optional[list[FailedRecipient]] = None
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class BulkSMSJobListResponse(BaseModel):
    """대량 SMS Job 목록 응답"""

    items: list[BulkSMSJobDetailResponse]
    total: int
    page: int
    page_size: int


class SMSRecipient(BaseModel):
    """SMS 수신자"""

    id: int
    name: str
    phone: str  # 마스킹된 번호 (010-****-5678)
    label: str  # 신청번호 또는 회사명
    type: str  # customer, partner
    status: Optional[str] = None  # 상태 (new, approved 등)


class SMSRecipientsResponse(BaseModel):
    """SMS 수신자 목록 응답"""

    items: list[SMSRecipient]
    total: int
    page: int
    page_size: int
