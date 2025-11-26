"""
SMS Log schemas for request/response validation
SMS 발송 로그 스키마
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class SMSLogListItem(BaseModel):
    """SMS 로그 목록 아이템"""

    id: int
    receiver_phone: str  # 복호화된 값
    message: str
    sms_type: str
    reference_type: Optional[str]
    reference_id: Optional[int]
    status: str
    result_code: Optional[str]
    result_message: Optional[str]
    created_at: datetime
    sent_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SMSLogListResponse(BaseModel):
    """SMS 로그 목록 응답"""

    items: list[SMSLogListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class SMSSendRequest(BaseModel):
    """SMS 발송 요청 (관리자 수동 발송)"""

    receiver_phone: str
    message: str
    sms_type: str = "manual"

    @field_validator("receiver_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        import re
        pattern = re.compile(r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$")
        if not pattern.match(v):
            raise ValueError("올바른 전화번호 형식이 아닙니다")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if len(v) < 1:
            raise ValueError("메시지를 입력해주세요")
        if len(v) > 2000:
            raise ValueError("메시지는 2000자를 초과할 수 없습니다")
        return v


class SMSSendResponse(BaseModel):
    """SMS 발송 응답"""

    success: bool
    message: str
    sms_log_id: Optional[int] = None


class SMSStatsResponse(BaseModel):
    """SMS 통계 응답"""

    total_sent: int
    total_failed: int
    today_sent: int
    today_failed: int
    this_month_sent: int
    this_month_failed: int
