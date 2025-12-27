"""
Quote Item schemas
견적 항목 스키마
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class QuoteItemBase(BaseModel):
    """견적 항목 기본 스키마"""

    item_name: str = Field(..., min_length=1, max_length=100, description="항목명")
    description: Optional[str] = Field(None, max_length=500, description="설명")
    quantity: int = Field(default=1, ge=1, description="수량 (양의 정수)")
    unit: Optional[str] = Field(None, max_length=20, description="단위 (개, m², 시간, 식)")
    unit_price: int = Field(default=0, ge=0, description="단가 (원)")


class QuoteItemCreate(QuoteItemBase):
    """견적 항목 생성 요청"""

    sort_order: Optional[int] = Field(default=0, description="정렬 순서")


class QuoteItemUpdate(BaseModel):
    """견적 항목 수정 요청"""

    item_name: Optional[str] = Field(None, min_length=1, max_length=100, description="항목명")
    description: Optional[str] = Field(None, max_length=500, description="설명")
    quantity: Optional[int] = Field(None, ge=1, description="수량 (양의 정수)")
    unit: Optional[str] = Field(None, max_length=20, description="단위")
    unit_price: Optional[int] = Field(None, ge=0, description="단가 (원)")
    sort_order: Optional[int] = Field(None, description="정렬 순서")


class QuoteItemResponse(BaseModel):
    """견적 항목 응답"""

    id: int
    assignment_id: int
    item_name: str
    description: Optional[str] = None
    quantity: int
    unit: Optional[str] = None
    unit_price: int
    amount: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuoteItemBulkCreate(BaseModel):
    """견적 항목 일괄 생성 요청"""

    items: list[QuoteItemCreate] = Field(..., min_length=1, description="견적 항목 목록")


class QuoteSummary(BaseModel):
    """견적 요약"""

    assignment_id: int
    items: list[QuoteItemResponse]
    total_amount: int = Field(description="합계 금액")
    item_count: int = Field(description="항목 수")


class QuoteCalculateRequest(BaseModel):
    """견적 합계 계산 및 저장 요청"""

    update_assignment: bool = Field(
        default=True,
        description="배정의 estimated_cost를 업데이트할지 여부"
    )
