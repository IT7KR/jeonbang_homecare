"""
Quote Item model
견적서 항목 테이블

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level

각 배정(assignment)별로 견적 항목을 관리:
- 항목명, 설명, 수량, 단위, 단가, 금액
- 정렬 순서 지원
- 합계는 assignment.estimated_cost에 반영
"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime, Integer
from sqlalchemy.sql import func

from app.core.database import Base


class QuoteItem(Base):
    """견적 항목 (Quote Item)"""

    __tablename__ = "quote_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 관계 (FK 없음 - 애플리케이션 레벨에서 관리)
    assignment_id = Column(BigInteger, nullable=False, index=True)  # ApplicationPartnerAssignment.id

    # 항목 정보
    item_name = Column(String(100), nullable=False)  # 항목명 (예: "제초 작업")
    description = Column(Text, nullable=True)  # 설명 (예: "100평 기준")

    # 수량 및 단가
    quantity = Column(Integer, nullable=False, default=1)  # 수량 (양의 정수)
    unit = Column(String(20), nullable=True)  # 단위 (예: "개", "m²", "시간", "식")
    unit_price = Column(Integer, nullable=False, default=0)  # 단가 (원)
    amount = Column(Integer, nullable=False, default=0)  # 금액 = 수량 × 단가 (원)

    # 정렬 순서
    sort_order = Column(Integer, nullable=False, default=0)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<QuoteItem assignment={self.assignment_id} item={self.item_name} amount={self.amount}>"

    def calculate_amount(self):
        """수량 × 단가로 금액 계산"""
        self.amount = self.quantity * self.unit_price
        return self.amount
