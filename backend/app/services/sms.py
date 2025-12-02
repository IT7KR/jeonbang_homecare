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

# ===== 서비스 코드 → 한글 명칭 캐시 =====
# DB에서 로드된 매핑 (앱 시작 시 load_service_cache로 초기화)
_service_cache: dict[str, str] = {}

# Fallback 매핑 (DB 조회 실패 시 사용, 이전 코드 호환성 유지)
_SERVICE_CODE_FALLBACK = {
    "HOUSE_CONSTRUCTION": "주택 건축",
    "WEEDING": "제초 작업",
    "SNOW_REMOVAL": "제설 작업",
    "SPIDER_WEB": "거미줄 제거",
    "WASP_NEST": "벌집 제거",
    "PEST_CONTROL": "해충 방제",
    "YARD_CLEANING": "마당 청소",
    "LANDSCAPING_MGMT": "조경 공사/관리",
    "TREE_PRUNING": "수목 전지",
    "GARDEN_WORK": "정원 공사",
    "YARD_WORK": "마당 공사",
    "DECK_WORK": "데크 공사",
    "FENCE_WALL": "펜스/담장",
    "AWNING_PERGOLA": "어닝/파고라",
    "SINK": "씽크대",
    "BUILT_IN_CLOSET": "붙박이장",
    "SHOE_CABINET": "신발장",
    "BATHROOM_PARTIAL": "욕실 일부 수리",
    "BATHROOM_FULL": "욕실 전체 수리",
    "PAINT_INTERIOR": "페인트 내부",
    "PAINT_EXTERIOR": "페인트 외부",
    "WALLPAPER": "도배",
    "TILE": "타일",
    "FLOOR_SHEET": "장판",
    "WOOD_FLOOR": "마루 바닥",
    "CURTAIN_BLIND": "커튼/블라인드",
    "FULL_INTERIOR": "전체 인테리어",
    "PLUMBING_LEAK": "배관/누수",
    "WIRING_LIGHTING": "배선/조명",
    "SASH": "샷시",
    "SCREEN_DOOR": "방충망",
    "OTHERS": "기타 작업",
    "CLEANING_INTERIOR": "내부 청소",
    "CLEANING_EXTERIOR": "외부 청소",
    "FIREPLACE": "장작 난로/벽난로",
    "CCTV": "CCTV 설치",
    "EMPTY_HOUSE": "빈집 관리",
    "REGULAR_CARE": "정기 관리",
    "COMPLEX_CARE": "단지 관리",
    # 이전 코드 호환성
    "LANDSCAPING": "조경",
    "AWNING": "어닝",
    "BATHROOM": "욕실",
    "ELECTRICAL": "전기",
    "CCTV_SECURITY": "CCTV/보안",
}


def load_service_cache(db: Session) -> int:
    """
    DB에서 서비스 코드→이름 매핑을 캐시로 로드
    앱 시작 시 호출하여 초기화

    Returns:
        로드된 서비스 타입 수
    """
    global _service_cache
    try:
        from app.models.service import ServiceType
        types = db.query(ServiceType).filter(ServiceType.is_active == True).all()
        _service_cache = {t.code: t.name for t in types}
        logger.info(f"Service cache loaded: {len(_service_cache)} types from DB")
        return len(_service_cache)
    except Exception as e:
        logger.warning(f"Failed to load service cache from DB, using fallback: {e}")
        _service_cache = _SERVICE_CODE_FALLBACK.copy()
        return len(_service_cache)


def get_service_name(code: str) -> str:
    """서비스 코드를 한글 명칭으로 변환 (캐시 우선, fallback 사용)"""
    # 캐시가 로드되어 있으면 캐시에서 조회
    if _service_cache:
        return _service_cache.get(code, code)
    # 캐시가 비어있으면 fallback 사용
    return _SERVICE_CODE_FALLBACK.get(code, code)


