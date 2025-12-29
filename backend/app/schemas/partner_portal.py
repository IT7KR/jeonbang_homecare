"""
Partner Portal schemas
협력사 포털 - 배정 정보 열람용 스키마
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PartnerViewPhoto(BaseModel):
    """사진 정보 (토큰화된 URL)"""
    url: str
    filename: str


class PartnerViewResponse(BaseModel):
    """협력사 열람용 신청 정보 응답 (개인정보 마스킹)"""

    # 배정 정보
    assignment_id: int
    assignment_status: str
    assigned_services: list[str]
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    estimated_cost: Optional[int] = None
    estimate_note: Optional[str] = None
    note: Optional[str] = None

    # 신청 정보 (마스킹 적용)
    application_number: str
    customer_name_masked: str  # 홍** 형식
    address_partial: str  # 동/리까지만 표시
    selected_services: list[str]  # 전체 서비스 목록
    description: str

    # 희망 일정
    preferred_consultation_date: Optional[str] = None
    preferred_work_date: Optional[str] = None

    # 사진 목록 (토큰화된 URL)
    photos: list[PartnerViewPhoto] = []

    # 메타 정보
    created_at: str
    token_expires_at: str


class PartnerViewTokenResponse(BaseModel):
    """토큰 생성 응답"""
    token: str
    view_url: str
    expires_at: str


class PartnerViewTokenRequest(BaseModel):
    """토큰 생성 요청 (관리자용)"""
    assignment_id: int = Field(..., description="배정 ID")
    expires_in_days: int = Field(default=7, ge=1, le=30, description="토큰 유효 기간 (일)")


class PartnerPhotoUploadResponse(BaseModel):
    """협력사 시공 사진 업로드 응답"""
    assignment_id: int
    photo_type: str  # "before" | "after"
    photos: list[str]  # 업로드된 사진 경로 목록
    total_count: int
    message: str


class PartnerWorkPhotosResponse(BaseModel):
    """협력사 포털 시공 사진 조회 응답"""
    assignment_id: int
    before_photos: list[PartnerViewPhoto] = []
    after_photos: list[PartnerViewPhoto] = []
    can_upload: bool = False  # 업로드 가능 여부 (상태 기반)
    max_photos_per_type: int = 10
