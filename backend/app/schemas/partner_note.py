"""
Partner Note schemas for request/response validation
협력사 관리 히스토리 스키마
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class PartnerNoteCreate(BaseModel):
    """관리자 메모 생성 요청"""
    content: str = Field(..., min_length=1, max_length=2000, description="메모 내용")


class PartnerNoteResponse(BaseModel):
    """관리자 메모/상태변경 히스토리 응답"""
    id: int
    partner_id: int
    admin_id: Optional[int]
    admin_name: str
    note_type: str  # memo, status_change, system
    content: str
    old_status: Optional[str]
    new_status: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PartnerNotesResponse(BaseModel):
    """협력사 메모 목록 응답"""
    items: list[PartnerNoteResponse]
    total: int


class PartnerStatusChange(BaseModel):
    """협력사 상태 변경 요청"""
    new_status: Literal["pending", "approved", "rejected", "active", "inactive", "suspended"]
    reason: Optional[str] = Field(None, max_length=500, description="상태 변경 사유")
    send_sms: bool = Field(True, description="SMS 발송 여부")
