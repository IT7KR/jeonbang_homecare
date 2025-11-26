"""
Partner API endpoints
파트너 등록 API
"""

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.encryption import encrypt_value
from app.models.partner import Partner
from app.schemas.partner import (
    PartnerCreate,
    PartnerCreateResponse,
)
from app.services.sms import send_partner_notification
from app.services.background import run_async_in_background

router = APIRouter(prefix="/partners", tags=["Partners"])


def send_admin_notification_background(
    company_name: str,
    contact_phone: str,
    service_areas: list[str],
):
    """백그라운드에서 관리자 SMS 발송"""
    run_async_in_background(
        send_partner_notification(company_name, contact_phone, service_areas)
    )


@router.post("", response_model=PartnerCreateResponse)
def create_partner(
    background_tasks: BackgroundTasks,
    data: PartnerCreate,
    db: Session = Depends(get_db),
):
    """
    파트너 등록 신청

    - 연락처 및 주소 정보는 암호화되어 저장됨
    - 등록 후 관리자 승인 대기 상태
    - 신청 완료 시 관리자에게 SMS 알림
    """
    # work_regions를 dict 리스트로 변환
    work_regions_data = [region.model_dump() for region in data.work_regions]

    # 파트너 데이터 생성 (민감정보 암호화)
    new_partner = Partner(
        company_name=data.company_name,
        representative_name=encrypt_value(data.representative_name),
        business_number=encrypt_value(data.business_number) if data.business_number else None,
        contact_phone=encrypt_value(data.contact_phone),
        contact_email=encrypt_value(data.contact_email) if data.contact_email else None,
        address=encrypt_value(data.address),
        address_detail=encrypt_value(data.address_detail) if data.address_detail else None,
        service_areas=data.service_areas,
        work_regions=work_regions_data,
        introduction=data.introduction,
        experience=data.experience,
        remarks=data.remarks,
        status="pending",
    )

    db.add(new_partner)
    db.commit()
    db.refresh(new_partner)

    # 관리자에게만 SMS 알림 (백그라운드)
    background_tasks.add_task(
        send_admin_notification_background,
        data.company_name,
        data.contact_phone,
        data.service_areas,
    )

    return PartnerCreateResponse(
        success=True,
        partner_id=new_partner.id,
        message="파트너 등록 신청이 완료되었습니다. 검토 후 연락드리겠습니다.",
    )
