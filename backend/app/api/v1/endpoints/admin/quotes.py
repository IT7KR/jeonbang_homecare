"""
Quote Items API (Admin)
견적 항목 관리 API

- 배정별 견적 항목 CRUD
- 합계 계산 및 assignment 업데이트
- PDF 생성
"""

from typing import Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, func

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


async def get_assignment_or_404(db: AsyncSession, assignment_id: int) -> ApplicationPartnerAssignment:
    """배정 조회 (없으면 404)"""
    result = await db.execute(
        select(ApplicationPartnerAssignment).where(
            ApplicationPartnerAssignment.id == assignment_id
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="배정을 찾을 수 없습니다."
        )
    return assignment


async def update_assignment_estimated_cost(db: AsyncSession, assignment_id: int) -> int:
    """배정의 estimated_cost를 견적 항목 합계로 업데이트"""
    # 견적 항목 합계 계산
    result = await db.execute(
        select(QuoteItem).where(QuoteItem.assignment_id == assignment_id)
    )
    items = result.scalars().all()
    total_amount = sum(item.amount for item in items)

    # 배정 업데이트
    result = await db.execute(
        select(ApplicationPartnerAssignment).where(
            ApplicationPartnerAssignment.id == assignment_id
        )
    )
    assignment = result.scalar_one_or_none()
    if assignment:
        assignment.estimated_cost = total_amount
        await db.commit()

    return total_amount


@router.get("", response_model=QuoteSummary)
async def get_quote_items(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 견적 항목 목록 조회
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    # 견적 항목 조회 (정렬 순서대로)
    result = await db.execute(
        select(QuoteItem)
        .where(QuoteItem.assignment_id == assignment_id)
        .order_by(asc(QuoteItem.sort_order), asc(QuoteItem.id))
    )
    items = result.scalars().all()

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
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 추가
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    # 금액 계산
    amount = data.quantity * data.unit_price

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
    await db.commit()
    await db.refresh(item)

    # 배정의 estimated_cost 자동 업데이트
    await update_assignment_estimated_cost(db, assignment_id)

    return item


@router.post("/items/bulk", response_model=QuoteSummary, status_code=status.HTTP_201_CREATED)
async def create_quote_items_bulk(
    assignment_id: int,
    data: QuoteItemBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 일괄 추가
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    created_items = []
    for idx, item_data in enumerate(data.items):
        amount = item_data.quantity * item_data.unit_price
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

    await db.commit()
    for item in created_items:
        await db.refresh(item)

    # 배정의 estimated_cost 자동 업데이트 및 합계 계산
    total_amount = await update_assignment_estimated_cost(db, assignment_id)

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
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 수정
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    # 항목 조회
    result = await db.execute(
        select(QuoteItem).where(
            QuoteItem.id == item_id,
            QuoteItem.assignment_id == assignment_id,
        )
    )
    item = result.scalar_one_or_none()

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
    item.amount = item.quantity * item.unit_price

    await db.commit()
    await db.refresh(item)

    # 배정의 estimated_cost 자동 업데이트
    await update_assignment_estimated_cost(db, assignment_id)

    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote_item(
    assignment_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 삭제
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    # 항목 조회
    result = await db.execute(
        select(QuoteItem).where(
            QuoteItem.id == item_id,
            QuoteItem.assignment_id == assignment_id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="견적 항목을 찾을 수 없습니다."
        )

    await db.delete(item)
    await db.commit()

    # 배정의 estimated_cost 자동 업데이트
    await update_assignment_estimated_cost(db, assignment_id)


@router.delete("/items", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_quote_items(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 모든 견적 항목 삭제
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    # 삭제할 항목 조회
    result = await db.execute(
        select(QuoteItem).where(QuoteItem.assignment_id == assignment_id)
    )
    items = result.scalars().all()

    # 항목 삭제
    for item in items:
        await db.delete(item)

    await db.commit()


@router.post("/calculate", response_model=QuoteSummary)
async def calculate_and_save(
    assignment_id: int,
    data: QuoteCalculateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 합계 계산 및 배정의 estimated_cost 업데이트
    """
    # 배정 확인
    assignment = await get_assignment_or_404(db, assignment_id)

    # 견적 항목 조회
    result = await db.execute(
        select(QuoteItem)
        .where(QuoteItem.assignment_id == assignment_id)
        .order_by(asc(QuoteItem.sort_order), asc(QuoteItem.id))
    )
    items = result.scalars().all()

    # 합계 계산
    total_amount = sum(item.amount for item in items)

    # 배정의 estimated_cost 업데이트
    if data.update_assignment:
        assignment.estimated_cost = total_amount
        await db.commit()

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
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적 항목 순서 변경

    item_ids: 새로운 순서대로 정렬된 항목 ID 목록
    """
    # 배정 확인
    await get_assignment_or_404(db, assignment_id)

    # 기존 항목 조회
    result = await db.execute(
        select(QuoteItem).where(
            QuoteItem.assignment_id == assignment_id,
            QuoteItem.id.in_(item_ids),
        )
    )
    items = result.scalars().all()

    # ID별 항목 매핑
    item_map = {item.id: item for item in items}

    # 순서 업데이트
    for order, item_id in enumerate(item_ids):
        if item_id in item_map:
            item_map[item_id].sort_order = order

    await db.commit()

    # 결과 반환
    result = await db.execute(
        select(QuoteItem)
        .where(QuoteItem.assignment_id == assignment_id)
        .order_by(asc(QuoteItem.sort_order), asc(QuoteItem.id))
    )
    items = result.scalars().all()

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
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    견적서 PDF 다운로드
    """
    # 배정 확인
    assignment = await get_assignment_or_404(db, assignment_id)

    # 견적 항목 확인
    count_result = await db.execute(
        select(func.count()).select_from(QuoteItem).where(
            QuoteItem.assignment_id == assignment_id
        )
    )
    items_count = count_result.scalar() or 0

    if items_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="견적 항목이 없습니다. 먼저 견적 항목을 추가해주세요."
        )

    try:
        # PDF 생성 (비동기 함수)
        pdf_bytes = await generate_quote_pdf(db, assignment_id)

        # 신청번호 조회하여 파일명 생성
        result = await db.execute(
            select(Application).where(Application.id == assignment.application_id)
        )
        application = result.scalar_one_or_none()
        quote_number = f"{application.application_number}-Q{assignment_id}" if application else f"Q{assignment_id}"
        filename = get_quote_filename(quote_number)

        # PDF 응답 (RFC 5987 인코딩으로 한글 파일명 지원)
        encoded_filename = quote(filename)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
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
