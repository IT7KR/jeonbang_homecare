"""
SMS Service using Aligo API
알리고 SMS 발송 서비스
"""

import httpx
from typing import Optional
from datetime import datetime, timezone
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.encryption import encrypt_value

logger = logging.getLogger(__name__)

# Aligo API Endpoint
ALIGO_API_URL = "https://apis.aligo.in/send/"


async def send_sms(
    receiver: str,
    message: str,
    title: Optional[str] = None,
) -> dict:
    """
    SMS 발송

    Args:
        receiver: 수신자 전화번호 (하이픈 포함/미포함 모두 가능)
        message: 메시지 내용 (90자 이내: SMS, 초과: LMS)
        title: LMS 제목 (선택)

    Returns:
        API 응답 결과
    """
    # 전화번호 형식 정리 (하이픈 제거)
    receiver = receiver.replace("-", "")

    # API 키가 설정되지 않은 경우 (개발 환경)
    if not settings.ALIGO_API_KEY:
        logger.warning("ALIGO_API_KEY is not set. SMS not sent.")
        return {
            "result_code": "-1",
            "message": "SMS API key not configured (development mode)",
            "msg_id": None,
        }

    # 메시지 타입 결정
    msg_type = "LMS" if len(message) > 90 else "SMS"

    # API 요청 데이터
    data = {
        "key": settings.ALIGO_API_KEY,
        "user_id": settings.ALIGO_USER_ID,
        "sender": settings.ALIGO_SENDER.replace("-", ""),
        "receiver": receiver,
        "msg": message,
        "msg_type": msg_type,
    }

    if msg_type == "LMS" and title:
        data["title"] = title

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(ALIGO_API_URL, data=data)
            result = response.json()

            if result.get("result_code") == "1":
                logger.info(f"SMS sent successfully to {receiver[:3]}***{receiver[-4:]}")
            else:
                logger.error(f"SMS send failed: {result.get('message')}")

            return result
    except Exception as e:
        logger.error(f"SMS send error: {str(e)}")
        return {
            "result_code": "-1",
            "message": str(e),
            "msg_id": None,
        }


async def send_application_notification(
    application_number: str,
    customer_phone: str,
    services: list[str],
) -> dict:
    """
    서비스 신청 알림 SMS 발송 (관리자에게)

    Args:
        application_number: 신청번호
        customer_phone: 고객 전화번호
        services: 신청 서비스 목록 (서비스 코드)
    """
    # 관리자 전화번호 (설정에서 가져오거나 기본값 사용)
    admin_phone = settings.ALIGO_SENDER  # 대표번호로 알림

    services_str = ", ".join(services[:3])
    if len(services) > 3:
        services_str += f" 외 {len(services) - 3}건"

    message = f"""[전방홈케어] 신규 서비스 신청
신청번호: {application_number}
고객연락처: {customer_phone}
서비스: {services_str}
관리자 페이지에서 확인해주세요."""

    return await send_sms(admin_phone, message, "[신규신청]")


async def send_partner_notification(
    company_name: str,
    contact_phone: str,
    service_areas: list[str],
) -> dict:
    """
    파트너 등록 알림 SMS 발송 (관리자에게)

    Args:
        company_name: 회사/상호명
        contact_phone: 연락처
        service_areas: 서비스 분야 (서비스 코드)
    """
    admin_phone = settings.ALIGO_SENDER

    services_str = ", ".join(service_areas[:3])
    if len(service_areas) > 3:
        services_str += f" 외 {len(service_areas) - 3}건"

    message = f"""[전방홈케어] 신규 파트너 등록
업체명: {company_name}
연락처: {contact_phone}
서비스: {services_str}
관리자 페이지에서 확인해주세요."""

    return await send_sms(admin_phone, message, "[파트너등록]")


async def send_sms_direct(
    receiver: str,
    message: str,
    sms_type: str = "manual",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    db: Optional[Session] = None,
) -> dict:
    """
    SMS 발송 (로그 기록 포함)

    Args:
        receiver: 수신자 전화번호
        message: 메시지 내용
        sms_type: 발송 유형 (manual, application_new, partner_new 등)
        reference_type: 참조 타입 (application, partner)
        reference_id: 참조 ID
        db: 데이터베이스 세션 (로그 기록용)

    Returns:
        발송 결과
    """
    from app.models.sms_log import SMSLog

    # SMS 발송
    result = await send_sms(receiver, message)

    # 로그 기록 (db가 있는 경우)
    if db:
        try:
            is_success = result.get("result_code") == "1"
            sms_log = SMSLog(
                receiver_phone=encrypt_value(receiver),
                message=message,
                sms_type=sms_type,
                reference_type=reference_type,
                reference_id=reference_id,
                status="sent" if is_success else "failed",
                result_code=result.get("result_code"),
                result_message=result.get("message"),
                msg_id=result.get("msg_id"),
                sender_phone=settings.ALIGO_SENDER,
                sent_at=datetime.now(timezone.utc) if is_success else None,
            )
            db.add(sms_log)
            db.commit()
            db.refresh(sms_log)

            return {
                "success": is_success,
                "sms_log_id": sms_log.id,
                "error": None if is_success else result.get("message"),
            }
        except Exception as e:
            logger.error(f"SMS log save error: {str(e)}")
            db.rollback()

    return {
        "success": result.get("result_code") == "1",
        "sms_log_id": None,
        "error": None if result.get("result_code") == "1" else result.get("message"),
    }
