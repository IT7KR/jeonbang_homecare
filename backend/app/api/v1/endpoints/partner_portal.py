"""
Partner Portal API endpoints
협력사 포털 - 배정 정보 열람 및 사진 업로드 API

인증 없이 토큰 기반으로 신청 정보를 열람하고 시공 사진을 업로드할 수 있는 협력사용 엔드포인트
"""

import logging
import os
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.encryption import decrypt_value
from app.core.file_token import encode_file_token, decode_file_token_extended, decode_file_token_extended_no_expiry, FileTokenInfo
from app.core.config import settings
from app.models.application import Application
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.partner import Partner
from app.services.file_upload import process_uploaded_files
from app.schemas.partner_portal import (
    PartnerViewResponse,
    PartnerViewPhoto,
    PartnerViewTokenResponse,
    PartnerViewTokenRequest,
    PartnerPhotoUploadResponse,
    PartnerWorkPhotosResponse,
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
    협력사 열람 토큰 검증 (서명만 확인, 만료는 DB에서 확인)

    Args:
        token: 토큰 문자열

    Returns:
        유효한 경우 assignment_id, 그렇지 않으면 None
    """
    # 만료 확인 없이 서명만 검증 (DB에서 만료 시간 별도 관리)
    result = decode_file_token_extended_no_expiry(token)

    if isinstance(result, str):
        # 에러 메시지 반환됨
        logger.warning(f"Partner view token validation failed: {result}")
        return None

    # FileTokenInfo 객체 확인
    if result.entity_type != "assignment" or result.entity_id is None:
        logger.warning(f"Invalid token entity type: {result.entity_type}")
        return None

    return result.entity_id


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

    # DB 만료 시간 확인
    if assignment.url_expires_at and assignment.url_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
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

    # DB 만료 시간 사용 (기간 연장 시에도 정확한 만료일 표시)
    if assignment.url_expires_at:
        expires_at = assignment.url_expires_at
    else:
        # DB에 만료 시간이 없는 경우 토큰에서 추출 (하위 호환)
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


# 시공 사진 업로드 가능 상태
UPLOADABLE_STATUSES = ["accepted", "scheduled", "in_progress"]
MAX_WORK_PHOTOS_PER_TYPE = 30  # 시공 전/후 각각 최대 30장


@router.get("/work-photos/{token}", response_model=PartnerWorkPhotosResponse)
async def get_partner_work_photos(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    협력사 포털 - 시공 사진 목록 조회

    - **token**: 협력사 열람 토큰
    """
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

    # DB 만료 시간 확인
    if assignment.url_expires_at and assignment.url_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
        )

    # 사진 URL 토큰화
    before_photos = []
    after_photos = []

    def get_thumbnail_path(photo_path: str) -> str:
        """원본 경로에서 썸네일 경로 생성 (thumb_ 접두사)"""
        parts = photo_path.rsplit("/", 1)
        if len(parts) == 2:
            return f"{parts[0]}/thumb_{parts[1]}"
        return photo_path

    for photo_path in (assignment.work_photos_before or []):
        if photo_path:
            filename = os.path.basename(photo_path)
            photo_token = encode_file_token(
                photo_path,
                expires_in=7 * 24 * 60 * 60,
                entity_type="assignment",
                entity_id=assignment.id,
                requires_auth=False,
            )
            # 썸네일 토큰 생성
            thumb_path = get_thumbnail_path(photo_path)
            thumb_token = encode_file_token(
                thumb_path,
                expires_in=7 * 24 * 60 * 60,
                entity_type="assignment",
                entity_id=assignment.id,
                requires_auth=False,
            )
            before_photos.append(PartnerViewPhoto(
                url=f"/api/v1/files/{photo_token}",
                thumbnail_url=f"/api/v1/files/{thumb_token}",
                filename=filename,
            ))

    for photo_path in (assignment.work_photos_after or []):
        if photo_path:
            filename = os.path.basename(photo_path)
            photo_token = encode_file_token(
                photo_path,
                expires_in=7 * 24 * 60 * 60,
                entity_type="assignment",
                entity_id=assignment.id,
                requires_auth=False,
            )
            # 썸네일 토큰 생성
            thumb_path = get_thumbnail_path(photo_path)
            thumb_token = encode_file_token(
                thumb_path,
                expires_in=7 * 24 * 60 * 60,
                entity_type="assignment",
                entity_id=assignment.id,
                requires_auth=False,
            )
            after_photos.append(PartnerViewPhoto(
                url=f"/api/v1/files/{photo_token}",
                thumbnail_url=f"/api/v1/files/{thumb_token}",
                filename=filename,
            ))

    return PartnerWorkPhotosResponse(
        assignment_id=assignment.id,
        before_photos=before_photos,
        after_photos=after_photos,
        can_upload=assignment.status in UPLOADABLE_STATUSES,
        max_photos_per_type=MAX_WORK_PHOTOS_PER_TYPE,
    )


