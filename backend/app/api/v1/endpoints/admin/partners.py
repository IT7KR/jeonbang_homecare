"""
Admin Partner API endpoints
관리자용 협력사 관리 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional, List
from datetime import datetime, timezone, date
import math
import logging

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value
from app.core.file_token import get_file_url
from app.models.admin import Admin
from app.models.partner import Partner
from app.models.partner_note import PartnerNote
from app.schemas.partner import (
    PartnerListResponse,
    PartnerListItem,
    PartnerDetailResponse,
    PartnerUpdate,
    PartnerApprove,
)
from app.schemas.partner_note import (
    PartnerNoteCreate,
    PartnerNoteResponse,
    PartnerNotesResponse,
    PartnerStatusChange,
)
from app.services.sms import send_partner_approval_notification
from app.services.search_index import unified_search, detect_search_type
from app.services.audit import log_status_change
from app.services.duplicate_check import find_similar_partners

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/partners", tags=["Admin - Partners"])

# 상태 레이블 (한글)
STATUS_LABELS = {
    "pending": "대기중",
    "approved": "승인됨",
    "rejected": "거절됨",
    "active": "활성",
    "inactive": "비활성",
    "suspended": "일시중지",
}


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
        # 파일 경로를 토큰 기반 URL로 변환 (실제 경로 숨김)
        "business_registration_file": get_file_url(partner.business_registration_file),
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
    search: Optional[str] = Query(None, description="통합 검색어 (회사명/대표자명/연락처)"),
    search_type: Optional[str] = Query(None, description="검색 타입 (auto/company/name/phone)"),
    date_from: Optional[date] = Query(None, description="등록일 시작"),
    date_to: Optional[date] = Query(None, description="등록일 종료"),
    services: Optional[str] = Query(None, description="서비스 분야 필터 (콤마 구분)"),
    region: Optional[str] = Query(None, description="활동 지역 필터"),
    approved_by: Optional[int] = Query(None, description="승인 관리자 ID"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 목록 조회 (관리자용)

    - 페이징 지원
    - 상태 필터링
    - 통합 검색 (회사명/대표자명/연락처 자동 감지)
    - 날짜 범위 필터
    - 서비스 분야 필터
    - 활동 지역 필터
    """
    query = db.query(Partner)

    # 상태 필터
    if status:
        query = query.filter(Partner.status == status)

    # 통합 검색
    if search:
        # 검색 타입 자동 감지 또는 지정된 타입 사용
        if search_type == "company":
            # 회사명 검색 (DB 직접 검색)
            query = query.filter(Partner.company_name.ilike(f"%{search}%"))
        else:
            detected_type = search_type if search_type and search_type != "auto" else detect_search_type(search)

            if detected_type in ("phone", "name"):
                # 암호화된 필드 검색 (인덱스 테이블 사용)
                matching_ids = unified_search(db, "partner", search, detected_type)
                if matching_ids:
                    query = query.filter(Partner.id.in_(matching_ids))
                else:
                    # 인덱스에서 결과가 없으면 회사명에서도 검색 시도
                    query = query.filter(Partner.company_name.ilike(f"%{search}%"))
            else:
                # 기본: 회사명 검색
                query = query.filter(Partner.company_name.ilike(f"%{search}%"))

    # 날짜 범위 필터
    if date_from:
        query = query.filter(Partner.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(Partner.created_at <= datetime.combine(date_to, datetime.max.time()))

    # 서비스 분야 필터 (JSONB 배열에서 검색)
    if services:
        service_list = [s.strip() for s in services.split(",") if s.strip()]
        if service_list:
            service_conditions = [
                Partner.service_areas.contains([svc])
                for svc in service_list
            ]
            query = query.filter(or_(*service_conditions))

    # 활동 지역 필터 (work_regions JSONB에서 검색)
    if region:
        # work_regions 형식: [{"province": "경기도", "district": "양평군"}, ...]
        # PostgreSQL JSONB 텍스트 변환 후 검색
        from sqlalchemy import cast, String
        query = query.filter(
            cast(Partner.work_regions, String).ilike(f"%{region}%")
        )

    # 승인 관리자 필터
    if approved_by:
        query = query.filter(Partner.approved_by == approved_by)

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


@router.get("/{partner_id}/similar-partners")
def get_similar_partners(
    partner_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    유사 협력사 조회 (관리자용)

    해당 협력사와 동일한 전화번호 또는 사업자등록번호를 가진 협력사 목록 조회
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    # 협력사 정보 복호화
    decrypted = decrypt_partner(partner)
    phone = decrypted.get("contact_phone")
    business_number = decrypted.get("business_number")

    # 유사 협력사 검색
    similar = find_similar_partners(
        db=db,
        phone=phone,
        business_number=business_number,
        exclude_id=partner_id,
        limit=5,
    )

    # 결과 구성
    items = []
    for p in similar:
        p_decrypted = decrypt_partner(p)
        items.append({
            "id": p_decrypted["id"],
            "company_name": p_decrypted["company_name"],
            "representative_name": p_decrypted["representative_name"],
            "contact_phone": p_decrypted["contact_phone"],
            "business_number": p_decrypted["business_number"],
            "status": p_decrypted["status"],
            "status_label": STATUS_LABELS.get(p_decrypted["status"], p_decrypted["status"]),
            "created_at": p_decrypted["created_at"],
        })

    return {
        "partner_id": partner_id,
        "company_name": decrypted["company_name"],
        "similar_partners": items,
        "total": len(items),
    }


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
async def approve_partner(
    partner_id: int,
    data: PartnerApprove,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 승인/거절 (관리자용)

    - action: approve / reject
    - rejection_reason: 거절 시 사유 (필수)
    - send_sms: SMS 발송 여부 (기본: True)
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    is_approved = data.action == "approve"

    if is_approved:
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

    # SMS 발송 (기본값: True)
    send_sms = getattr(data, 'send_sms', True)
    if send_sms:
        partner_phone = decrypt_value(partner.contact_phone)
        partner_name = partner.company_name or decrypt_value(partner.representative_name)
        background_tasks.add_task(
            send_partner_approval_notification,
            partner_phone,
            partner_name,
            is_approved,
            data.rejection_reason if not is_approved else None,
            partner.company_name or "",
        )
        logger.info(f"SMS scheduled: partner {'approval' if is_approved else 'rejection'} for {partner.company_name}")

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


# ===== 메모 히스토리 API =====

@router.get("/{partner_id}/notes", response_model=PartnerNotesResponse)
def get_partner_notes(
    partner_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 메모/히스토리 목록 조회

    - 최신순 정렬
    - 메모 + 상태변경 이력 포함
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    notes = (
        db.query(PartnerNote)
        .filter(PartnerNote.partner_id == partner_id)
        .order_by(desc(PartnerNote.created_at))
        .all()
    )

    return PartnerNotesResponse(
        items=[PartnerNoteResponse.model_validate(note) for note in notes],
        total=len(notes),
    )


@router.post("/{partner_id}/notes", response_model=PartnerNoteResponse)
def create_partner_note(
    partner_id: int,
    data: PartnerNoteCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 메모 추가

    - 관리자 메모 히스토리로 저장
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    note = PartnerNote(
        partner_id=partner_id,
        admin_id=current_admin.id,
        admin_name=current_admin.name,
        note_type="memo",
        content=data.content,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return PartnerNoteResponse.model_validate(note)


@router.delete("/{partner_id}/notes/{note_id}")
def delete_partner_note(
    partner_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 관리자 메모 삭제

    - 본인이 작성한 메모만 삭제 가능
    - super_admin은 모든 메모 삭제 가능
    - memo 타입만 삭제 가능 (status_change, system 타입은 삭제 불가)
    """
    note = db.query(PartnerNote).filter(
        PartnerNote.id == note_id,
        PartnerNote.partner_id == partner_id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다")

    # memo 타입만 삭제 가능
    if note.note_type != "memo":
        raise HTTPException(status_code=400, detail="시스템 메모는 삭제할 수 없습니다")

    # 권한 확인
    if note.admin_id != current_admin.id and current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="본인이 작성한 메모만 삭제할 수 있습니다")

    db.delete(note)
    db.commit()

    return {"success": True, "message": "메모가 삭제되었습니다"}


# ===== 상태 변경 API =====

@router.post("/{partner_id}/status", response_model=PartnerDetailResponse)
async def change_partner_status(
    partner_id: int,
    data: PartnerStatusChange,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    협력사 상태 변경 (어떤 상태에서든 변경 가능)

    - new_status: pending, approved, rejected, active, inactive, suspended
    - reason: 상태 변경 사유
    - send_sms: SMS 발송 여부 (기본: True)
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()

    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")

    old_status = partner.status
    new_status = data.new_status

    # 같은 상태로 변경 시 무시
    if old_status == new_status:
        raise HTTPException(status_code=400, detail="현재 상태와 동일합니다")

    # 상태 변경
    partner.status = new_status

    # 승인 시 승인 정보 기록
    if new_status == "approved":
        partner.approved_by = current_admin.id
        partner.approved_at = datetime.now(timezone.utc)

    # 거절 시 거절 사유 기록
    if new_status == "rejected" and data.reason:
        partner.rejection_reason = data.reason

    db.commit()
    db.refresh(partner)

    # Audit Log에 상태 변경 이력 저장
    log_status_change(
        db=db,
        entity_type="partner",
        entity_id=partner_id,
        old_status=old_status,
        new_status=new_status,
        admin=current_admin,
    )
    db.commit()

    # SMS 발송 (승인/거절 시)
    if data.send_sms and new_status in ["approved", "rejected"]:
        partner_phone = decrypt_value(partner.contact_phone)
        partner_name = partner.company_name or decrypt_value(partner.representative_name)
        is_approved = new_status == "approved"
        background_tasks.add_task(
            send_partner_approval_notification,
            partner_phone,
            partner_name,
            is_approved,
            data.reason if not is_approved else None,
            partner.company_name or "",
        )
        logger.info(f"SMS scheduled: partner status change to {new_status} for {partner.company_name}")

    decrypted = decrypt_partner(partner)
    return PartnerDetailResponse(**decrypted)
