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


def format_services_list(service_codes: list[str], max_display: int = 3) -> str:
    """
    서비스 코드 리스트를 한글 문자열로 변환

    Args:
        service_codes: 서비스 코드 리스트
        max_display: 표시할 최대 서비스 수 (초과 시 "외 N건" 표시)

    Returns:
        포맷팅된 문자열 (예: "제초 작업, 정원 관리 외 2건")
    """
    if not service_codes:
        return ""

    service_names = [get_service_name(code) for code in service_codes[:max_display]]
    result = ", ".join(service_names)

    if len(service_codes) > max_display:
        result += f" 외 {len(service_codes) - max_display}건"

    return result


def format_schedule_info(
    consultation_date: Optional[date] = None,
    work_date: Optional[date] = None,
) -> str:
    """
    희망 일정 정보 포맷팅

    Args:
        consultation_date: 희망 상담일
        work_date: 희망 작업일

    Returns:
        포맷팅된 일정 문자열
    """
    parts = []
    if consultation_date:
        parts.append(f"상담 {consultation_date.strftime('%Y-%m-%d')}")
    if work_date:
        parts.append(f"작업 {work_date.strftime('%Y-%m-%d')}")

    return ", ".join(parts) if parts else "미정"


def build_message_from_template(
    template_key: str,
    variables: dict,
    db: Session,
) -> Optional[str]:
    """
    템플릿 기반 메시지 생성

    Args:
        template_key: 템플릿 키
        variables: 변수 딕셔너리
        db: 데이터베이스 세션

    Returns:
        str: 변수 치환된 메시지
        None: 템플릿 없거나 비활성화 시 (발송 중단)
    """
    message = get_template_message(template_key, db=db, **variables)
    if message is None:
        logger.warning(f"SMS 템플릿 없음/비활성: {template_key} - 발송 중단")
    return message


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


async def send_mms(
    receiver: str,
    message: str,
    title: Optional[str] = None,
    image1: Optional[str] = None,
    image2: Optional[str] = None,
    image3: Optional[str] = None,
) -> dict:
    """
    MMS 발송 (이미지 첨부)

    Args:
        receiver: 수신자 전화번호
        message: 메시지 내용
        title: MMS 제목 (선택)
        image1, image2, image3: Base64 인코딩된 이미지 데이터 (data:image/...;base64,... 형태)

    Returns:
        API 응답 결과
    """
    import base64
    import tempfile
    from pathlib import Path

    # 전화번호 형식 정리 (하이픈 제거)
    receiver = receiver.replace("-", "")

    # API 키가 설정되지 않은 경우 (개발 환경)
    if not settings.ALIGO_API_KEY:
        logger.warning("ALIGO_API_KEY is not set. MMS not sent.")
        return {
            "result_code": "-1",
            "message": "SMS API key not configured (development mode)",
            "msg_id": None,
        }

    # 이미지가 있으면 MMS, 없으면 LMS/SMS
    images = [img for img in [image1, image2, image3] if img]
    msg_type = "MMS" if images else ("LMS" if len(message) > 45 else "SMS")

    # API 요청 데이터
    data = {
        "key": settings.ALIGO_API_KEY,
        "user_id": settings.ALIGO_USER_ID,
        "sender": settings.ALIGO_SENDER.replace("-", ""),
        "receiver": receiver,
        "msg": message,
        "msg_type": msg_type,
    }

    if msg_type in ["LMS", "MMS"] and title:
        data["title"] = title

    # 임시 파일 목록 (정리용)
    temp_files = []
    files = {}

    try:
        # Base64 이미지를 임시 파일로 변환
        for idx, base64_data in enumerate(images, start=1):
            try:
                # data:image/jpeg;base64,... 형태에서 실제 데이터 추출
                if ";base64," in base64_data:
                    header, encoded = base64_data.split(";base64,", 1)
                    # 확장자 결정
                    if "jpeg" in header or "jpg" in header:
                        ext = ".jpg"
                    elif "png" in header:
                        ext = ".png"
                    elif "gif" in header:
                        ext = ".gif"
                    else:
                        ext = ".jpg"  # 기본값
                else:
                    encoded = base64_data
                    ext = ".jpg"

                image_bytes = base64.b64decode(encoded)

                # 임시 파일 생성
                temp_file = tempfile.NamedTemporaryFile(
                    delete=False,
                    suffix=ext,
                    prefix=f"mms_image{idx}_"
                )
                temp_file.write(image_bytes)
                temp_file.flush()
                temp_file.close()
                temp_files.append(temp_file.name)

                # files 딕셔너리에 추가 (파일 핸들)
                files[f"image{idx}"] = (
                    f"image{idx}{ext}",
                    open(temp_file.name, "rb"),
                    f"image/{ext[1:]}"
                )
            except Exception as e:
                logger.error(f"Failed to process image{idx}: {e}")
                continue

        # API 요청
        async with httpx.AsyncClient(timeout=30.0) as client:
            if files:
                response = await client.post(ALIGO_API_URL, data=data, files=files)
            else:
                response = await client.post(ALIGO_API_URL, data=data)

            result = response.json()

            if result.get("result_code") == "1":
                logger.info(f"MMS sent successfully to {receiver[:3]}***{receiver[-4:]} (images: {len(images)})")
            else:
                logger.error(f"MMS send failed: {result.get('message')}")

            return result
    except Exception as e:
        logger.error(f"MMS send error: {str(e)}")
        return {
            "result_code": "-1",
            "message": str(e),
            "msg_id": None,
        }
    finally:
        # 파일 핸들 닫기
        for key in files:
            try:
                files[key][1].close()
            except Exception:
                pass

        # 임시 파일 삭제
        for temp_path in temp_files:
            try:
                Path(temp_path).unlink()
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_path}: {e}")