@router.post("/upload-photos/{token}", response_model=PartnerPhotoUploadResponse)
async def upload_partner_photos(
    token: str,
    photo_type: str = Form(..., description="사진 유형: 'before' 또는 'after'"),
    photos: list[UploadFile] = File(..., description="업로드할 사진 파일들"),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """
    협력사 포털 - 시공 사진 업로드

    협력사가 직접 시공 전/후 사진을 업로드합니다.
    JWT 인증 없이 토큰 기반으로 접근합니다.

    - **token**: 협력사 열람 토큰 (SMS로 전달됨)
    - **photo_type**: "before" (시공 전) 또는 "after" (시공 후)
    - **photos**: 업로드할 사진 파일 목록 (최대 30장/유형)
    """
    # photo_type 검증
    if photo_type not in ["before", "after"]:
        raise HTTPException(
            status_code=400,
            detail="photo_type은 'before' 또는 'after'여야 합니다"
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

    # DB 만료 시간 확인
    if assignment.url_expires_at and assignment.url_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
        )

    # 상태 검증 - 특정 상태에서만 업로드 허용
    if assignment.status not in UPLOADABLE_STATUSES:
        status_labels = {
            "pending": "배정 대기",
            "notified": "알림 발송됨",
            "accepted": "수락됨",
            "scheduled": "일정 확정",
            "in_progress": "작업 중",
            "completed": "완료",
            "cancelled": "취소됨",
        }
        current_status = status_labels.get(assignment.status, assignment.status)
        raise HTTPException(
            status_code=403,
            detail=f"현재 상태({current_status})에서는 사진을 업로드할 수 없습니다. "
                   f"배정 수락 후 업로드해주세요."
        )

    # 기존 사진 목록
    if photo_type == "before":
        existing_photos = assignment.work_photos_before or []
    else:
        existing_photos = assignment.work_photos_after or []

    # 최대 개수 체크
    if len(existing_photos) + len(photos) > MAX_WORK_PHOTOS_PER_TYPE:
        photo_type_label = "시공 전" if photo_type == "before" else "시공 후"
        raise HTTPException(
            status_code=400,
            detail=f"{photo_type_label} 사진은 최대 {MAX_WORK_PHOTOS_PER_TYPE}장까지 업로드할 수 있습니다. "
                   f"현재 {len(existing_photos)}장, 추가 요청 {len(photos)}장"
        )

    # IP 로깅 (감사 추적)
    client_ip = request.client.host if request and request.client else "unknown"
    logger.info(
        f"Partner photo upload: assignment={assignment_id}, "
        f"type={photo_type}, count={len(photos)}, ip={client_ip}"
    )

    # 파일 업로드 처리
    try:
        uploaded_paths = await process_uploaded_files(
            files=photos,
            upload_dir=settings.UPLOAD_DIR,
            entity_type="assignments",
        )
    except Exception as e:
        logger.error(f"Partner photo upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"사진 업로드 중 오류가 발생했습니다: {str(e)}"
        )

    # 사진 목록 업데이트
    new_photos = existing_photos + uploaded_paths
    now = datetime.now(timezone.utc)

    if photo_type == "before":
        assignment.work_photos_before = new_photos
    else:
        assignment.work_photos_after = new_photos

    if not assignment.work_photos_uploaded_at:
        assignment.work_photos_uploaded_at = now
    assignment.work_photos_updated_at = now

    db.commit()

    logger.info(
        f"Partner photos uploaded: assignment={assignment_id}, "
        f"type={photo_type}, count={len(uploaded_paths)}"
    )

    photo_type_label = "시공 전" if photo_type == "before" else "시공 후"
    return PartnerPhotoUploadResponse(
        assignment_id=assignment_id,
        photo_type=photo_type,
        photos=new_photos,
        total_count=len(new_photos),
        message=f"{photo_type_label} 사진 {len(uploaded_paths)}장이 업로드되었습니다.",
    )


@router.delete("/photos/{token}/{photo_type}")
async def delete_partner_photo(
    token: str,
    photo_type: str,
    photo_index: int,
    request: Request = None,
    db: Session = Depends(get_db),
):
    """
    협력사 포털 - 시공 사진 삭제

    - **token**: 협력사 열람 토큰
    - **photo_type**: "before" 또는 "after"
    - **photo_index**: 삭제할 사진 인덱스 (0부터 시작)
    """
    # photo_type 검증
    if photo_type not in ["before", "after"]:
        raise HTTPException(
            status_code=400,
            detail="photo_type은 'before' 또는 'after'여야 합니다"
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

    # DB 만료 시간 확인
    if assignment.url_expires_at and assignment.url_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
        )

    # 상태 검증
    if assignment.status not in UPLOADABLE_STATUSES:
        raise HTTPException(
            status_code=403,
            detail="현재 상태에서는 사진을 삭제할 수 없습니다."
        )

    # 기존 사진 목록
    if photo_type == "before":
        existing_photos = assignment.work_photos_before or []
    else:
        existing_photos = assignment.work_photos_after or []

    # 인덱스 검증
    if photo_index < 0 or photo_index >= len(existing_photos):
        raise HTTPException(
            status_code=400,
            detail="유효하지 않은 사진 인덱스입니다."
        )

    # 사진 삭제
    deleted_photo = existing_photos.pop(photo_index)

    # IP 로깅
    client_ip = request.client.host if request and request.client else "unknown"
    logger.info(
        f"Partner photo deleted: assignment={assignment_id}, "
        f"type={photo_type}, index={photo_index}, ip={client_ip}"
    )

    # 목록 업데이트
    if photo_type == "before":
        assignment.work_photos_before = existing_photos
    else:
        assignment.work_photos_after = existing_photos

    assignment.work_photos_updated_at = datetime.now(timezone.utc)

    db.commit()

    photo_type_label = "시공 전" if photo_type == "before" else "시공 후"
    return {
        "success": True,
        "message": f"{photo_type_label} 사진이 삭제되었습니다.",
        "remaining_count": len(existing_photos),
    }
