"""
Admin SMS API endpoints
관리자용 SMS 관리 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
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
from app.models.bulk_sms_job import BulkSMSJob
from app.models.application import Application
from app.models.partner import Partner
from app.schemas.sms_log import (
    SMSLogListResponse,
    SMSLogListItem,
    SMSSendRequest,
    SMSSendResponse,
    SMSStatsResponse,
)
from app.schemas.bulk_sms import (
    BulkSMSSendRequest,
    BulkSMSJobResponse,
    BulkSMSJobDetailResponse,
    BulkSMSJobListResponse,
    SMSRecipient,
    SMSRecipientsResponse,
    FailedRecipient,
)
from app.services.sms import send_sms, send_sms_direct
from app.services.bulk_sms import execute_bulk_sms_job

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


# ===== 복수 발송 (Bulk SMS) API =====


def mask_phone(phone: str) -> str:
    """전화번호 마스킹 (010-****-5678)"""
    phone = phone.replace("-", "")
    if len(phone) >= 8:
        return f"{phone[:3]}-****-{phone[-4:]}"
    return phone


@router.get("/recipients", response_model=SMSRecipientsResponse)
def get_sms_recipients(
    target_type: str = Query(..., description="대상 유형 (customer, partner)"),
    status: Optional[str] = Query(None, description="상태 필터"),
    search: Optional[str] = Query(None, description="검색어"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(50, ge=1, le=100, description="페이지 크기"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 수신자 목록 조회 (복수 발송용)

    - target_type: customer (고객) 또는 partner (협력사)
    - status: 상태 필터 (new, consulting, assigned, scheduled, completed, cancelled / pending, approved, rejected, inactive)
    - search: 이름 또는 신청번호/회사명 검색
    """
    if target_type not in ["customer", "partner"]:
        raise HTTPException(status_code=400, detail="target_type은 customer 또는 partner여야 합니다")

    recipients = []
    total = 0

    if target_type == "customer":
        query = db.query(Application)
        if status:
            query = query.filter(Application.status == status)
        total = query.count()

        # 페이징
        applications = (
            query.order_by(desc(Application.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        for app in applications:
            try:
                name = decrypt_value(app.customer_name)
                phone = decrypt_value(app.customer_phone)

                # 검색 필터 (복호화 후 적용)
                if search:
                    if search.lower() not in name.lower() and search not in app.application_number:
                        continue

                recipients.append(SMSRecipient(
                    id=app.id,
                    name=name,
                    phone=mask_phone(phone),
                    label=app.application_number,
                    type="customer",
                    status=app.status,
                ))
            except Exception:
                continue

    elif target_type == "partner":
        query = db.query(Partner)
        if status:
            query = query.filter(Partner.status == status)
        total = query.count()

        # 페이징
        partners = (
            query.order_by(desc(Partner.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        for partner in partners:
            try:
                phone = decrypt_value(partner.contact_phone)

                # 검색 필터
                if search and search.lower() not in partner.company_name.lower():
                    continue

                recipients.append(SMSRecipient(
                    id=partner.id,
                    name=partner.company_name,
                    phone=mask_phone(phone),
                    label=partner.company_name,
                    type="partner",
                    status=partner.status,
                ))
            except Exception:
                continue

    return SMSRecipientsResponse(
        items=recipients,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/bulk", response_model=BulkSMSJobResponse)
async def create_bulk_sms_job(
    data: BulkSMSSendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    복수 SMS 발송 Job 생성

    - job_type: announcement (공지), status_notify (상태별), manual_select (수동선택)
    - target_type: customer (고객) 또는 partner (협력사)
    - target_filter: 상태 필터 (예: {"status": "new"})
    - target_ids: 수동 선택 시 ID 목록 (예: [1, 2, 3])
    - message: 발송할 메시지 (2000자 이내)
    """
    # Job 생성
    job = BulkSMSJob(
        job_type=data.job_type,
        title=data.title,
        target_type=data.target_type,
        target_filter=data.target_filter,
        target_ids=data.target_ids,
        message=data.message,
        status="pending",
        created_by=current_admin.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 백그라운드에서 실행
    background_tasks.add_task(execute_bulk_sms_job, db, job.id)

    return BulkSMSJobResponse(
        job_id=job.id,
        status="pending",
        message="복수 SMS 발송 Job이 생성되었습니다. 백그라운드에서 처리 중입니다.",
    )


@router.get("/bulk/{job_id}", response_model=BulkSMSJobDetailResponse)
def get_bulk_sms_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    복수 SMS 발송 Job 상태 조회 (진행 상황 폴링용)
    """
    job = db.query(BulkSMSJob).filter(BulkSMSJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job을 찾을 수 없습니다")

    # 진행률 계산
    progress = 0.0
    if job.total_count and job.total_count > 0:
        progress = ((job.sent_count + job.failed_count) / job.total_count) * 100

    # 실패 수신자 변환
    failed_recipients = None
    if job.failed_recipients:
        failed_recipients = [
            FailedRecipient(**r) for r in job.failed_recipients
        ]

    return BulkSMSJobDetailResponse(
        id=job.id,
        job_type=job.job_type,
        title=job.title,
        target_type=job.target_type,
        status=job.status,
        total_count=job.total_count or 0,
        sent_count=job.sent_count or 0,
        failed_count=job.failed_count or 0,
        progress=round(progress, 1),
        current_batch=job.current_batch or 0,
        total_batches=job.total_batches or 0,
        failed_recipients=failed_recipients,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


@router.get("/bulk", response_model=BulkSMSJobListResponse)
def get_bulk_sms_jobs(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    status: Optional[str] = Query(None, description="상태 필터"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    복수 SMS 발송 Job 목록 조회
    """
    query = db.query(BulkSMSJob)

    if status:
        query = query.filter(BulkSMSJob.status == status)

    total = query.count()

    jobs = (
        query.order_by(desc(BulkSMSJob.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for job in jobs:
        # 진행률 계산
        progress = 0.0
        if job.total_count and job.total_count > 0:
            progress = ((job.sent_count + job.failed_count) / job.total_count) * 100

        # 실패 수신자 변환
        failed_recipients = None
        if job.failed_recipients:
            failed_recipients = [
                FailedRecipient(**r) for r in job.failed_recipients
            ]

        items.append(BulkSMSJobDetailResponse(
            id=job.id,
            job_type=job.job_type,
            title=job.title,
            target_type=job.target_type,
            status=job.status,
            total_count=job.total_count or 0,
            sent_count=job.sent_count or 0,
            failed_count=job.failed_count or 0,
            progress=round(progress, 1),
            current_batch=job.current_batch or 0,
            total_batches=job.total_batches or 0,
            failed_recipients=failed_recipients,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
        ))

    return BulkSMSJobListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