async def send_application_notification(
    application_number: str,
    customer_phone: str,
    services: list[str],
    preferred_consultation_date: Optional[date] = None,
    preferred_work_date: Optional[date] = None,
    db: Optional[Session] = None,
) -> list[dict]:
    """
    서비스 신청 알림 SMS 발송 (모든 활성 관리자에게)

    Args:
        application_number: 신청번호
        customer_phone: 고객 전화번호
        services: 신청 서비스 목록 (서비스 코드)
        preferred_consultation_date: 희망 상담일
        preferred_work_date: 희망 작업일
        db: 데이터베이스 세션

    Returns:
        각 관리자별 발송 결과 리스트
    """
    template_key = "admin_new_application"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 활성 관리자들의 전화번호 조회
        admin_phones = get_admin_phones()

        if not admin_phones:
            logger.warning("No admin phones found for notification")
            return []

        # 템플릿 변수 준비
        variables = {
            "application_number": application_number,
            "customer_phone": customer_phone,
            "services": format_services_list(services),
            "schedule_info": format_schedule_info(
                preferred_consultation_date, preferred_work_date
            ),
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return []

        # 모든 관리자에게 발송
        results = []
        for phone in admin_phones:
            result = await send_sms(phone, message, "[신규신청]")
            results.append({"phone": phone, "result": result})

        return results
    finally:
        if close_db:
            db.close()


async def send_partner_notification(
    company_name: str,
    contact_phone: str,
    service_areas: list[str],
    db: Optional[Session] = None,
) -> list[dict]:
    """
    협력사 등록 알림 SMS 발송 (모든 활성 관리자에게)

    Args:
        company_name: 회사/상호명
        contact_phone: 연락처
        service_areas: 서비스 분야 (서비스 코드)
        db: 데이터베이스 세션

    Returns:
        각 관리자별 발송 결과 리스트
    """
    template_key = "admin_new_partner"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 활성 관리자들의 전화번호 조회
        admin_phones = get_admin_phones()

        if not admin_phones:
            logger.warning("No admin phones found for notification")
            return []

        # 템플릿 변수 준비
        variables = {
            "company_name": company_name,
            "contact_phone": contact_phone,
            "services": format_services_list(service_areas),
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return []

        # 모든 관리자에게 발송
        results = []
        for phone in admin_phones:
            result = await send_sms(phone, message, "[협력사등록]")
            results.append({"phone": phone, "result": result})

        return results
    finally:
        if close_db:
            db.close()


async def send_partner_assignment_notification(
    customer_phone: str,
    application_number: str,
    partner_name: str,
    partner_phone: str,
    customer_name: str = "",
    scheduled_date: str = "",
    scheduled_time: str = "",
    estimated_cost: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    협력사 배정 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        partner_name: 협력사명
        partner_phone: 협력사 연락처
        customer_name: 고객명 (템플릿 변수용)
        scheduled_date: 예정일 (예: "2025-01-15" 또는 "미정")
        scheduled_time: 예정 시간 (예: "오전 10시" 또는 "미정")
        estimated_cost: 견적 비용 (예: "150,000원" 또는 "협의")
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "partner_assigned"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "customer_name": customer_name,
            "application_number": application_number,
            "partner_name": partner_name,
            "partner_phone": partner_phone,
            "scheduled_date": scheduled_date or "미정",
            "scheduled_time": scheduled_time or "미정",
            "estimated_cost": estimated_cost or "협의",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(customer_phone, message, "[배정안내]")
    finally:
        if close_db:
            db.close()


async def send_partner_notify_assignment(
    partner_phone: str,
    application_number: str,
    customer_name: str,
    customer_phone: str,
    address: str,
    services: list[str],
    scheduled_date: str = "",
    view_url: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    협력사 배정 알림 SMS 발송 (협력사에게)

    Args:
        partner_phone: 협력사 연락처
        application_number: 신청번호
        customer_name: 고객명
        customer_phone: 고객 연락처
        address: 서비스 주소
        services: 서비스 코드 리스트
        scheduled_date: 예정일 (선택)
        view_url: 신청 상세 열람 URL (협력사 포털)
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "partner_notify_assignment"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "application_number": application_number,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "address": address[:30] if address else "",
            "services": format_services_list(services),
            "scheduled_date": scheduled_date or "미정",
            "view_url": view_url,
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(partner_phone, message, "[배정알림]")
    finally:
        if close_db:
            db.close()


async def send_schedule_confirmation(
    customer_phone: str,
    application_number: str,
    scheduled_date: str,
    scheduled_time: str,
    partner_name: Optional[str] = None,
    customer_name: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    일정 확정 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        scheduled_date: 예정 날짜
        scheduled_time: 예정 시간
        partner_name: 협력사명
        customer_name: 고객명 (템플릿 변수용)
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "schedule_confirmed"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "customer_name": customer_name,
            "application_number": application_number,
            "scheduled_date": scheduled_date,
            "scheduled_time": scheduled_time or "시간 미정",
            "partner_name": partner_name or "",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(customer_phone, message, "[일정확정]")
    finally:
        if close_db:
            db.close()


async def send_partner_schedule_notification(
    partner_phone: str,
    application_number: str,
    customer_name: str,
    customer_phone: str,
    address: str,
    scheduled_date: str,
    scheduled_time: str,
    services: list[str],
    db: Optional[Session] = None,
) -> dict:
    """
    일정 확정 알림 SMS 발송 (협력사에게)

    Args:
        partner_phone: 협력사 연락처
        application_number: 신청번호
        customer_name: 고객명
        customer_phone: 고객 연락처
        address: 서비스 주소
        scheduled_date: 예정 날짜
        scheduled_time: 예정 시간
        services: 서비스 코드 리스트
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "partner_schedule_notify"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "application_number": application_number,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "address": address[:30] if address else "",
            "scheduled_date": scheduled_date,
            "scheduled_time": scheduled_time or "시간 미정",
            "services": format_services_list(services),
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(partner_phone, message, "[작업일정]")
    finally:
        if close_db:
            db.close()


async def send_partner_approval_notification(
    partner_phone: str,
    partner_name: str,
    approved: bool,
    rejection_reason: Optional[str] = None,
    company_name: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    협력사 승인/거절 알림 SMS 발송 (협력사에게)

    Args:
        partner_phone: 협력사 연락처
        partner_name: 협력사명/대표자명
        approved: 승인 여부
        rejection_reason: 거절 사유 (거절 시)
        company_name: 회사명 (템플릿 변수용)
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "partner_approved" if approved else "partner_rejected"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "company_name": company_name or partner_name,
            "representative_name": partner_name,
            "rejection_reason": rejection_reason or "",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(partner_phone, message, "[협력사안내]")
    finally:
        if close_db:
            db.close()


async def send_application_cancelled_notification(
    customer_phone: str,
    application_number: str,
    cancel_reason: Optional[str] = None,
    customer_name: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    신청 취소 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        cancel_reason: 취소 사유
        customer_name: 고객명 (템플릿 변수용)
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "application_cancelled"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비 (취소 사유 기본값: 고객 요청)
        variables = {
            "customer_name": customer_name,
            "application_number": application_number,
            "cancel_reason": cancel_reason or "고객 요청",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(customer_phone, message, "[신청취소]")
    finally:
        if close_db:
            db.close()


async def send_assignment_changed_notification(
    customer_phone: str,
    application_number: str,
    customer_name: str = "",
    scheduled_date: str = "",
    scheduled_time: str = "",
    estimated_cost: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    배정 정보 변경 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        customer_name: 고객명 (템플릿 변수용)
        scheduled_date: 변경된 예정일
        scheduled_time: 변경된 예정 시간
        estimated_cost: 변경된 견적 비용
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "assignment_changed"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "customer_name": customer_name,
            "application_number": application_number,
            "scheduled_date": scheduled_date or "미정",
            "scheduled_time": scheduled_time or "미정",
            "estimated_cost": estimated_cost or "협의",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(customer_phone, message, "[배정변경]")
    finally:
        if close_db:
            db.close()


async def send_completion_notification(
    customer_phone: str,
    application_number: str,
    partner_name: Optional[str] = None,
    customer_name: str = "",
    db: Optional[Session] = None,
) -> dict:
    """
    작업 완료 알림 SMS 발송 (고객에게)

    Args:
        customer_phone: 고객 연락처
        application_number: 신청번호
        partner_name: 협력사명
        customer_name: 고객명 (템플릿 변수용)
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "service_completed"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "customer_name": customer_name,
            "application_number": application_number,
            "partner_name": partner_name or "",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        return await send_sms(customer_phone, message, "[완료안내]")
    finally:
        if close_db:
            db.close()


async def send_schedule_changed_notification(
    customer_phone: str,
    partner_phone: Optional[str],
    application_number: str,
    old_date: str,
    new_date: str,
    new_time: Optional[str] = None,
    db: Optional[Session] = None,
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
        db: 데이터베이스 세션

    Returns:
        발송 결과
    """
    template_key = "schedule_changed"

    # DB 세션 확보
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 템플릿 변수 준비
        variables = {
            "application_number": application_number,
            "old_date": old_date,
            "new_date": new_date,
            "new_time": new_time or "시간 미정",
        }

        # 템플릿 기반 메시지 생성
        message = build_message_from_template(template_key, variables, db)

        if message is None:
            return {"result_code": "-1", "message": "템플릿 없음/비활성"}

        # 고객에게 발송
        customer_result = await send_sms(customer_phone, message, "[일정변경]")

        # 협력사에게도 발송
        if partner_phone:
            await send_sms(partner_phone, message, "[일정변경]")

        return customer_result
    finally:
        if close_db:
            db.close()


async def send_sms_direct(
    receiver: str,
    message: str,
    sms_type: str = "manual",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    db: Optional[Session] = None,
    bulk_job_id: Optional[int] = None,
    batch_index: Optional[int] = None,
    template_key: Optional[str] = None,
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
        template_key: 사용된 템플릿 키 (템플릿 발송 시)

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
                template_key=template_key,
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
