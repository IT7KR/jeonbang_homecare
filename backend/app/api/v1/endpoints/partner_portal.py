"""
Partner Portal API endpoints
협력사 포털 - 배정 정보 열람 API

인증 없이 토큰 기반으로 신청 정보를 열람할 수 있는 협력사용 엔드포인트
"""

import hashlib
import logging
import os
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.encryption import decrypt_value
from app.core.file_token import encode_file_token, decode_file_token_extended, FileTokenInfo
from app.core.config import settings
from app.models.application import Application
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.partner import Partner
from app.models.revoked_token import RevokedToken
from app.schemas.partner_portal import (
    PartnerViewResponse,
    PartnerViewPhoto,
    PartnerViewTokenResponse,
    PartnerViewTokenRequest,
)

router = APIRouter(prefix="/partner-portal", tags=["Partner Portal"])
logger = logging.getLogger(__name__)


def mask_name(name: str) -> str:
    """
    이름 마스킹 (홍길동 → 홍**)

    Args:
        name: 원본 이름

    Returns:
        마스킹된 이름
    """
    if not name:
        return ""
    if len(name) == 1:
        return "*"
    if len(name) == 2:
        return name[0] + "*"
    return name[0] + "*" * (len(name) - 1)


def extract_partial_address(address: str) -> str:
    """
    주소에서 동/리까지만 추출

    Args:
        address: 전체 주소

    Returns:
        동/리까지의 부분 주소
    """
    if not address:
        return ""

    # 동/리/읍/면 패턴 매칭
    patterns = [
        r"(.+?[동리읍면])\s",  # 동/리/읍/면 + 공백
        r"(.+?[동리읍면])$",   # 동/리/읍/면으로 끝나는 경우
        r"(.+?[로길])\s*\d+",  # 도로명 주소 (XX로/길 + 번호)
    ]

    for pattern in patterns:
        match = re.search(pattern, address)
        if match:
            return match.group(1)

    # 패턴이 없으면 앞 30자까지만 표시
    return address[:30] + "..." if len(address) > 30 else address


def generate_partner_view_token(
    assignment_id: int,
    expires_in_days: int = 7,
) -> str:
    """
    협력사 열람용 토큰 생성

    Args:
        assignment_id: 배정 ID
        expires_in_days: 토큰 유효 기간 (일)

    Returns:
        생성된 토큰
    """
    expires_in_seconds = expires_in_days * 24 * 60 * 60

    # 가상 경로 생성 (실제 파일이 아닌 식별자 역할)
    virtual_path = f"/partner-view/assignment/{assignment_id}"

    return encode_file_token(
        file_path=virtual_path,
        expires_in=expires_in_seconds,
        entity_type="assignment",
        entity_id=assignment_id,
        requires_auth=False,  # 협력사 열람은 인증 불필요
    )


def validate_partner_view_token(token: str) -> Optional[int]:
    """
    협력사 열람 토큰 검증

    Args:
        token: 토큰 문자열

    Returns:
        유효한 경우 assignment_id, 그렇지 않으면 None
    """
    result = decode_file_token_extended(token)

    if isinstance(result, str):
        # 에러 메시지 반환됨
        logger.warning(f"Partner view token validation failed: {result}")
        return None

    # FileTokenInfo 객체 확인
    if result.entity_type != "assignment" or result.entity_id is None:
        logger.warning(f"Invalid token entity type: {result.entity_type}")
        return None

    return result.entity_id


def hash_token(token: str) -> str:
    """
    토큰을 SHA256으로 해시

    Args:
        token: 토큰 문자열

    Returns:
        해시된 토큰 (64자리 hex)
    """
    return hashlib.sha256(token.encode()).hexdigest()


def is_token_revoked(db: Session, token: str) -> bool:
    """
    토큰이 블랙리스트에 있는지 확인

    Args:
        db: 데이터베이스 세션
        token: 토큰 문자열

    Returns:
        블랙리스트에 있으면 True
    """
    token_hash = hash_token(token)
    return db.query(RevokedToken).filter(
        RevokedToken.token_hash == token_hash
    ).first() is not None


