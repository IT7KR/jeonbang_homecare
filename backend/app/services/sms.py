"""
SMS Service using Aligo API
알리고 SMS 발송 서비스
"""

import httpx
from typing import Optional
from datetime import datetime, date, timezone
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.encryption import encrypt_value, decrypt_value
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


# ===== SMS 템플릿 조회 =====

def get_template_message(
    template_key: str,
    db: Optional[Session] = None,
    **kwargs,
) -> Optional[str]:
    """
    데이터베이스에서 SMS 템플릿을 조회하고 변수를 치환합니다.

    Args:
        template_key: 템플릿 키 (예: 'new_application', 'partner_assigned')
        db: 데이터베이스 세션 (없으면 자동 생성)
        **kwargs: 템플릿 변수 (예: customer_name="홍길동")

    Returns:
        변수가 치환된 메시지 문자열, 템플릿이 없거나 비활성이면 None
    """
    from app.models.sms_template import SMSTemplate

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        template = db.query(SMSTemplate).filter(
            SMSTemplate.template_key == template_key,
            SMSTemplate.is_active == True,
        ).first()

        if not template:
            logger.warning(f"SMS template '{template_key}' not found or inactive")
            return None

        return template.format_message(**kwargs)
    except Exception as e:
        logger.error(f"Failed to get SMS template '{template_key}': {e}")
        return None
    finally:
        if close_db:
            db.close()


def get_admin_phones() -> list[str]:
    """
    활성 관리자들의 전화번호 목록 조회

    Returns:
        전화번호 리스트 (phone이 설정된 활성 관리자만)
    """
    from app.models.admin import Admin

    db = SessionLocal()
    try:
        admins = db.query(Admin).filter(
            Admin.is_active == True,
            Admin.phone.isnot(None),
            Admin.phone != ""
        ).all()

        # 암호화된 전화번호를 복호화하여 반환
        phones = []
        for admin in admins:
            decrypted_phone = decrypt_value(admin.phone)
            if decrypted_phone:
                phones.append(decrypted_phone)
        logger.info(f"Found {len(phones)} admin(s) for SMS notification")
        return phones
    except Exception as e:
        logger.error(f"Failed to get admin phones: {e}")
        return []
    finally:
        db.close()

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
    preferred_consultation_date: Optional[date] = None,
    preferred_work_date: Optional[date] = None,
) -> list[dict]:
    """
    서비스 신청 알림 SMS 발송 (모든 활성 관리자에게)

    Args:
        application_number: 신청번호
        customer_phone: 고객 전화번호
        services: 신청 서비스 목록 (서비스 코드)
        preferred_consultation_date: 희망 상담일
        preferred_work_date: 희망 작업일

    Returns:
        각 관리자별 발송 결과 리스트
    """
    # 활성 관리자들의 전화번호 조회
    admin_phones = get_admin_phones()

    if not admin_phones:
        logger.warning("No admin phones found for notification")
        return []

    # 서비스 코드를 한글 명칭으로 변환
    service_names = [get_service_name(code) for code in services[:3]]
    services_str = ", ".join(service_names)
    if len(services) > 3:
        services_str += f" 외 {len(services) - 3}건"

    # 희망 일정 정보 구성
    schedule_info = ""
    if preferred_consultation_date:
        schedule_info += f"\n희망상담일: {preferred_consultation_date.strftime('%Y-%m-%d')}"
    if preferred_work_date:
        schedule_info += f"\n희망작업일: {preferred_work_date.strftime('%Y-%m-%d')}"

    message = f"""[전방홈케어] 신규 서비스 신청
신청번호: {application_number}
고객연락처: {customer_phone}
서비스: {services_str}{schedule_info}
관리자 페이지에서 확인해주세요."""

    # 모든 관리자에게 발송
    results = []
    for phone in admin_phones:
        result = await send_sms(phone, message, "[신규신청]")
        results.append({"phone": phone, "result": result})

    return results


