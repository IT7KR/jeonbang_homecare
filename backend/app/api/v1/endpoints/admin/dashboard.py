"""
Admin Dashboard API
관리자 대시보드 API
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.application import Application
from app.models.partner import Partner

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])


class DashboardStats(BaseModel):
    """대시보드 통계"""

    # 신청 통계
    applications_total: int
    applications_new: int
    applications_consulting: int
    applications_assigned: int
    applications_scheduled: int
    applications_completed: int
    applications_today: int
    applications_this_week: int

    # 협력사 통계
    partners_total: int
    partners_pending: int
    partners_approved: int
    partners_this_month: int


class RecentApplication(BaseModel):
    """최근 신청"""

    id: int
    application_number: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RecentPartner(BaseModel):
    """최근 협력사"""

    id: int
    company_name: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    """대시보드 응답"""

    stats: DashboardStats
    recent_applications: list[RecentApplication]
    recent_partners: list[RecentPartner]


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    대시보드 데이터 조회
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    # 신청 통계
    applications_total = db.query(func.count(Application.id)).scalar() or 0

    # 상태별 신청 수
    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )
    status_map = dict(status_counts)

    # 기간별 신청 수
    applications_today = (
        db.query(func.count(Application.id))
        .filter(Application.created_at >= today_start)
        .scalar() or 0
    )

    applications_this_week = (
        db.query(func.count(Application.id))
        .filter(Application.created_at >= week_start)
        .scalar() or 0
    )

    # 협력사 통계
    partners_total = db.query(func.count(Partner.id)).scalar() or 0

    partner_status_counts = (
        db.query(Partner.status, func.count(Partner.id))
        .group_by(Partner.status)
        .all()
    )
    partner_status_map = dict(partner_status_counts)

    partners_this_month = (
        db.query(func.count(Partner.id))
        .filter(Partner.created_at >= month_start)
        .scalar() or 0
    )

    # 최근 신청 (5건)
    recent_applications = (
        db.query(Application)
        .order_by(Application.created_at.desc())
        .limit(5)
        .all()
    )

    # 최근 협력사 (5건)
    recent_partners = (
        db.query(Partner)
        .order_by(Partner.created_at.desc())
        .limit(5)
        .all()
    )

    stats = DashboardStats(
        applications_total=applications_total,
        applications_new=status_map.get("new", 0),
        applications_consulting=status_map.get("consulting", 0),
        applications_assigned=status_map.get("assigned", 0),
        applications_scheduled=status_map.get("scheduled", 0),
        applications_completed=status_map.get("completed", 0),
        applications_today=applications_today,
        applications_this_week=applications_this_week,
        partners_total=partners_total,
        partners_pending=partner_status_map.get("pending", 0),
        partners_approved=partner_status_map.get("approved", 0),
        partners_this_month=partners_this_month,
    )

    return DashboardResponse(
        stats=stats,
        recent_applications=[
            RecentApplication.model_validate(a) for a in recent_applications
        ],
        recent_partners=[
            RecentPartner.model_validate(p) for p in recent_partners
        ],
    )
