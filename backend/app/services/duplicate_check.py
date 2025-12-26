"""
중복 체크 서비스

고객/협력사 중복 감지를 위한 서비스
- 신청(Application): 전화번호 + 진행 중인 상태로 중복 감지
- 협력사(Partner): 사업자번호 우선, 없으면 전화번호+회사명으로 중복 감지
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal

from sqlalchemy.orm import Session

from app.core.encryption import (
    generate_search_hash,
    generate_composite_hash,
    decrypt_value,
)
from app.models import Application, Partner


# =============================================================================
# 중복 체크 결과 데이터 클래스
# =============================================================================


@dataclass
class ApplicationDuplicateResult:
    """신청 중복 체크 결과"""
    is_duplicate: bool
    existing_id: Optional[int] = None
    existing_application_number: Optional[str] = None
    existing_status: Optional[str] = None
    existing_created_at: Optional[datetime] = None
    message: Optional[str] = None


@dataclass
class PartnerDuplicateResult:
    """협력사 중복 체크 결과"""
    is_duplicate: bool
    duplicate_type: Optional[Literal["business_number", "phone_company"]] = None
    existing_id: Optional[int] = None
    existing_company_name: Optional[str] = None
    existing_status: Optional[str] = None
    existing_created_at: Optional[datetime] = None
    message: Optional[str] = None


# =============================================================================
# 신청(Application) 중복 체크
# =============================================================================

# 중복으로 간주하는 상태 목록 (진행 중인 상태)
ACTIVE_APPLICATION_STATUSES = ["new", "consulting", "assigned", "scheduled"]


def check_application_duplicate(
    db: Session,
    phone: str,
) -> ApplicationDuplicateResult:
    """
    신청 중복 체크

    Args:
        db: 데이터베이스 세션
        phone: 고객 전화번호 (예: "010-1234-5678")

    Returns:
        ApplicationDuplicateResult: 중복 여부 및 기존 신청 정보

    중복 기준:
        - 동일 전화번호
        - 진행 중인 상태 (new, consulting, assigned, scheduled)
        - 완료(completed) 또는 취소(cancelled)된 신청은 중복으로 보지 않음
    """
    if not phone:
        return ApplicationDuplicateResult(is_duplicate=False)

    phone_hash = generate_search_hash(phone, "phone")
    if not phone_hash:
        return ApplicationDuplicateResult(is_duplicate=False)

    # 진행 중인 동일 전화번호 신청 조회
    existing = (
        db.query(Application)
        .filter(
            Application.phone_hash == phone_hash,
            Application.status.in_(ACTIVE_APPLICATION_STATUSES)
        )
        .order_by(Application.created_at.desc())
        .first()
    )

    if existing:
        return ApplicationDuplicateResult(
            is_duplicate=True,
            existing_id=existing.id,
            existing_application_number=existing.application_number,
            existing_status=existing.status,
            existing_created_at=existing.created_at,
            message=f"이 전화번호로 이미 진행 중인 신청이 있습니다. (신청번호: {existing.application_number})"
        )

    return ApplicationDuplicateResult(is_duplicate=False)


def get_customer_applications(
    db: Session,
    phone: str,
    limit: int = 10,
) -> list[Application]:
    """
    동일 전화번호의 모든 신청 목록 조회 (관리자용)

    Args:
        db: 데이터베이스 세션
        phone: 고객 전화번호
        limit: 최대 조회 건수

    Returns:
        신청 목록 (최신순)
    """
    if not phone:
        return []

    phone_hash = generate_search_hash(phone, "phone")
    if not phone_hash:
        return []

    return (
        db.query(Application)
        .filter(Application.phone_hash == phone_hash)
        .order_by(Application.created_at.desc())
        .limit(limit)
        .all()
    )


# =============================================================================
# 협력사(Partner) 중복 체크
# =============================================================================


def check_partner_duplicate(
    db: Session,
    phone: str,
    company_name: str,
    business_number: Optional[str] = None,
    exclude_id: Optional[int] = None,
) -> PartnerDuplicateResult:
    """
    협력사 중복 체크

    Args:
        db: 데이터베이스 세션
        phone: 연락처 (예: "010-1234-5678")
        company_name: 회사/상호명
        business_number: 사업자등록번호 (선택)
        exclude_id: 제외할 협력사 ID (수정 시 자기 자신 제외)

    Returns:
        PartnerDuplicateResult: 중복 여부 및 기존 협력사 정보

    중복 기준:
        1. 사업자번호가 있는 경우: 동일 사업자번호로 판단
        2. 사업자번호가 없는 경우: 전화번호 + 회사명 조합으로 판단
    """
    # 1. 사업자번호로 중복 체크 (있는 경우)
    if business_number:
        bn_hash = generate_search_hash(business_number, "business_number")
        if bn_hash:
            query = db.query(Partner).filter(Partner.business_number_hash == bn_hash)
            if exclude_id:
                query = query.filter(Partner.id != exclude_id)
            existing = query.first()

            if existing:
                return PartnerDuplicateResult(
                    is_duplicate=True,
                    duplicate_type="business_number",
                    existing_id=existing.id,
                    existing_company_name=existing.company_name,
                    existing_status=existing.status,
                    existing_created_at=existing.created_at,
                    message=f"이미 등록된 사업자등록번호입니다. (회사명: {existing.company_name})"
                )

    # 2. 전화번호 + 회사명 복합 해시로 중복 체크
    phone_company_hash = generate_composite_hash([
        (phone, "phone"),
        (company_name, "company_name")
    ])

    if phone_company_hash:
        query = db.query(Partner).filter(Partner.phone_company_hash == phone_company_hash)
        if exclude_id:
            query = query.filter(Partner.id != exclude_id)
        existing = query.first()

        if existing:
            return PartnerDuplicateResult(
                is_duplicate=True,
                duplicate_type="phone_company",
                existing_id=existing.id,
                existing_company_name=existing.company_name,
                existing_status=existing.status,
                existing_created_at=existing.created_at,
                message=f"이미 등록된 협력사입니다. (회사명: {existing.company_name})"
            )

    return PartnerDuplicateResult(is_duplicate=False)


def find_similar_partners(
    db: Session,
    phone: Optional[str] = None,
    company_name: Optional[str] = None,
    business_number: Optional[str] = None,
    exclude_id: Optional[int] = None,
    limit: int = 5,
) -> list[Partner]:
    """
    유사 협력사 검색 (관리자용)

    동일 전화번호 또는 동일 사업자번호를 가진 협력사 목록 반환

    Args:
        db: 데이터베이스 세션
        phone: 연락처
        company_name: 회사명
        business_number: 사업자등록번호
        exclude_id: 제외할 협력사 ID
        limit: 최대 결과 수

    Returns:
        유사 협력사 목록
    """
    results = []
    seen_ids = set()

    if exclude_id:
        seen_ids.add(exclude_id)

    # 1. 동일 사업자번호 검색
    if business_number:
        bn_hash = generate_search_hash(business_number, "business_number")
        if bn_hash:
            partners = (
                db.query(Partner)
                .filter(
                    Partner.business_number_hash == bn_hash,
                    Partner.id.notin_(seen_ids)
                )
                .limit(limit)
                .all()
            )
            for p in partners:
                if p.id not in seen_ids:
                    results.append(p)
                    seen_ids.add(p.id)

    # 2. 동일 전화번호 검색
    if phone and len(results) < limit:
        phone_hash = generate_search_hash(phone, "phone")
        if phone_hash:
            partners = (
                db.query(Partner)
                .filter(
                    Partner.phone_hash == phone_hash,
                    Partner.id.notin_(seen_ids)
                )
                .limit(limit - len(results))
                .all()
            )
            for p in partners:
                if p.id not in seen_ids:
                    results.append(p)
                    seen_ids.add(p.id)

    return results[:limit]