async def send_partner_notification(
    company_name: str,
    contact_phone: str,
    service_areas: list[str],
) -> list[dict]:
    """
    협력사 등록 알림 SMS 발송 (모든 활성 관리자에게)

    Args:
        company_name: 회사/상호명
        contact_phone: 연락처
        service_areas: 서비스 분야 (서비스 코드)

    Returns:
        각 관리자별 발송 결과 리스트
    """
    # 활성 관리자들의 전화번호 조회
    admin_phones = get_admin_phones()

    if not admin_phones:
        logger.warning("No admin phones found for notification")
        return []

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

    # 모든 관리자에게 발송
    results = []
    for phone in admin_phones:
        result = await send_sms(phone, message, "[협력사등록]")
        results.append({"phone": phone, "result": result})

    return results


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


async def send_partner_approval_notification(
    partner_phone: str,
    partner_name: str,
    approved: bool,
    rejection_reason: Optional[str] = None,
) -> dict:
    """
    협력사 승인/거절 알림 SMS 발송 (협력사에게)

    Args:
        partner_phone: 협력사 연락처
        partner_name: 협력사명/대표자명
        approved: 승인 여부
        rejection_reason: 거절 사유 (거절 시)

    Returns:
        발송 결과
    """
    if approved:
        message = f"""[전방홈케어] 협력사 등록 승인
{partner_name}님, 협력사 등록이 승인되었습니다.
앞으로 전방홈케어와 함께해주세요.
감사합니다."""
    else:
        reason = f"\n사유: {rejection_reason}" if rejection_reason else ""
        message = f"""[전방홈케어] 협력사 등록 반려
{partner_name}님, 죄송합니다.
협력사 등록이 반려되었습니다.{reason}
문의사항이 있으시면 연락주세요."""

    return await send_sms(partner_phone, message, "[협력사안내]")


async def send_application_cancelled_notification(
    customer_phone: str,
    application_number: str,
    cancel_reason: Optional[str] = None,
) -> dict:
    """
    신청 취소 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        cancel_reason: 취소 사유

    Returns:
        발송 결과
    """
    reason = f"\n사유: {cancel_reason}" if cancel_reason else ""
    message = f"""[전방홈케어] 신청 취소 안내
신청번호: {application_number}
해당 신청이 취소되었습니다.{reason}
문의사항이 있으시면 연락주세요."""

    return await send_sms(customer_phone, message, "[신청취소]")


async def send_completion_notification(
    customer_phone: str,
    application_number: str,
    partner_name: Optional[str] = None,
) -> dict:
    """
    작업 완료 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        partner_name: 협력사명

    Returns:
        발송 결과
    """
    partner_str = f"\n담당: {partner_name}" if partner_name else ""
    message = f"""[전방홈케어] 작업 완료 안내
신청번호: {application_number}{partner_str}
서비스가 완료되었습니다.
이용해주셔서 감사합니다."""

    return await send_sms(customer_phone, message, "[완료안내]")


async def send_schedule_changed_notification(
    customer_phone: str,
    partner_phone: Optional[str],
    application_number: str,
    old_date: str,
    new_date: str,
    new_time: Optional[str] = None,
) -> dict:
    """
    일정 변경 알림 SMS 발송 (고객 및 협력사에게)

    Args:
        customer_phone: 고객 연락처
        partner_phone: 협력사 연락처 (없으면 고객에게만)
        application_number: 신청번호
        old_date: 기존 일정
        new_date: 변경된 일정
        new_time: 변경된 시간

    Returns:
        발송 결과
    """
    time_str = new_time or "시간 미정"
    message = f"""[전방홈케어] 일정 변경 안내
신청번호: {application_number}
기존일정: {old_date}
변경일정: {new_date} {time_str}
변경된 일정을 확인해주세요."""

    # 고객에게 발송
    customer_result = await send_sms(customer_phone, message, "[일정변경]")

    # 협력사에게도 발송
    if partner_phone:
        await send_sms(partner_phone, message, "[일정변경]")

    return customer_result


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