@router.get("/view/{token}", response_model=PartnerViewResponse)
async def view_assignment(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    협력사용 배정 정보 열람

    토큰을 검증하고 배정된 신청 정보를 반환합니다.
    고객 개인정보는 마스킹 처리됩니다.

    - **token**: 배정 열람 토큰 (SMS로 전달됨)
    """
    # 블랙리스트 확인 (먼저 체크)
    if is_token_revoked(db, token):
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
        )

    # 토큰 검증
    assignment_id = validate_partner_view_token(token)
    if assignment_id is None:
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
        )

    # 배정 정보 조회
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="배정 정보를 찾을 수 없습니다."
        )

    # 신청 정보 조회
    application = db.query(Application).filter(
        Application.id == assignment.application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="신청 정보를 찾을 수 없습니다."
        )

    # IP 로깅 (감사 추적)
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        f"Partner portal access: assignment={assignment_id}, "
        f"application={application.application_number}, ip={client_ip}"
    )

    # 고객 정보 복호화 및 마스킹
    customer_name = decrypt_value(application.customer_name) or ""
    address = decrypt_value(application.address) or ""

    customer_name_masked = mask_name(customer_name)
    address_partial = extract_partial_address(address)

    # 사진 URL 토큰화
    photos = []
    if application.photos:
        for photo_path in application.photos:
            if photo_path:
                # 파일명 추출
                filename = os.path.basename(photo_path)
                # 토큰화된 URL 생성 (7일 유효)
                photo_token = encode_file_token(
                    photo_path,
                    expires_in=7 * 24 * 60 * 60,
                    entity_type="application",
                    entity_id=application.id,
                    requires_auth=False,
                )
                photos.append(PartnerViewPhoto(
                    url=f"/api/v1/files/{photo_token}",
                    filename=filename,
                ))

    # 토큰 만료 시간 계산
    token_info = decode_file_token_extended(token)
    if isinstance(token_info, FileTokenInfo):
        expires_at = datetime.fromtimestamp(token_info.expires_at, tz=timezone.utc)
    else:
        expires_at = datetime.now(timezone.utc)

    return PartnerViewResponse(
        # 배정 정보
        assignment_id=assignment.id,
        assignment_status=assignment.status,
        assigned_services=assignment.assigned_services or [],
        scheduled_date=str(assignment.scheduled_date) if assignment.scheduled_date else None,
        scheduled_time=assignment.scheduled_time,
        estimated_cost=assignment.estimated_cost,
        estimate_note=assignment.estimate_note,
        note=assignment.note,
        # 신청 정보 (마스킹)
        application_number=application.application_number,
        customer_name_masked=customer_name_masked,
        address_partial=address_partial,
        selected_services=application.selected_services or [],
        description=application.description or "",
        preferred_consultation_date=(
            str(application.preferred_consultation_date)
            if application.preferred_consultation_date else None
        ),
        preferred_work_date=(
            str(application.preferred_work_date)
            if application.preferred_work_date else None
        ),
        # 사진
        photos=photos,
        # 메타
        created_at=application.created_at.isoformat() if application.created_at else "",
        token_expires_at=expires_at.isoformat(),
    )


def get_partner_view_url(assignment_id: int, base_url: str = "") -> tuple[str, str]:
    """
    협력사 열람 URL 생성

    Args:
        assignment_id: 배정 ID
        base_url: 베이스 URL (없으면 설정에서 가져옴)

    Returns:
        (token, full_url) 튜플
    """
    token = generate_partner_view_token(assignment_id)

    if not base_url:
        # 설정에서 기본 URL 가져오기
        base_url = getattr(settings, 'FRONTEND_URL', 'https://jeonbang-homecare.com')

    # basePath 고려
    base_path = getattr(settings, 'BASE_PATH', '/homecare')
    full_url = f"{base_url}{base_path}/view/{token}"

    return token, full_url
