"""
Application Note schemas for API
관리자 메모 히스토리 스키마
"""

from datetime import datetime
from pydantic import BaseModel, Field


class ApplicationNoteCreate(BaseModel):
    """메모 생성 요청"""
    content: str = Field(..., min_length=1, max_length=2000, description="메모 내용")


class ApplicationNoteResponse(BaseModel):
    """메모 응답"""
    id: int
    application_id: int
    admin_id: int
    admin_name: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationNotesListResponse(BaseModel):
    """메모 목록 응답"""
    items: list[ApplicationNoteResponse]
    total: int
