"""
Application API endpoints
서비스 신청 API
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import json
import logging

from app.core.database import get_db
from app.core.encryption import encrypt_value
from app.models.application import Application, generate_application_number
from app.schemas.application import (
    ApplicationCreate,
    ApplicationCreateResponse,
)
from app.services.sms import send_application_notification
from app.services.file_upload import process_uploaded_files
from app.services.background import run_async_in_background

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["Applications"])

# 업로드 디렉토리 설정
UPLOAD_DIR = "/app/uploads/applications"


def send_admin_notification_background(
    application_number: str,
    customer_phone: str,
    services: list[str],
):
    """백그라운드에서 관리자 SMS 발송"""
    run_async_in_background(
        send_application_notification(application_number, customer_phone, services)
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

        # 폼 데이터 검증
        data = ApplicationCreate(
            customer_name=customer_name,
            customer_phone=customer_phone,
            address=address,
            address_detail=address_detail,
            selected_services=services_list,
            description=description,
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="selected_services 형식이 올바르지 않습니다")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 사진 파일 처리 (공통 서비스 사용)
    photo_paths = await process_uploaded_files(
        files=photos,
        upload_dir=UPLOAD_DIR,
        max_files=5,
    )

    # 신청번호 생성
    application_number = generate_application_number(db)

    # 신청 데이터 생성 (민감정보 암호화)
    new_application = Application(
        application_number=application_number,
        customer_name=encrypt_value(data.customer_name),
        customer_phone=encrypt_value(data.customer_phone),
        address=encrypt_value(data.address),
        address_detail=encrypt_value(data.address_detail) if data.address_detail else None,
        selected_services=data.selected_services,
        description=data.description,
        photos=photo_paths,
        status="new",
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # 관리자에게만 SMS 알림 (백그라운드)
    background_tasks.add_task(
        send_admin_notification_background,
        application_number,
        data.customer_phone,
        data.selected_services,
    )

    return ApplicationCreateResponse(
        success=True,
        application_number=application_number,
        message="서비스 신청이 완료되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다.",
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
    # 신청번호 생성
    application_number = generate_application_number(db)

    # 신청 데이터 생성 (민감정보 암호화)
    new_application = Application(
        application_number=application_number,
        customer_name=encrypt_value(data.customer_name),
        customer_phone=encrypt_value(data.customer_phone),
        address=encrypt_value(data.address),
        address_detail=encrypt_value(data.address_detail) if data.address_detail else None,
        selected_services=data.selected_services,
        description=data.description,
        photos=[],
        status="new",
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # 관리자에게만 SMS 알림 (백그라운드)
    background_tasks.add_task(
        send_admin_notification_background,
        application_number,
        data.customer_phone,
        data.selected_services,
    )

    return ApplicationCreateResponse(
        success=True,
        application_number=application_number,
        message="서비스 신청이 완료되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다.",
    )
