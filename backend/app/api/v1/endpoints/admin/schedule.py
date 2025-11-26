"""
Admin Schedule API endpoints
관리자용 일정 관리 API
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value
from app.models.admin import Admin
from app.models.application import Application
from app.models.partner import Partner

router = APIRouter(prefix="/schedule", tags=["Admin - Schedule"])


class ScheduleItem(BaseModel):
    """일정 아이템"""
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


class ScheduleListResponse(BaseModel):
    """일정 목록 응답"""
    items: list[ScheduleItem]
    total: int


class MonthlyStats(BaseModel):
    """월간 일정 통계"""
    total_scheduled: int
    completed: int
    pending: int
    by_date: dict[str, int]  # 날짜별 일정 수


def decrypt_application_for_schedule(app: Application, partner: Optional[Partner] = None) -> dict:
    """일정용 신청 정보 복호화"""
    return {
        "id": app.id,
        "application_number": app.application_number,
        "customer_name": decrypt_value(app.customer_name),
        "customer_phone": decrypt_value(app.customer_phone),
        "address": decrypt_value(app.address),
        "selected_services": app.selected_services or [],
        "status": app.status,
        "scheduled_date": app.scheduled_date,
        "scheduled_time": app.scheduled_time,
        "assigned_partner_id": app.assigned_partner_id,
        "assigned_partner_name": decrypt_value(partner.company_name) if partner else None,
    }


@router.get("", response_model=ScheduleListResponse)
def get_schedule(
    start_date: str = Query(..., description="시작일 (YYYY-MM-DD)"),
    end_date: str = Query(..., description="종료일 (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="상태 필터"),
    partner_id: Optional[int] = Query(None, description="파트너 필터"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    일정 목록 조회 (날짜 범위)
    """
    query = db.query(Application).filter(
        Application.scheduled_date.isnot(None),
        Application.scheduled_date >= start_date,
        Application.scheduled_date <= end_date,
    )

    # 상태 필터
    if status:
        query = query.filter(Application.status == status)
    else:
        # 기본: 취소되지 않은 일정만
        query = query.filter(Application.status != "cancelled")

    # 파트너 필터
    if partner_id:
        query = query.filter(Application.assigned_partner_id == partner_id)

    # 정렬
    applications = query.order_by(
        Application.scheduled_date,
        Application.scheduled_time,
    ).all()

    # 파트너 정보 조회
    partner_ids = set(app.assigned_partner_id for app in applications if app.assigned_partner_id)
    partners = {}
    if partner_ids:
        partner_list = db.query(Partner).filter(Partner.id.in_(partner_ids)).all()
        partners = {p.id: p for p in partner_list}

    # 복호화
    items = []
    for app in applications:
        partner = partners.get(app.assigned_partner_id) if app.assigned_partner_id else None
        items.append(ScheduleItem(**decrypt_application_for_schedule(app, partner)))

    return ScheduleListResponse(items=items, total=len(items))


@router.get("/monthly-stats", response_model=MonthlyStats)
def get_monthly_stats(
    year: int = Query(..., description="연도"),
    month: int = Query(..., ge=1, le=12, description="월"),
    db: Session = Depends(get_db),
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
    applications = db.query(Application).filter(
        Application.scheduled_date.isnot(None),
        Application.scheduled_date >= start_date,
        Application.scheduled_date < end_date,
        Application.status != "cancelled",
    ).all()

    # 통계 계산
    total_scheduled = len(applications)
    completed = sum(1 for app in applications if app.status == "completed")
    pending = total_scheduled - completed

    # 날짜별 일정 수
    by_date: dict[str, int] = {}
    for app in applications:
        date_str = app.scheduled_date
        by_date[date_str] = by_date.get(date_str, 0) + 1

    return MonthlyStats(
        total_scheduled=total_scheduled,
        completed=completed,
        pending=pending,
        by_date=by_date,
    )


@router.get("/partners", response_model=list[dict])
def get_available_partners(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    일정 배정 가능한 파트너 목록 조회
    """
    partners = db.query(Partner).filter(Partner.status == "approved").all()

    return [
        {
            "id": p.id,
            "company_name": decrypt_value(p.company_name),
            "service_areas": p.service_areas or [],
        }
        for p in partners
    ]
