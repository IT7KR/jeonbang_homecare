"""
Quote Items API (Admin)
견적 항목 관리 API

- 배정별 견적 항목 CRUD
- 합계 계산 및 assignment 업데이트
- PDF 생성
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.quote_item import QuoteItem
from app.models.application import Application
from app.models.application_assignment import ApplicationPartnerAssignment
from app.schemas.quote_item import (
    QuoteItemCreate,
    QuoteItemUpdate,
    QuoteItemResponse,
    QuoteItemBulkCreate,
    QuoteSummary,
    QuoteCalculateRequest,
)
from app.services.quote_pdf import generate_quote_pdf, get_quote_filename


router = APIRouter(prefix="/assignments/{assignment_id}/quote", tags=["quotes"])


def get_assignment_or_404(db: Session, assignment_id: int) -> ApplicationPartnerAssignment:
    """배정 조회 (없으면 404)"""
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="배정을 찾을 수 없습니다."
        )
    return assignment


@router.get("", response_model=QuoteSummary)
async def get_quote_items(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 견적 항목 목록 조회
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    # 견적 항목 조회 (정렬 순서대로)
    items = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id
    ).order_by(asc(QuoteItem.sort_order), asc(QuoteItem.id)).all()

    # 합계 계산
    total_amount = sum(item.amount for item in items)

    return QuoteSummary(
        assignment_id=assignment_id,
        items=items,
        total_amount=total_amount,
        item_count=len(items),
    )


@router.post("/items", response_model=QuoteItemResponse, status_code=status.HTTP_201_CREATED)
async def create_quote_item(
    assignment_id: int,
    data: QuoteItemCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 추가
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    # 금액 계산
    amount = int(float(data.quantity) * data.unit_price)

    # 항목 생성
    item = QuoteItem(
        assignment_id=assignment_id,
        item_name=data.item_name,
        description=data.description,
        quantity=data.quantity,
        unit=data.unit,
        unit_price=data.unit_price,
        amount=amount,
        sort_order=data.sort_order or 0,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.post("/items/bulk", response_model=QuoteSummary, status_code=status.HTTP_201_CREATED)
async def create_quote_items_bulk(
    assignment_id: int,
    data: QuoteItemBulkCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 일괄 추가
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    created_items = []
    for idx, item_data in enumerate(data.items):
        amount = int(float(item_data.quantity) * item_data.unit_price)
        item = QuoteItem(
            assignment_id=assignment_id,
            item_name=item_data.item_name,
            description=item_data.description,
            quantity=item_data.quantity,
            unit=item_data.unit,
            unit_price=item_data.unit_price,
            amount=amount,
            sort_order=item_data.sort_order if item_data.sort_order is not None else idx,
        )
        db.add(item)
        created_items.append(item)

    db.commit()
    for item in created_items:
        db.refresh(item)

    # 합계 계산
    total_amount = sum(item.amount for item in created_items)

    return QuoteSummary(
        assignment_id=assignment_id,
        items=created_items,
        total_amount=total_amount,
        item_count=len(created_items),
    )


@router.put("/items/{item_id}", response_model=QuoteItemResponse)
async def update_quote_item(
    assignment_id: int,
    item_id: int,
    data: QuoteItemUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 수정
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    # 항목 조회
    item = db.query(QuoteItem).filter(
        QuoteItem.id == item_id,
        QuoteItem.assignment_id == assignment_id,
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="견적 항목을 찾을 수 없습니다."
        )

    # 필드 업데이트
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    # 금액 재계산
    item.amount = int(float(item.quantity) * item.unit_price)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote_item(
    assignment_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 삭제
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    # 항목 조회
    item = db.query(QuoteItem).filter(
        QuoteItem.id == item_id,
        QuoteItem.assignment_id == assignment_id,
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="견적 항목을 찾을 수 없습니다."
        )

    db.delete(item)
    db.commit()


@router.delete("/items", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_quote_items(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 모든 견적 항목 삭제
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id
    ).delete()
    db.commit()


@router.post("/calculate", response_model=QuoteSummary)
async def calculate_and_save(
    assignment_id: int,
    data: QuoteCalculateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 합계 계산 및 배정의 estimated_cost 업데이트
    """
    # 배정 확인
    assignment = get_assignment_or_404(db, assignment_id)

    # 견적 항목 조회
    items = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id
    ).order_by(asc(QuoteItem.sort_order), asc(QuoteItem.id)).all()

    # 합계 계산
    total_amount = sum(item.amount for item in items)

    # 배정의 estimated_cost 업데이트
    if data.update_assignment:
        assignment.estimated_cost = total_amount
        db.commit()

    return QuoteSummary(
        assignment_id=assignment_id,
        items=items,
        total_amount=total_amount,
        item_count=len(items),
    )


@router.post("/items/reorder", response_model=QuoteSummary)
async def reorder_quote_items(
    assignment_id: int,
    item_ids: list[int],
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 순서 변경

    item_ids: 새로운 순서대로 정렬된 항목 ID 목록
    """
    # 배정 확인
    get_assignment_or_404(db, assignment_id)

    # 기존 항목 조회
    items = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id,
        QuoteItem.id.in_(item_ids),
    ).all()

    # ID별 항목 매핑
    item_map = {item.id: item for item in items}

    # 순서 업데이트
    for order, item_id in enumerate(item_ids):
        if item_id in item_map:
            item_map[item_id].sort_order = order

    db.commit()

    # 결과 반환
    items = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id
    ).order_by(asc(QuoteItem.sort_order), asc(QuoteItem.id)).all()

    total_amount = sum(item.amount for item in items)

    return QuoteSummary(
        assignment_id=assignment_id,
        items=items,
        total_amount=total_amount,
        item_count=len(items),
    )


@router.get("/pdf")
async def download_quote_pdf(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적서 PDF 다운로드
    """
    # 배정 확인
    assignment = get_assignment_or_404(db, assignment_id)

    # 견적 항목 확인
    items_count = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id
    ).count()

    if items_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="견적 항목이 없습니다. 먼저 견적 항목을 추가해주세요."
        )

    try:
        # PDF 생성
        pdf_bytes = generate_quote_pdf(db, assignment_id)

        # 신청번호 조회하여 파일명 생성
        application = db.query(Application).filter(
            Application.id == assignment.application_id
        ).first()
        quote_number = f"{application.application_number}-Q{assignment_id}" if application else f"Q{assignment_id}"
        filename = get_quote_filename(quote_number)

        # PDF 응답
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF 생성 중 오류가 발생했습니다: {str(e)}"
        )