async def send_sms(
    receiver: str,
    message: str,
    title: Optional[str] = None,
    force_lms: bool = False,
) -> dict:
    """
    SMS 발송

    Args:
        receiver: 수신자 전화번호 (하이픈 포함/미포함 모두 가능)
        message: 메시지 내용 (90자 이내: SMS, 초과: LMS)
        title: LMS 제목 (선택)
        force_lms: 강제 LMS 발송 (메시지 잘림 방지)

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

    # 메시지 타입 결정 (한글은 45자 기준, force_lms면 무조건 LMS)
    # 한글 SMS는 약 45자까지, 그 이상은 LMS로 발송해야 잘리지 않음
    msg_type = "LMS" if force_lms or len(message) > 45 else "SMS"

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
                logger.info(f"SMS sent successfully to {receiver[:3]}***{receiver[-4:]} ({msg_type})")
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

    # 서비스 코드를 한글 명칭으로 변환
    service_names = [get_service_name(code) for code in services[:3]]
    services_str = ", ".join(service_names)
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
    협력사 등록 알림 SMS 발송 (관리자에게)

    Args:
        company_name: 회사/상호명
        contact_phone: 연락처
        service_areas: 서비스 분야 (서비스 코드)
    """
    admin_phone = settings.ALIGO_SENDER

    # 서비스 코드를 한글 명칭으로 변환
    service_names = [get_service_name(code) for code in service_areas[:3]]
    services_str = ", ".join(service_names)
    if len(service_areas) > 3:
        services_str += f" 외 {len(service_areas) - 3}건"

    message = f"""[전방홈케어] 신규 협력사 등록
업체명: {company_name}
연락처: {contact_phone}
서비스: {services_str}
관리자 페이지에서 확인해주세요."""

    return await send_sms(admin_phone, message, "[협력사등록]")


async def send_partner_assignment_notification(
    customer_phone: str,
    application_number: str,
    partner_name: str,
    partner_phone: str,
) -> dict:
    """
    협력사 배정 알림 SMS 발송 (고객에게)
    """
    message = f"""[전방홈케어] 서비스 배정 안내
신청번호: {application_number}
담당 협력사: {partner_name}
연락처: {partner_phone}
담당 협력사에서 곧 연락드릴 예정입니다."""

    return await send_sms(customer_phone, message, "[배정안내]")


async def send_schedule_confirmation(
    customer_phone: str,
    application_number: str,
    scheduled_date: str,
    scheduled_time: str,
    partner_name: Optional[str] = None,
) -> dict:
    """
    일정 확정 알림 SMS 발송 (고객에게)
    """
    time_str = scheduled_time or "시간 미정"
    partner_str = f"\n담당 협력사: {partner_name}" if partner_name else ""

    message = f"""[전방홈케어] 일정 확정 안내
신청번호: {application_number}
방문예정: {scheduled_date} {time_str}{partner_str}
방문 전 연락드리겠습니다."""

    return await send_sms(customer_phone, message, "[일정확정]")


async def send_partner_schedule_notification(
    partner_phone: str,
    application_number: str,
    customer_name: str,
    customer_phone: str,
    address: str,
    scheduled_date: str,
    scheduled_time: str,
    services: list[str],
) -> dict:
    """
    일정 확정 알림 SMS 발송 (협력사에게)
    """
    time_str = scheduled_time or "시간 미정"

    # 서비스 코드를 한글 명칭으로 변환
    service_names = [get_service_name(code) for code in services[:3]]
    services_str = ", ".join(service_names)
    if len(services) > 3:
        services_str += f" 외 {len(services) - 3}건"

    message = f"""[전방홈케어] 작업 일정 안내
신청번호: {application_number}
고객: {customer_name}
연락처: {customer_phone}
주소: {address[:30]}
일정: {scheduled_date} {time_str}
서비스: {services_str}"""

    return await send_sms(partner_phone, message, "[작업일정]")


async def send_sms_direct(
    receiver: str,
    message: str,
    sms_type: str = "manual",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    db: Optional[Session] = None,
    bulk_job_id: Optional[int] = None,
    batch_index: Optional[int] = None,
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
        bulk_job_id: 복수 발송 Job ID (복수 발송 시)
        batch_index: 배치 번호 (복수 발송 시)

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
                bulk_job_id=bulk_job_id,
                batch_index=batch_index,
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
