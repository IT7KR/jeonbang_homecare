"""
Customer Portal API endpoints
고객 열람 포털 - 시공 정보 및 사진 열람 API

인증 없이 토큰 기반으로 시공 정보와 사진을 열람할 수 있는 고객용 엔드포인트
"""

import logging
import os
import re
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import asc
from io import BytesIO

from app.core.database import get_db
from app.core.encryption import decrypt_value
from app.core.file_token import encode_file_token, decode_file_token_extended, decode_file_token_extended_no_expiry, FileTokenInfo
from app.core.config import settings
from app.models.application import Application
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.partner import Partner
from app.models.quote_item import QuoteItem
from app.schemas.customer_portal import (
    CustomerViewResponse,
    CustomerViewPhoto,
    CustomerViewQuote,
    CustomerViewQuoteItem,
    CustomerViewTokenInfo,
)
from app.services.quote_pdf import generate_quote_pdf, get_quote_filename

router = APIRouter(prefix="/customer-portal", tags=["Customer Portal"])
logger = logging.getLogger(__name__)

# 배정 상태 한글 레이블
STATUS_LABELS = {
    "pending": "접수 대기",
    "notified": "협력사 알림 발송",
    "accepted": "협력사 수락",
    "scheduled": "일정 확정",
    "in_progress": "시공 진행 중",
    "completed": "시공 완료",
    "cancelled": "취소됨",
}


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


def mask_phone(phone: str) -> str:
    """
    전화번호 중간 4자리 마스킹 (010-1234-5678 → 010-****-5678)

    Args:
        phone: 원본 전화번호

    Returns:
        마스킹된 전화번호
    """
    if not phone:
        return ""
    # 숫자만 추출
    digits = re.sub(r"[^\d]", "", phone)
    if len(digits) == 11:
        return f"{digits[:3]}-****-{digits[7:]}"
    elif len(digits) == 10:
        return f"{digits[:3]}-***-{digits[6:]}"
    return "***-****-****"


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


def validate_customer_token(token: str, db: Session) -> Optional[ApplicationPartnerAssignment]:
    """
    고객 열람 토큰 검증 (서명만 확인, 만료는 DB에서 확인)

    Args:
        token: 토큰 문자열
        db: 데이터베이스 세션

    Returns:
        유효한 경우 assignment 객체, 그렇지 않으면 None
    """
    # 만료 확인 없이 서명만 검증 (DB에서 만료 시간 별도 관리)
    result = decode_file_token_extended_no_expiry(token)

    if isinstance(result, str):
        # 에러 메시지 반환됨
        logger.warning(f"Customer view token validation failed: {result}")
        return None

    # FileTokenInfo 객체 확인
    if result.entity_type != "customer_view" or result.entity_id is None:
        logger.warning(f"Invalid token entity type: {result.entity_type}")
        return None

    assignment_id = result.entity_id

    # 배정 정보 조회
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id
    ).first()

    if not assignment:
        return None

    # DB에 저장된 토큰과 비교 (무효화 확인)
    if assignment.customer_token != token:
        # 저장된 토큰과 다르면 무효화된 토큰
        logger.warning(f"Token mismatch for assignment {assignment_id}")
        return None

    # DB 만료 시간 확인
    if assignment.customer_token_expires_at:
        if assignment.customer_token_expires_at < datetime.now(timezone.utc):
            logger.warning(f"Customer token expired for assignment {assignment_id}")
            return None

    return assignment


def get_progress_steps(assignment: ApplicationPartnerAssignment, application: Application) -> list[dict]:
    """
    진행 현황 스텝 생성

    Args:
        assignment: 배정 정보
        application: 신청 정보

    Returns:
        진행 스텝 목록
    """
    status = assignment.status

    if status == "cancelled":
        # 취소된 경우
        return [
            {"step": "접수", "status": "completed", "date": application.created_at.strftime("%Y-%m-%d") if application.created_at else None},
            {"step": "취소됨", "status": "cancelled", "date": assignment.cancelled_at.strftime("%Y-%m-%d") if assignment.cancelled_at else None},
        ]

    # 스텝 정의 - UI에 표시되는 진행 단계
    # assignment.status와 UI 스텝 매핑:
    #   pending/notified/accepted → "협력사 배정" 스텝 (current)
    #   scheduled → "일정 확정" 스텝 (current)
    #   in_progress → "시공 진행" 스텝 (current)
    #   completed → "시공 완료" 스텝 (current)

    # "접수"는 항상 완료 (고객 URL이 존재한다면 신청은 이미 접수됨)
    steps = []

    # 1. 접수 - 항상 완료
    steps.append({
        "step": "접수",
        "status": "completed",
        "date": application.created_at.strftime("%Y-%m-%d") if application.created_at else None,
    })

    # 2. 협력사 배정 - pending/notified/accepted 상태
    if status in ["pending", "notified", "accepted"]:
        step_status = "current"
    elif status in ["scheduled", "in_progress", "completed"]:
        step_status = "completed"
    else:
        step_status = "pending"
    steps.append({
        "step": "협력사 배정",
        "status": step_status,
        "date": assignment.assigned_at.strftime("%Y-%m-%d") if assignment.assigned_at else None,
    })

    # 3. 일정 확정
    if status == "scheduled":
        step_status = "current"
    elif status in ["in_progress", "completed"]:
        step_status = "completed"
    else:
        step_status = "pending"
    steps.append({
        "step": "일정 확정",
        "status": step_status,
        "date": assignment.scheduled_date.strftime("%Y-%m-%d") if assignment.scheduled_date else None,
    })

    # 4. 시공 진행
    if status == "in_progress":
        step_status = "current"
    elif status == "completed":
        step_status = "completed"
    else:
        step_status = "pending"
    steps.append({
        "step": "시공 진행",
        "status": step_status,
        "date": None,
    })

    # 5. 시공 완료
    if status == "completed":
        step_status = "current"
    else:
        step_status = "pending"
    steps.append({
        "step": "시공 완료",
        "status": step_status,
        "date": assignment.completed_at.strftime("%Y-%m-%d") if assignment.completed_at else None,
    })

    return steps


