"""
Admin Partner API endpoints
관리자용 협력사 관리 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime, timezone
import math

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value
from app.models.admin import Admin
from app.models.partner import Partner
from app.schemas.partner import (
    PartnerListResponse,
    PartnerListItem,
    PartnerDetailResponse,
    PartnerUpdate,
    PartnerApprove,
)

router = APIRouter(prefix="/partners", tags=["Admin - Partners"])


def decrypt_partner(partner: Partner) -> dict:
    """Partner 모델의 암호화된 필드를 복호화"""
    return {
        "id": partner.id,
        "company_name": partner.company_name,
        "representative_name": decrypt_value(partner.representative_name),
        "business_number": decrypt_value(partner.business_number) if partner.business_number else None,
        "contact_phone": decrypt_value(partner.contact_phone),
        "contact_email": decrypt_value(partner.contact_email) if partner.contact_email else None,
        "address": decrypt_value(partner.address),
        "address_detail": decrypt_value(partner.address_detail) if partner.address_detail else None,
        "service_areas": partner.service_areas or [],
        "work_regions": partner.work_regions or [],
        "introduction": partner.introduction,
        "experience": partner.experience,
        "remarks": partner.remarks,
        "status": partner.status,
        "approved_by": partner.approved_by,
        "approved_at": partner.approved_at,
        "rejection_reason": partner.rejection_reason,
        "admin_memo": partner.admin_memo,
        "created_at": partner.created_at,
        "updated_at": partner.updated_at,
    }


@router.get("", response_model=PartnerListResponse)
def get_partners(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    status: Optional[str] = Query(None, description="상태 필터"),
    search: Optional[str] = Query(None, description="검색어 (회사명)"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 목록 조회 (관리자용)

    - 페이징 지원
    - 상태 필터링
    - 회사명 검색
    """
    query = db.query(Partner)

    # 상태 필터
    if status:
        query = query.filter(Partner.status == status)

    # 검색 (회사명)
    if search:
        query = query.filter(Partner.company_name.ilike(f"%{search}%"))

    # 전체 개수
    total = query.count()

    # 정렬 및 페이징
    partners = (
        query.order_by(desc(Partner.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # 복호화된 목록 생성
    items = []
    for partner in partners:
        decrypted = decrypt_partner(partner)
        items.append(PartnerListItem(
            id=decrypted["id"],
            company_name=decrypted["company_name"],
            representative_name=decrypted["representative_name"],
            contact_phone=decrypted["contact_phone"],
            service_areas=decrypted["service_areas"],
            status=decrypted["status"],
            created_at=decrypted["created_at"],
        ))

    return PartnerListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{partner_id}", response_model=PartnerDetailResponse)
def get_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 상세 조회 (관리자용)
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    decrypted = decrypt_partner(partner)
    return PartnerDetailResponse(**decrypted)


@router.put("/{partner_id}", response_model=PartnerDetailResponse)
def update_partner(
    partner_id: int,
    data: PartnerUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 수정 (관리자용)

    - 상태 변경
    - 거절 사유
    - 관리자 메모
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    # 필드 업데이트
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            # 상태 변경 시 승인 정보 기록
            if field == "status" and value == "approved":
                partner.approved_by = current_admin.id
                partner.approved_at = datetime.now(timezone.utc)

            setattr(partner, field, value)

    db.commit()
    db.refresh(partner)

    decrypted = decrypt_partner(partner)
    return PartnerDetailResponse(**decrypted)


@router.post("/{partner_id}/approve", response_model=PartnerDetailResponse)
def approve_partner(
    partner_id: int,
    data: PartnerApprove,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 승인/거절 (관리자용)

    - action: approve / reject
    - rejection_reason: 거절 시 사유 (필수)
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    if partner.status != "pending":
        raise HTTPException(status_code=400, detail="대기 중인 협력사만 승인/거절할 수 있습니다")

    if data.action == "approve":
        partner.status = "approved"
        partner.approved_by = current_admin.id
        partner.approved_at = datetime.now(timezone.utc)
    else:  # reject
        if not data.rejection_reason:
            raise HTTPException(status_code=400, detail="거절 사유를 입력해주세요")
        partner.status = "rejected"
        partner.rejection_reason = data.rejection_reason
        partner.approved_by = current_admin.id

    db.commit()
    db.refresh(partner)

    decrypted = decrypt_partner(partner)
    return PartnerDetailResponse(**decrypted)


@router.delete("/{partner_id}")
def delete_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 삭제 (관리자용)

    - super_admin만 삭제 가능
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    # super_admin만 삭제 가능
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다. 비활성화를 이용해주세요.")

    db.delete(partner)
    db.commit()

    return {"success": True, "message": "협력사가 삭제되었습니다"}
