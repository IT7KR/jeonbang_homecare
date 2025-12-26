"""
Application API endpoints
서비스 신청 API
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import json
import logging

from app.core.database import get_db
from app.core.encryption import encrypt_value, generate_search_hash
from app.core.config import settings
from app.models.application import Application, generate_application_number
from app.models.service import ServiceType
from app.schemas.application import (
    ApplicationCreate,
    ApplicationCreateResponse,
    DuplicateApplicationInfo,
)
from app.services.sms import send_application_notification
from app.services.file_upload import process_uploaded_files
from app.services.background import run_async_in_background
from app.services.search_index import update_application_search_index
from app.services.duplicate_check import check_application_duplicate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["Applications"])

# 업로드 디렉토리 설정 (settings에서 가져옴)
UPLOAD_DIR = settings.UPLOAD_DIR


def send_admin_notification_background(
    application_number: str,
    customer_phone: str,
    services: list[str],
    preferred_consultation_date: Optional[date] = None,
    preferred_work_date: Optional[date] = None,
):
    """백그라운드에서 관리자 SMS 발송"""
    run_async_in_background(
        send_application_notification(
            application_number,
            customer_phone,
            services,
            preferred_consultation_date,
            preferred_work_date,
        )
    )


@router.post("", response_model=ApplicationCreateResponse)
async def create_application(
    background_tasks: BackgroundTasks,
    customer_name: str = Form(...),
    customer_phone: str = Form(...),
    address: str = Form(...),
    address_detail: Optional[str] = Form(None),
    selected_services: str = Form(...),  # JSON 문자열로 전달
    description: str = Form(...),
    preferred_consultation_date: Optional[str] = Form(None),  # YYYY-MM-DD
    preferred_work_date: Optional[str] = Form(None),  # YYYY-MM-DD
    photos: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    """
    서비스 신청 생성

    - 사진은 최대 5장까지 업로드 가능
    - 고객 정보는 암호화되어 저장됨
    - 신청 완료 시 관리자에게 SMS 알림
    """
    try:
        # JSON 문자열을 리스트로 변환
        services_list = json.loads(selected_services)

        # 날짜 문자열 파싱
        parsed_consultation_date = None
        parsed_work_date = None
        if preferred_consultation_date:
            parsed_consultation_date = date.fromisoformat(preferred_consultation_date)
        if preferred_work_date:
            parsed_work_date = date.fromisoformat(preferred_work_date)

        # 폼 데이터 검증
        data = ApplicationCreate(
            customer_name=customer_name,
            customer_phone=customer_phone,
            address=address,
            address_detail=address_detail,
            selected_services=services_list,
            description=description,
            preferred_consultation_date=parsed_consultation_date,
            preferred_work_date=parsed_work_date,
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="selected_services 형식이 올바르지 않습니다")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 준비 중인 서비스 포함 여부 확인
    if services_list:
        selected_instances = (
            db.query(ServiceType)
            .filter(ServiceType.code.in_(services_list))
            .all()
        )
        for instance in selected_instances:
            if instance.booking_status == 'PREPARING':
                raise HTTPException(
                    status_code=400, 
                    detail=f"서비스 '{instance.name}'(은)는 현재 준비 중이므로 선택할 수 없습니다."
                )

    # 중복 신청 체크
    duplicate_result = check_application_duplicate(db, data.customer_phone)
    duplicate_info = None
    if duplicate_result.is_duplicate:
        duplicate_info = DuplicateApplicationInfo(
            existing_id=duplicate_result.existing_id,
            existing_application_number=duplicate_result.existing_application_number,
            existing_status=duplicate_result.existing_status,
            existing_created_at=duplicate_result.existing_created_at,
        )
        logger.info(
            f"중복 신청 감지: 전화번호={data.customer_phone}, "
            f"기존 신청번호={duplicate_result.existing_application_number}"
        )

    # 사진 파일 처리 (공통 서비스 사용)
    photo_paths = await process_uploaded_files(
        files=photos,
        upload_dir=UPLOAD_DIR,
        max_files=5,
    )

    # 신청번호 생성
    application_number = generate_application_number(db)

    # 전화번호 해시 생성 (중복 감지용)
    phone_hash = generate_search_hash(data.customer_phone, "phone")

    # 신청 데이터 생성 (민감정보 암호화)
    new_application = Application(
        application_number=application_number,
        customer_name=encrypt_value(data.customer_name),
        customer_phone=encrypt_value(data.customer_phone),
        phone_hash=phone_hash,
        address=encrypt_value(data.address),
        address_detail=encrypt_value(data.address_detail) if data.address_detail else None,
        selected_services=data.selected_services,
        description=data.description,
        preferred_consultation_date=data.preferred_consultation_date,
        preferred_work_date=data.preferred_work_date,
        photos=photo_paths,
        status="new",
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # 검색 인덱스 생성 (평문 값 사용)
    update_application_search_index(
        db,
        new_application.id,
        data.customer_name,
        data.customer_phone
    )
    db.commit()

    # 관리자에게만 SMS 알림 (백그라운드)
    background_tasks.add_task(
        send_admin_notification_background,
        application_number,
        data.customer_phone,
        data.selected_services,
        data.preferred_consultation_date,
        data.preferred_work_date,
    )

    # 응답 메시지 (중복 여부에 따라 다름)
    message = "서비스 신청이 완료되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다."
    if duplicate_info:
        message = (
            f"서비스 신청이 완료되었습니다. "
            f"동일 연락처로 진행 중인 신청(신청번호: {duplicate_info.existing_application_number})이 있습니다."
        )

    return ApplicationCreateResponse(
        success=True,
        application_number=application_number,
        message=message,
        duplicate_info=duplicate_info,
        is_duplicate=duplicate_result.is_duplicate,
    )


@router.post("/simple", response_model=ApplicationCreateResponse)
def create_application_simple(
    background_tasks: BackgroundTasks,
    data: ApplicationCreate,
    db: Session = Depends(get_db),
):
    """
    서비스 신청 생성 (사진 없이, JSON 본문으로)

    - 사진 첨부가 필요 없는 경우 사용
    - 고객 정보는 암호화되어 저장됨
    - 신청 완료 시 관리자에게 SMS 알림
    """
    # 준비 중인 서비스 포함 여부 확인
    if data.selected_services:
        selected_instances = (
            db.query(ServiceType)
            .filter(ServiceType.code.in_(data.selected_services))
            .all()
        )
        for instance in selected_instances:
            if instance.booking_status == 'PREPARING':
                raise HTTPException(
                    status_code=400,
                    detail=f"서비스 '{instance.name}'(은)는 현재 준비 중이므로 선택할 수 없습니다."
                )

    # 중복 신청 체크
    duplicate_result = check_application_duplicate(db, data.customer_phone)
    duplicate_info = None
    if duplicate_result.is_duplicate:
        duplicate_info = DuplicateApplicationInfo(
            existing_id=duplicate_result.existing_id,
            existing_application_number=duplicate_result.existing_application_number,
            existing_status=duplicate_result.existing_status,
            existing_created_at=duplicate_result.existing_created_at,
        )
        logger.info(
            f"중복 신청 감지: 전화번호={data.customer_phone}, "
            f"기존 신청번호={duplicate_result.existing_application_number}"
        )

    # 신청번호 생성
    application_number = generate_application_number(db)

    # 전화번호 해시 생성 (중복 감지용)
    phone_hash = generate_search_hash(data.customer_phone, "phone")

    # 신청 데이터 생성 (민감정보 암호화)
    new_application = Application(
        application_number=application_number,
        customer_name=encrypt_value(data.customer_name),
        customer_phone=encrypt_value(data.customer_phone),
        phone_hash=phone_hash,
        address=encrypt_value(data.address),
        address_detail=encrypt_value(data.address_detail) if data.address_detail else None,
        selected_services=data.selected_services,
        description=data.description,
        preferred_consultation_date=data.preferred_consultation_date,
        preferred_work_date=data.preferred_work_date,
        photos=[],
        status="new",
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # 검색 인덱스 생성 (평문 값 사용)
    update_application_search_index(
        db,
        new_application.id,
        data.customer_name,
        data.customer_phone
    )
    db.commit()

    # 관리자에게만 SMS 알림 (백그라운드)
    background_tasks.add_task(
        send_admin_notification_background,
        application_number,
        data.customer_phone,
        data.selected_services,
        data.preferred_consultation_date,
        data.preferred_work_date,
    )

    # 응답 메시지 (중복 여부에 따라 다름)
    message = "서비스 신청이 완료되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다."
    if duplicate_info:
        message = (
            f"서비스 신청이 완료되었습니다. "
            f"동일 연락처로 진행 중인 신청(신청번호: {duplicate_info.existing_application_number})이 있습니다."
        )

    return ApplicationCreateResponse(
        success=True,
        application_number=application_number,
        message=message,
        duplicate_info=duplicate_info,
        is_duplicate=duplicate_result.is_duplicate,
    )
