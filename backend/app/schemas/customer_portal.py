"""
Customer Portal schemas
고객 열람 포털 - 시공 정보 및 사진 열람용 스키마
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CustomerViewPhoto(BaseModel):
    """사진 정보 (토큰화된 URL)"""
    url: str
    filename: str


class CustomerViewQuoteItem(BaseModel):
    """견적 항목"""
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit: str
    unit_price: int
    amount: int


class CustomerViewQuote(BaseModel):
    """견적 정보"""
    quote_number: str
    quote_date: str
    items: list[CustomerViewQuoteItem]
    total_amount: int
    estimate_note: Optional[str] = None
    pdf_download_url: str


class CustomerViewResponse(BaseModel):
    """고객 열람용 시공 정보 응답 (개인정보 마스킹)"""

    # 배정 정보
    assignment_id: int
    assignment_status: str
    status_label: str  # 상태 한글 표시
    assigned_services: list[str]
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None

    # 신청 정보 (마스킹 적용)
    application_number: str
    customer_name_masked: str  # 홍** 형식
    address_partial: str  # 동/리까지만 표시
    selected_services: list[str]  # 전체 서비스 목록
    description: Optional[str] = None

    # 협력사 정보 (연락처 마스킹)
    partner_company: Optional[str] = None
    partner_phone_masked: Optional[str] = None  # 010-****-5678 형식

    # 견적 정보
    quote: Optional[CustomerViewQuote] = None

    # 시공 사진 (토큰화된 URL)
    work_photos_before: list[CustomerViewPhoto] = []
    work_photos_after: list[CustomerViewPhoto] = []
    work_photos_uploaded_at: Optional[str] = None

    # 진행 현황
    progress_steps: list[dict]  # [{"step": "접수", "status": "completed", "date": "..."}]

    # 메타 정보
    created_at: str
    token_expires_at: str
    contact_info: str = "문의: 031-XXX-XXXX"


class CustomerViewTokenInfo(BaseModel):
    """토큰 정보 응답"""
    is_valid: bool
    expires_at: Optional[str] = None
    assignment_id: Optional[int] = None
    message: Optional[str] = None