@router.get("/view/{token}", response_model=CustomerViewResponse)
async def view_assignment(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    고객용 시공 정보 열람

    토큰을 검증하고 시공 정보 및 사진을 반환합니다.
    개인정보는 마스킹 처리됩니다.

    - **token**: 고객 열람 토큰 (SMS로 전달됨)
    """
    # 토큰 검증
    assignment = validate_customer_token(token, db)
    if assignment is None:
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

    # 협력사 정보 조회
    partner = db.query(Partner).filter(
        Partner.id == assignment.partner_id
    ).first()

    # IP 로깅 (감사 추적)
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        f"Customer portal access: assignment={assignment.id}, "
        f"application={application.application_number}, ip={client_ip}"
    )

    # 고객 정보 복호화 및 마스킹
    customer_name = decrypt_value(application.customer_name) or ""
    address = decrypt_value(application.address) or ""
    customer_name_masked = mask_name(customer_name)
    address_partial = extract_partial_address(address)

    # 협력사 정보 마스킹
    partner_company = None
    partner_phone_masked = None
    if partner:
        partner_company = partner.company_name
        partner_phone = decrypt_value(partner.contact_phone) if partner.contact_phone else ""
        partner_phone_masked = mask_phone(partner_phone)

    # 견적 정보 조회
    quote = None
    items = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment.id
    ).order_by(asc(QuoteItem.sort_order)).all()

    if items:
        quote_number = f"{application.application_number}-Q{assignment.id}"
        total_amount = sum(item.amount for item in items)

        # PDF 다운로드 URL 생성 (토큰 기반)
        pdf_download_url = f"/api/v1/customer-portal/quote-pdf/{token}"

        quote = CustomerViewQuote(
            quote_number=quote_number,
            quote_date=datetime.now().strftime("%Y년 %m월 %d일"),
            items=[
                CustomerViewQuoteItem(
                    item_name=item.item_name,
                    description=item.description,
                    quantity=item.quantity,
                    unit=item.unit,
                    unit_price=item.unit_price,
                    amount=item.amount,
                )
                for item in items
            ],
            total_amount=total_amount,
            estimate_note=assignment.estimate_note,
            pdf_download_url=pdf_download_url,
        )

    # 시공 사진 URL 토큰화
    work_photos_before = []
    work_photos_after = []

    def get_thumbnail_path(photo_path: str) -> str:
        """원본 경로에서 썸네일 경로 생성 (thumb_ 접두사)"""
        parts = photo_path.rsplit("/", 1)
        if len(parts) == 2:
            return f"{parts[0]}/thumb_{parts[1]}"
        return photo_path

    if assignment.work_photos_before:
        for photo_path in assignment.work_photos_before:
            if photo_path:
                filename = os.path.basename(photo_path)
                photo_token = encode_file_token(
                    photo_path,
                    expires_in=30 * 24 * 60 * 60,  # 30일
                    entity_type="work_photo",
                    entity_id=assignment.id,
                    requires_auth=False,
                )
                # 썸네일 토큰 생성
                thumb_path = get_thumbnail_path(photo_path)
                thumb_token = encode_file_token(
                    thumb_path,
                    expires_in=30 * 24 * 60 * 60,  # 30일
                    entity_type="work_photo",
                    entity_id=assignment.id,
                    requires_auth=False,
                )
                work_photos_before.append(CustomerViewPhoto(
                    url=f"/api/v1/files/{photo_token}",
                    thumbnail_url=f"/api/v1/files/{thumb_token}",
                    filename=filename,
                ))

    if assignment.work_photos_after:
        for photo_path in assignment.work_photos_after:
            if photo_path:
                filename = os.path.basename(photo_path)
                photo_token = encode_file_token(
                    photo_path,
                    expires_in=30 * 24 * 60 * 60,  # 30일
                    entity_type="work_photo",
                    entity_id=assignment.id,
                    requires_auth=False,
                )
                # 썸네일 토큰 생성
                thumb_path = get_thumbnail_path(photo_path)
                thumb_token = encode_file_token(
                    thumb_path,
                    expires_in=30 * 24 * 60 * 60,  # 30일
                    entity_type="work_photo",
                    entity_id=assignment.id,
                    requires_auth=False,
                )
                work_photos_after.append(CustomerViewPhoto(
                    url=f"/api/v1/files/{photo_token}",
                    thumbnail_url=f"/api/v1/files/{thumb_token}",
                    filename=filename,
                ))

    # 진행 현황 생성
    progress_steps = get_progress_steps(assignment, application)

    # 토큰 만료 시간
    token_expires_at = assignment.customer_token_expires_at.isoformat() if assignment.customer_token_expires_at else ""

    # 연락처 정보 (설정에서 가져오기)
    contact_info = getattr(settings, 'CONTACT_INFO', '문의: 1551-6640')

    return CustomerViewResponse(
        # 배정 정보
        assignment_id=assignment.id,
        assignment_status=assignment.status,
        status_label=STATUS_LABELS.get(assignment.status, assignment.status),
        assigned_services=assignment.assigned_services or [],
        scheduled_date=str(assignment.scheduled_date) if assignment.scheduled_date else None,
        scheduled_time=assignment.scheduled_time,
        # 신청 정보 (마스킹)
        application_number=application.application_number,
        customer_name_masked=customer_name_masked,
        address_partial=address_partial,
        selected_services=application.selected_services or [],
        description=application.description,
        # 협력사 정보 (마스킹)
        partner_company=partner_company,
        partner_phone_masked=partner_phone_masked,
        # 견적
        quote=quote,
        # 시공 사진
        work_photos_before=work_photos_before,
        work_photos_after=work_photos_after,
        work_photos_uploaded_at=(
            assignment.work_photos_uploaded_at.isoformat()
            if assignment.work_photos_uploaded_at else None
        ),
        # 진행 현황
        progress_steps=progress_steps,
        # 메타
        created_at=application.created_at.isoformat() if application.created_at else "",
        token_expires_at=token_expires_at,
        contact_info=contact_info,
    )


@router.get("/quote-pdf/{token}")
async def download_quote_pdf(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    고객용 견적서 PDF 다운로드

    토큰을 검증하고 견적서 PDF를 반환합니다.

    - **token**: 고객 열람 토큰
    """
    # 토큰 검증
    assignment = validate_customer_token(token, db)
    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="유효하지 않거나 만료된 링크입니다."
        )

    # 신청 정보 조회 (견적번호 생성용)
    application = db.query(Application).filter(
        Application.id == assignment.application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="신청 정보를 찾을 수 없습니다."
        )

    # 견적 항목 확인
    items_count = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment.id
    ).count()

    if items_count == 0:
        raise HTTPException(
            status_code=404,
            detail="견적서가 아직 작성되지 않았습니다."
        )

    # IP 로깅
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        f"Customer quote PDF download: assignment={assignment.id}, "
        f"application={application.application_number}, ip={client_ip}"
    )

    try:
        # PDF 생성
        pdf_bytes = generate_quote_pdf(db, assignment.id)

        # 파일명 생성
        quote_number = f"{application.application_number}-Q{assignment.id}"
        filename = get_quote_filename(quote_number)

        # 스트리밍 응답 (RFC 5987 인코딩으로 한글 파일명 지원)
        encoded_filename = quote(filename)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
                "Content-Length": str(len(pdf_bytes)),
            }
        )
    except ValueError as e:
        logger.error(f"Quote PDF generation error: {e}")
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Quote PDF generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="PDF 생성 중 오류가 발생했습니다."
        )


@router.get("/token-info/{token}", response_model=CustomerViewTokenInfo)
async def get_token_info(
    token: str,
    db: Session = Depends(get_db),
):
    """
    토큰 정보 조회 (유효성 확인용)

    토큰의 유효성과 만료 시간을 확인합니다.

    - **token**: 고객 열람 토큰
    """
    assignment = validate_customer_token(token, db)

    if assignment is None:
        return CustomerViewTokenInfo(
            is_valid=False,
            message="유효하지 않거나 만료된 링크입니다."
        )

    return CustomerViewTokenInfo(
        is_valid=True,
        expires_at=assignment.customer_token_expires_at.isoformat() if assignment.customer_token_expires_at else None,
        assignment_id=assignment.id,
        message="유효한 링크입니다."
    )
