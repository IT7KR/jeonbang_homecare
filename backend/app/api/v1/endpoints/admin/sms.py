"""
Admin SMS API endpoints
관리자용 SMS 관리 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional
from datetime import datetime, timezone, timedelta
import math

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value, encrypt_value
from app.core.config import settings
from app.models.admin import Admin
from app.models.sms_log import SMSLog
from app.schemas.sms_log import (
    SMSLogListResponse,
    SMSLogListItem,
    SMSSendRequest,
    SMSSendResponse,
    SMSStatsResponse,
)
from app.services.sms import send_sms, send_sms_direct

router = APIRouter(prefix="/sms", tags=["Admin - SMS"])


@router.get("/test-config")
def test_sms_config(
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS API 설정 상태 확인 (연동 테스트용)

    알리고 API 키 설정 여부 확인
    """
    has_api_key = bool(settings.ALIGO_API_KEY)
    has_user_id = bool(settings.ALIGO_USER_ID)
    has_sender = bool(settings.ALIGO_SENDER)

    # 발신번호 마스킹 (끝 4자리만 표시)
    masked_sender = None
    if has_sender:
        sender = settings.ALIGO_SENDER.replace("-", "")
        masked_sender = f"***-****-{sender[-4:]}"

    return {
        "configured": has_api_key and has_user_id and has_sender,
        "api_key_set": has_api_key,
        "user_id_set": has_user_id,
        "sender_set": has_sender,
        "sender": masked_sender,
        "mode": "production" if has_api_key else "development (SMS disabled)",
    }


@router.post("/test-send")
async def test_sms_send(
    test_phone: str = Query(..., description="테스트 수신 번호 (본인 번호)"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 발송 테스트 (관리자 본인 번호로 테스트)

    실제 SMS가 발송됩니다. 테스트 비용이 발생합니다.
    """
    # 테스트 메시지
    test_message = f"""[전방홈케어] SMS 연동 테스트
테스트 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
관리자: {current_admin.name}
이 메시지가 정상 수신되면 SMS 연동이 완료된 것입니다."""

    try:
        result = await send_sms(test_phone, test_message, "[테스트]")

        success = result.get("result_code") == "1"

        return {
            "success": success,
            "result_code": result.get("result_code"),
            "message": result.get("message"),
            "msg_id": result.get("msg_id"),
            "test_phone": f"{test_phone[:3]}****{test_phone[-4:]}",
            "note": "테스트 SMS가 발송되었습니다. 수신을 확인해주세요." if success else "SMS 발송에 실패했습니다. 설정을 확인해주세요.",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "note": "SMS 발송 중 오류가 발생했습니다.",
        }


def decrypt_sms_log(log: SMSLog) -> dict:
    """SMS 로그의 암호화된 필드를 복호화"""
    return {
        "id": log.id,
        "receiver_phone": decrypt_value(log.receiver_phone),
        "message": log.message,
        "sms_type": log.sms_type,
        "reference_type": log.reference_type,
        "reference_id": log.reference_id,
        "status": log.status,
        "result_code": log.result_code,
        "result_message": log.result_message,
        "created_at": log.created_at,
        "sent_at": log.sent_at,
    }


@router.get("/stats", response_model=SMSStatsResponse)
def get_sms_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 발송 통계 조회
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 전체 통계
    total_sent = db.query(func.count(SMSLog.id)).filter(SMSLog.status == "sent").scalar() or 0
    total_failed = db.query(func.count(SMSLog.id)).filter(SMSLog.status == "failed").scalar() or 0

    # 오늘 통계
    today_sent = (
        db.query(func.count(SMSLog.id))
        .filter(SMSLog.status == "sent", SMSLog.created_at >= today_start)
        .scalar() or 0
    )
    today_failed = (
        db.query(func.count(SMSLog.id))
        .filter(SMSLog.status == "failed", SMSLog.created_at >= today_start)
        .scalar() or 0
    )

    # 이번 달 통계
    this_month_sent = (
        db.query(func.count(SMSLog.id))
        .filter(SMSLog.status == "sent", SMSLog.created_at >= month_start)
        .scalar() or 0
    )
    this_month_failed = (
        db.query(func.count(SMSLog.id))
        .filter(SMSLog.status == "failed", SMSLog.created_at >= month_start)
        .scalar() or 0
    )

    return SMSStatsResponse(
        total_sent=total_sent,
        total_failed=total_failed,
        today_sent=today_sent,
        today_failed=today_failed,
        this_month_sent=this_month_sent,
        this_month_failed=this_month_failed,
    )


@router.get("", response_model=SMSLogListResponse)
def get_sms_logs(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    status: Optional[str] = Query(None, description="상태 필터"),
    sms_type: Optional[str] = Query(None, description="유형 필터"),
    search: Optional[str] = Query(None, description="검색어 (수신번호)"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 발송 로그 목록 조회
    """
    query = db.query(SMSLog)

    # 상태 필터
    if status:
        query = query.filter(SMSLog.status == status)

    # 유형 필터
    if sms_type:
        query = query.filter(SMSLog.sms_type == sms_type)

    # 전체 개수
    total = query.count()

    # 정렬 및 페이징
    logs = (
        query.order_by(desc(SMSLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # 복호화된 목록 생성
    items = []
    for log in logs:
        decrypted = decrypt_sms_log(log)
        # 검색 필터 (복호화 후 적용)
        if search and search not in decrypted["receiver_phone"]:
            continue
        items.append(SMSLogListItem(**decrypted))

    return SMSLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/send", response_model=SMSSendResponse)
async def send_manual_sms(
    data: SMSSendRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 수동 발송 (관리자)
    """
    try:
        # SMS 발송
        result = await send_sms_direct(
            receiver=data.receiver_phone,
            message=data.message,
            sms_type=data.sms_type,
            db=db,
        )

        if result.get("success"):
            return SMSSendResponse(
                success=True,
                message="SMS가 발송되었습니다",
                sms_log_id=result.get("sms_log_id"),
            )
        else:
            return SMSSendResponse(
                success=False,
                message=result.get("error", "SMS 발송에 실패했습니다"),
                sms_log_id=result.get("sms_log_id"),
            )
    except Exception as e:
        return SMSSendResponse(
            success=False,
            message=f"SMS 발송 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/retry/{log_id}", response_model=SMSSendResponse)
async def retry_sms(
    log_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    실패한 SMS 재발송
    """
    log = db.query(SMSLog).filter(SMSLog.id == log_id).first()

    if not log:
        raise HTTPException(status_code=404, detail="SMS 로그를 찾을 수 없습니다")

    if log.status != "failed":
        raise HTTPException(status_code=400, detail="실패한 SMS만 재발송할 수 있습니다")

    # 복호화
    receiver_phone = decrypt_value(log.receiver_phone)

    try:
        # SMS 재발송
        result = await send_sms_direct(
            receiver=receiver_phone,
            message=log.message,
            sms_type=f"{log.sms_type}_retry",
            reference_type=log.reference_type,
            reference_id=log.reference_id,
            db=db,
        )

        if result.get("success"):
            return SMSSendResponse(
                success=True,
                message="SMS가 재발송되었습니다",
                sms_log_id=result.get("sms_log_id"),
            )
        else:
            return SMSSendResponse(
                success=False,
                message=result.get("error", "SMS 재발송에 실패했습니다"),
                sms_log_id=result.get("sms_log_id"),
            )
    except Exception as e:
        return SMSSendResponse(
            success=False,
            message=f"SMS 재발송 중 오류가 발생했습니다: {str(e)}",
        )
