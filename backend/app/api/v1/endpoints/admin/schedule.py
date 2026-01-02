"""
Admin Schedule API endpoints
관리자용 일정 관리 API
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value
from app.models.admin import Admin
from app.models.application import Application
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.partner import Partner
from app.services.service_utils import (
    convert_service_codes_with_map,
    get_service_code_to_name_map,
)

router = APIRouter(prefix="/schedule", tags=["Admin - Schedule"])


class ScheduleItem(BaseModel):
    """일정 아이템 (Application 기준 - 레거시)"""
    id: int
    application_number: str
    customer_name: str
    customer_phone: str
    address: str
    selected_services: list[str]
    status: str
    scheduled_date: str
    scheduled_time: Optional[str]
    assigned_partner_id: Optional[int]
    assigned_partner_name: Optional[str]

    model_config = {"from_attributes": True}


class ScheduleAssignmentItem(BaseModel):
    """일정 아이템 (Assignment 기준 - 권장)"""
    id: int  # assignment_id
    type: str = "assignment"
    application_id: int
    application_number: str
    customer_name: str
    customer_phone: str
    address: str
    partner_id: int
    partner_name: Optional[str]
    assigned_services: list[str]
    scheduled_date: str
    scheduled_time: Optional[str]
    status: str  # assignment status
    estimated_cost: Optional[int]
    quote_status: str

    model_config = {"from_attributes": True}


class ScheduleListResponse(BaseModel):
    """일정 목록 응답"""
    items: list  # ScheduleItem 또는 ScheduleAssignmentItem
    total: int


class MonthlyStats(BaseModel):
    """월간 일정 통계"""
    total_scheduled: int
    completed: int
    pending: int
    by_date: dict[str, int]  # 날짜별 일정 수


def decrypt_application_for_schedule(
    app: Application, service_map: dict[str, str], partner: Optional[Partner] = None
) -> dict:
    """일정용 신청 정보 복호화 및 서비스 코드→이름 변환"""
    # scheduled_date가 date 객체인 경우 문자열로 변환
    scheduled_date_str = None
    if app.scheduled_date:
        if isinstance(app.scheduled_date, date):
            scheduled_date_str = app.scheduled_date.isoformat()
        else:
            scheduled_date_str = str(app.scheduled_date)

    return {
        "id": app.id,
        "application_number": app.application_number,
        "customer_name": decrypt_value(app.customer_name),
        "customer_phone": decrypt_value(app.customer_phone),
        "address": decrypt_value(app.address),
        "selected_services": convert_service_codes_with_map(service_map, app.selected_services),
        "status": app.status,
        "scheduled_date": scheduled_date_str,
        "scheduled_time": app.scheduled_time,
        "assigned_partner_id": app.assigned_partner_id,
        "assigned_partner_name": decrypt_value(partner.company_name) if partner else None,
    }


async def get_schedule_by_assignment(
    start_date: str,
    end_date: str,
    status: Optional[str],
    partner_id: Optional[int],
    db: AsyncSession,
) -> ScheduleListResponse:
    """Assignment 기준 일정 조회 (내부 함수)"""
    query = select(ApplicationPartnerAssignment).where(
        ApplicationPartnerAssignment.scheduled_date.isnot(None),
        ApplicationPartnerAssignment.scheduled_date >= start_date,
        ApplicationPartnerAssignment.scheduled_date <= end_date,
    )

    # 상태 필터
    if status:
        query = query.where(ApplicationPartnerAssignment.status == status)
    else:
        query = query.where(ApplicationPartnerAssignment.status != "cancelled")

    # 협력사 필터
    if partner_id:
        query = query.where(ApplicationPartnerAssignment.partner_id == partner_id)

    # 정렬
    query = query.order_by(
        ApplicationPartnerAssignment.scheduled_date,
        ApplicationPartnerAssignment.scheduled_time,
    )

    result = await db.execute(query)
    assignments = result.scalars().all()

    # Application 및 Partner 정보 조회
    app_ids = set(a.application_id for a in assignments)
    partner_ids_set = set(a.partner_id for a in assignments)

    applications = {}
    if app_ids:
        app_query = select(Application).where(Application.id.in_(app_ids))
        app_result = await db.execute(app_query)
        app_list = app_result.scalars().all()
        applications = {a.id: a for a in app_list}

    partners = {}
    if partner_ids_set:
        partner_query = select(Partner).where(Partner.id.in_(partner_ids_set))
        partner_result = await db.execute(partner_query)
        partner_list = partner_result.scalars().all()
        partners = {p.id: p for p in partner_list}

    # 서비스 코드→이름 매핑 조회 (N+1 방지)
    service_map = await get_service_code_to_name_map(db)

    # 응답 생성
    items = []
    for assignment in assignments:
        app = applications.get(assignment.application_id)
        partner = partners.get(assignment.partner_id)

        if not app:
            continue

        scheduled_date_str = None
        if assignment.scheduled_date:
            if isinstance(assignment.scheduled_date, date):
                scheduled_date_str = assignment.scheduled_date.isoformat()
            else:
                scheduled_date_str = str(assignment.scheduled_date)

        items.append(ScheduleAssignmentItem(
            id=assignment.id,
            type="assignment",
            application_id=assignment.application_id,
            application_number=app.application_number,
            customer_name=decrypt_value(app.customer_name),
            customer_phone=decrypt_value(app.customer_phone),
            address=decrypt_value(app.address),
            partner_id=assignment.partner_id,
            partner_name=partner.company_name if partner else None,
            assigned_services=convert_service_codes_with_map(service_map, assignment.assigned_services),
            scheduled_date=scheduled_date_str,
            scheduled_time=assignment.scheduled_time,
            status=assignment.status,
            estimated_cost=assignment.estimated_cost,
            quote_status=assignment.quote_status,
        ))

    return ScheduleListResponse(items=items, total=len(items))


@router.get("", response_model=ScheduleListResponse)
async def get_schedule(
    start_date: str = Query(..., description="시작일 (YYYY-MM-DD)"),
    end_date: str = Query(..., description="종료일 (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="상태 필터"),
    partner_id: Optional[int] = Query(None, description="협력사 필터"),
    view_mode: str = Query("application", description="조회 모드: application(레거시) 또는 assignment(배정기준)"),
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    일정 목록 조회 (날짜 범위)

    - view_mode=application: Application.scheduled_date 기준 조회 (레거시, 기본값)
    - view_mode=assignment: Assignment.scheduled_date 기준 조회 (권장)
    """
    if view_mode == "assignment":
        # Assignment 기준 조회 (신규 - 권장)
        return await get_schedule_by_assignment(
            start_date=start_date,
            end_date=end_date,
            status=status,
            partner_id=partner_id,
            db=db,
        )

    # Application 기준 조회 (레거시 - 기존 동작 유지)
    query = select(Application).where(
        Application.scheduled_date.isnot(None),
        Application.scheduled_date >= start_date,
        Application.scheduled_date <= end_date,
    )

    # 상태 필터
    if status:
        query = query.where(Application.status == status)
    else:
        # 기본: 취소되지 않은 일정만
        query = query.where(Application.status != "cancelled")

    # 협력사 필터
    if partner_id:
        query = query.where(Application.assigned_partner_id == partner_id)

    # 정렬
    query = query.order_by(
        Application.scheduled_date,
        Application.scheduled_time,
    )

    result = await db.execute(query)
    applications = result.scalars().all()

    # 협력사 정보 조회
    partner_ids = set(app.assigned_partner_id for app in applications if app.assigned_partner_id)
    partners = {}
    if partner_ids:
        partner_query = select(Partner).where(Partner.id.in_(partner_ids))
        partner_result = await db.execute(partner_query)
        partner_list = partner_result.scalars().all()
        partners = {p.id: p for p in partner_list}

    # 서비스 코드→이름 매핑 조회 (N+1 방지)
    service_map = await get_service_code_to_name_map(db)

    # 복호화
    items = []
    for app in applications:
        partner = partners.get(app.assigned_partner_id) if app.assigned_partner_id else None
        items.append(ScheduleItem(**decrypt_application_for_schedule(app, service_map, partner)))

    return ScheduleListResponse(items=items, total=len(items))


