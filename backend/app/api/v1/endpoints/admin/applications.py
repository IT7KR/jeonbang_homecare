"""
Admin Application API endpoints
관리자용 신청 관리 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional
from datetime import datetime, timezone
import math

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value
from app.models.admin import Admin
from app.models.application import Application
from app.schemas.application import (
    ApplicationListResponse,
    ApplicationListItem,
    ApplicationDetailResponse,
    ApplicationUpdate,
)

router = APIRouter(prefix="/applications", tags=["Admin - Applications"])


def decrypt_application(app: Application) -> dict:
    """Application 모델의 암호화된 필드를 복호화"""
    return {
        "id": app.id,
        "application_number": app.application_number,
        "customer_name": decrypt_value(app.customer_name),
        "customer_phone": decrypt_value(app.customer_phone),
        "address": decrypt_value(app.address),
        "address_detail": decrypt_value(app.address_detail) if app.address_detail else None,
        "selected_services": app.selected_services or [],
        "description": app.description,
        "photos": app.photos or [],
        "status": app.status,
        "assigned_partner_id": app.assigned_partner_id,
        "assigned_admin_id": app.assigned_admin_id,
        "scheduled_date": str(app.scheduled_date) if app.scheduled_date else None,
        "scheduled_time": app.scheduled_time,
        "estimated_cost": app.estimated_cost,
        "final_cost": app.final_cost,
        "admin_memo": app.admin_memo,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "completed_at": app.completed_at,
        "cancelled_at": app.cancelled_at,
    }


@router.get("", response_model=ApplicationListResponse)
def get_applications(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    status: Optional[str] = Query(None, description="상태 필터"),
    search: Optional[str] = Query(None, description="검색어 (신청번호)"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 목록 조회 (관리자용)

    - 페이징 지원
    - 상태 필터링
    - 신청번호 검색
    """
    query = db.query(Application)

    # 상태 필터
    if status:
        query = query.filter(Application.status == status)

    # 검색 (신청번호)
    if search:
        query = query.filter(Application.application_number.ilike(f"%{search}%"))

    # 전체 개수
    total = query.count()

    # 정렬 및 페이징
    applications = (
        query.order_by(desc(Application.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # 복호화된 목록 생성
    items = []
    for app in applications:
        decrypted = decrypt_application(app)
        items.append(ApplicationListItem(
            id=decrypted["id"],
            application_number=decrypted["application_number"],
            customer_name=decrypted["customer_name"],
            customer_phone=decrypted["customer_phone"],
            address=decrypted["address"],
            selected_services=decrypted["selected_services"],
            status=decrypted["status"],
            assigned_partner_id=decrypted["assigned_partner_id"],
            scheduled_date=decrypted["scheduled_date"],
            created_at=decrypted["created_at"],
        ))

    return ApplicationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 상세 조회 (관리자용)
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    decrypted = decrypt_application(application)
    return ApplicationDetailResponse(**decrypted)


@router.put("/{application_id}", response_model=ApplicationDetailResponse)
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 수정 (관리자용)

    - 상태 변경
    - 파트너 배정
    - 일정 설정
    - 비용 설정
    - 관리자 메모
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    # 필드 업데이트 (None이 아닌 값만)
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            # 상태 변경 시 타임스탬프 기록
            if field == "status":
                if value == "completed" and application.status != "completed":
                    application.completed_at = datetime.now(timezone.utc)
                elif value == "cancelled" and application.status != "cancelled":
                    application.cancelled_at = datetime.now(timezone.utc)

            setattr(application, field, value)

    # 담당 관리자 자동 설정
    if data.status or data.assigned_partner_id:
        application.assigned_admin_id = current_admin.id

    db.commit()
    db.refresh(application)

    decrypted = decrypt_application(application)
    return ApplicationDetailResponse(**decrypted)


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 삭제 (관리자용)

    - 실제 삭제가 아닌 취소 처리 권장
    - super_admin만 실제 삭제 가능
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    # super_admin만 삭제 가능
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다. 취소 처리를 이용해주세요.")

    db.delete(application)
    db.commit()

    return {"success": True, "message": "신청이 삭제되었습니다"}
