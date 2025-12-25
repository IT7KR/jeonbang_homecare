"""
SMS Template schemas
SMS 템플릿 관련 Pydantic 스키마
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class SMSTemplateBase(BaseModel):
    """SMS 템플릿 기본 필드"""
    title: str = Field(..., max_length=100, description="템플릿 제목")
    description: Optional[str] = Field(None, max_length=255, description="템플릿 설명")
    content: str = Field(..., min_length=1, max_length=2000, description="템플릿 내용")
    is_active: bool = Field(True, description="활성화 여부")


class SMSTemplateCreate(SMSTemplateBase):
    """SMS 템플릿 생성"""
    template_key: str = Field(..., max_length=50, description="템플릿 키 (유니크)")
    available_variables: Optional[List[str]] = Field(None, description="사용 가능한 변수 목록")


class SMSTemplateUpdate(BaseModel):
    """SMS 템플릿 수정 (시스템 템플릿은 content만 수정 가능)"""
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    is_active: Optional[bool] = None


class SMSTemplateResponse(SMSTemplateBase):
    """SMS 템플릿 응답"""
    id: int
    template_key: str
    available_variables: Optional[List[str]] = None
    is_system: bool
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


class SMSTemplateListResponse(BaseModel):
    """SMS 템플릿 목록 응답"""
    items: List[SMSTemplateResponse]
    total: int


class SMSTemplatePreviewRequest(BaseModel):
    """SMS 템플릿 미리보기 요청"""
    template_key: str = Field(..., description="템플릿 키")
    variables: dict = Field(default_factory=dict, description="변수 값들")


class SMSTemplatePreviewResponse(BaseModel):
    """SMS 템플릿 미리보기 응답"""
    original: str = Field(..., description="원본 템플릿")
    preview: str = Field(..., description="변수 치환된 메시지")
    byte_length: int = Field(..., description="메시지 바이트 길이")
    message_type: str = Field(..., description="SMS/LMS 여부")