@router.get("/monthly-stats", response_model=MonthlyStats)
async def get_monthly_stats(
    year: int = Query(..., description="연도"),
    month: int = Query(..., ge=1, le=12, description="월"),
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    월간 일정 통계 조회
    """
    # 해당 월의 시작일과 종료일
    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month + 1:02d}-01"

    # 해당 월의 일정 조회
    query = select(Application).where(
        Application.scheduled_date.isnot(None),
        Application.scheduled_date >= start_date,
        Application.scheduled_date < end_date,
        Application.status != "cancelled",
    )

    result = await db.execute(query)
    applications = result.scalars().all()

    # 통계 계산
    total_scheduled = len(applications)
    completed = sum(1 for app in applications if app.status == "completed")
    pending = total_scheduled - completed

    # 날짜별 일정 수
    by_date: dict[str, int] = {}
    for app in applications:
        # scheduled_date가 date 객체인 경우 문자열로 변환
        if isinstance(app.scheduled_date, date):
            date_str = app.scheduled_date.isoformat()
        else:
            date_str = str(app.scheduled_date)
        by_date[date_str] = by_date.get(date_str, 0) + 1

    return MonthlyStats(
        total_scheduled=total_scheduled,
        completed=completed,
        pending=pending,
        by_date=by_date,
    )


@router.get("/partners", response_model=list[dict])
async def get_available_partners(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    일정 배정 가능한 협력사 목록 조회
    """
    query = select(Partner).where(Partner.status == "approved")
    result = await db.execute(query)
    partners = result.scalars().all()

    return [
        {
            "id": p.id,
            "company_name": decrypt_value(p.company_name),
            "service_areas": p.service_areas or [],
        }
        for p in partners
    ]
