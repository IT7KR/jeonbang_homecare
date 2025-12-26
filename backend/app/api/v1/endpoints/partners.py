"""
Partner API endpoints
협력사 등록 API
"""

import os
import uuid
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.encryption import encrypt_value
from app.core.config import settings
from app.core.file_validators import (
    validate_file_magic,
    validate_filename_security,
    get_safe_extension,
    validate_file_size,
    get_mime_from_extension,
)
from app.models.partner import Partner

logger = logging.getLogger(__name__)
from app.schemas.partner import (
    PartnerCreate,
    PartnerCreateResponse,
)
from app.services.sms import send_partner_notification
from app.services.background import run_async_in_background
from app.services.audit import log_file_access

router = APIRouter(prefix="/partners", tags=["Partners"])

# 허용된 파일 확장자
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def send_admin_notification_background(
    company_name: str,
    contact_phone: str,
    service_areas: list[str],
):
    """백그라운드에서 관리자 SMS 발송"""
    run_async_in_background(
        send_partner_notification(company_name, contact_phone, service_areas)
    )


async def save_business_registration_file(
    file: UploadFile,
    partner_id: int,
) -> Optional[str]:
    """
    사업자등록증 파일 저장 (보안 강화)

    보안 검증:
    1. 파일명 보안 검사 (위험 확장자, 더블 확장자, 특수문자)
    2. 파일 확장자 화이트리스트 검사
    3. 파일 크기 검사
    4. 매직 바이트 검증 (실제 파일 형식 확인)
    """
    if not file or not file.filename:
        return None

    # 1. 파일명 보안 검사
    is_safe, error_msg = validate_filename_security(file.filename)
    if not is_safe:
        logger.warning(f"파일명 보안 검사 실패: {file.filename} - {error_msg}")
        raise ValueError(error_msg)

    # 2. 파일 확장자 화이트리스트 검사
    ext = get_safe_extension(file.filename, ALLOWED_EXTENSIONS)
    if not ext:
        logger.warning(f"허용되지 않은 확장자: {file.filename}")
        raise ValueError(f"허용되지 않은 파일 형식입니다. 허용: {', '.join(ALLOWED_EXTENSIONS)}")

    # 3. 파일 크기 확인
    content = await file.read()
    size_ok, size_error = validate_file_size(content, MAX_FILE_SIZE)
    if not size_ok:
        raise ValueError(size_error)

    # 4. 매직 바이트 검증 (실제 파일 형식 확인)
    expected_mime = get_mime_from_extension(ext)
    if expected_mime and not validate_file_magic(content, expected_mime):
        logger.warning(
            f"매직 바이트 불일치: {file.filename} - 예상 MIME: {expected_mime}"
        )
        raise ValueError("파일 형식이 확장자와 일치하지 않습니다. 올바른 파일을 업로드해주세요.")

    # 저장 경로 생성
    upload_dir = os.path.join(settings.UPLOAD_DIR, "partners", str(partner_id))
    os.makedirs(upload_dir, exist_ok=True)

    # 고유 파일명 생성 (원본 파일명 사용하지 않음)
    unique_filename = f"business_registration_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # 경로 검증 (Path Traversal 방지)
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIR)):
        logger.error(f"Path Traversal 시도 감지: {file_path}")
        raise ValueError("잘못된 파일 경로입니다.")

    # 파일 저장
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"사업자등록증 저장 완료: partner_id={partner_id}, file={unique_filename}")

    # 상대 경로 반환 (URL용)
    return f"/uploads/partners/{partner_id}/{unique_filename}"


@router.post("", response_model=PartnerCreateResponse)
async def create_partner(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    # FormData 필드들
    companyName: str = Form(...),
    representativeName: str = Form(...),
    businessNumber: Optional[str] = Form(None),
    contactPhone: str = Form(...),
    contactEmail: Optional[str] = Form(None),
    address: str = Form(...),
    addressDetail: Optional[str] = Form(None),
    serviceAreas: str = Form(...),  # JSON 문자열
    workRegions: str = Form(...),  # JSON 문자열
    introduction: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    remarks: Optional[str] = Form(None),
    # 파일 업로드
    businessRegistrationFile: Optional[UploadFile] = File(None),
):
    """
    협력사 등록 신청 (FormData 지원)

    - 연락처 및 주소 정보는 암호화되어 저장됨
    - 사업자등록증 파일 업로드 지원 (PDF, JPG, PNG, 최대 10MB)
    - 등록 후 관리자 승인 대기 상태
    - 신청 완료 시 관리자에게 SMS 알림
    """
    # JSON 문자열 파싱
    try:
        service_areas_list = json.loads(serviceAreas)
        work_regions_list = json.loads(workRegions)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="잘못된 데이터 형식입니다.")

    # 협력사 데이터 생성 (민감정보 암호화)
    new_partner = Partner(
        company_name=companyName,
        representative_name=encrypt_value(representativeName),
        business_number=encrypt_value(businessNumber) if businessNumber else None,
        contact_phone=encrypt_value(contactPhone),
        contact_email=encrypt_value(contactEmail) if contactEmail else None,
        address=encrypt_value(address),
        address_detail=encrypt_value(addressDetail) if addressDetail else None,
        service_areas=service_areas_list,
        work_regions=work_regions_list,
        introduction=introduction,
        experience=experience,
        remarks=remarks,
        status="pending",
    )

    db.add(new_partner)
    db.commit()
    db.refresh(new_partner)

    # 사업자등록증 파일 저장
    if businessRegistrationFile and businessRegistrationFile.filename:
        try:
            file_path = await save_business_registration_file(
                businessRegistrationFile,
                new_partner.id,
            )
            if file_path:
                new_partner.business_registration_file = file_path

                # 파일 업로드 감사 로그 기록
                try:
                    log_file_access(
                        db=db,
                        action="upload",
                        file_path=file_path,
                        file_size=businessRegistrationFile.size,
                        file_type=businessRegistrationFile.content_type,
                        original_name=businessRegistrationFile.filename,
                        related_entity_type="partner",
                        related_entity_id=new_partner.id,
                    )
                except Exception as log_error:
                    logger.warning(f"파일 업로드 로그 기록 실패: {log_error}")

                db.commit()
        except ValueError as e:
            # 파일 저장 실패해도 협력사 등록은 성공 처리
            pass

    # 관리자에게만 SMS 알림 (백그라운드)
    background_tasks.add_task(
        send_admin_notification_background,
        companyName,
        contactPhone,
        service_areas_list,
    )

    return PartnerCreateResponse(
        success=True,
        partner_id=new_partner.id,
        message="협력사 등록 신청이 완료되었습니다. 검토 후 연락드리겠습니다.",
    )
