"""
Admin Application API endpoints
관리자용 신청 관리 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, List
from datetime import datetime, timezone, date
import math
import logging

from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.encryption import decrypt_value
from app.core.file_token import get_file_url
from app.models.admin import Admin
from app.models.application import Application
from app.models.application_note import ApplicationNote
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.partner import Partner
from app.schemas.application import (
    ApplicationListResponse,
    ApplicationListItem,
    ApplicationDetailResponse,
    ApplicationUpdate,
    BulkAssignRequest,
    BulkAssignResponse,
    BulkAssignResult,
    ScheduleConflict,
    AssignmentSummary,
)
from app.schemas.application_assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentListResponse,
    CustomerUrlExtend,
    PartnerUrlExtend,
)
from app.schemas.application_note import (
    ApplicationNoteCreate,
    ApplicationNoteResponse,
    ApplicationNotesListResponse,
)
from app.services.sms import (
    send_partner_assignment_notification,
    send_partner_notify_assignment,
    send_schedule_confirmation,
    send_partner_schedule_notification,
    send_application_cancelled_notification,
    send_completion_notification,
    send_schedule_changed_notification,
    send_assignment_changed_notification,
    send_application_received_notification,
)
from app.api.v1.endpoints.partner_portal import (
    get_partner_view_url,
    generate_partner_view_token,
)
from app.services.application_status import (
    check_status_transition,
    ASSIGNABLE_STATUSES,
)
from app.services.audit import (
    log_status_change,
    log_assignment,
    log_schedule_change,
    log_cost_change,
    log_bulk_assignment,
    log_change,
)
from app.services.search_index import unified_search, detect_search_type
from app.services.duplicate_check import get_customer_applications
from app.services.status_sync import sync_application_from_assignments
from app.services.service_utils import convert_service_codes_to_names

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["Admin - Applications"])


def decrypt_application(app: Application, db: Session) -> dict:
    """Application 모델의 암호화된 필드를 복호화 및 서비스 코드→이름 변환"""
    return {
        "id": app.id,
        "application_number": app.application_number,
        "customer_name": decrypt_value(app.customer_name),
        "customer_phone": decrypt_value(app.customer_phone),
        "address": decrypt_value(app.address),
        "address_detail": decrypt_value(app.address_detail) if app.address_detail else None,
        "selected_services": convert_service_codes_to_names(db, app.selected_services),
        "description": app.description,
        "photos": [get_file_url(photo) for photo in (app.photos or [])],
        "preferred_consultation_date": app.preferred_consultation_date,
        "preferred_work_date": app.preferred_work_date,
        "status": app.status,
        "assigned_partner_id": app.assigned_partner_id,
        "assigned_admin_id": app.assigned_admin_id,
        "scheduled_date": str(app.scheduled_date) if app.scheduled_date else None,
        "scheduled_time": app.scheduled_time,
        "estimated_cost": app.estimated_cost,
        "final_cost": app.final_cost,
        "admin_memo": app.admin_memo,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "completed_at": app.completed_at,
        "cancelled_at": app.cancelled_at,
    }


@router.get("", response_model=ApplicationListResponse)
def get_applications(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    status: Optional[str] = Query(None, description="상태 필터"),
    search: Optional[str] = Query(None, description="통합 검색어 (신청번호/고객명/연락처)"),
    search_type: Optional[str] = Query(None, description="검색 타입 (auto/name/phone/number)"),
    date_from: Optional[date] = Query(None, description="신청일 시작"),
    date_to: Optional[date] = Query(None, description="신청일 종료"),
    services: Optional[str] = Query(None, description="서비스 필터 (콤마 구분)"),
    assigned_admin_id: Optional[int] = Query(None, description="담당 관리자 ID"),
    assigned_partner_id: Optional[int] = Query(None, description="배정 협력사 ID"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 목록 조회 (관리자용)

    - 페이징 지원
    - 상태 필터링
    - 통합 검색 (신청번호/고객명/연락처 자동 감지)
    - 날짜 범위 필터
    - 서비스 필터
    - 담당자 필터
    """
    query = db.query(Application)

    # 상태 필터
    if status:
        query = query.filter(Application.status == status)

    # 통합 검색
    if search:
        # 검색 타입 자동 감지 또는 지정된 타입 사용
        detected_type = search_type if search_type and search_type != "auto" else detect_search_type(search)

        if detected_type == "number":
            # 신청번호 검색 (DB 직접 검색)
            # 하이픈 없는 형식(20251231001)을 하이픈 있는 형식(20251231-001)으로 변환
            import re
            search_normalized = search
            if re.match(r'^\d{9,11}$', search):
                # 하이픈 없는 형식: 앞 8자리-나머지
                search_normalized = f"{search[:8]}-{search[8:]}"
            query = query.filter(Application.application_number.ilike(f"%{search_normalized}%"))
        elif detected_type in ("phone", "name"):
            # 암호화된 필드 검색 (인덱스 테이블 사용)
            matching_ids = unified_search(db, "application", search, detected_type)
            if matching_ids:
                query = query.filter(Application.id.in_(matching_ids))
            else:
                # 검색 결과 없음 - 빈 결과 반환
                query = query.filter(Application.id == -1)

    # 날짜 범위 필터
    if date_from:
        query = query.filter(Application.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(Application.created_at <= datetime.combine(date_to, datetime.max.time()))

    # 서비스 필터 (JSONB 배열에서 검색)
    if services:
        service_list = [s.strip() for s in services.split(",") if s.strip()]
        if service_list:
            # selected_services 배열에 지정된 서비스 중 하나라도 포함된 경우
            service_conditions = [
                Application.selected_services.contains([svc])
                for svc in service_list
            ]
            query = query.filter(or_(*service_conditions))

    # 담당 관리자 필터
    if assigned_admin_id:
        query = query.filter(Application.assigned_admin_id == assigned_admin_id)

    # 배정 협력사 필터
    if assigned_partner_id:
        query = query.filter(Application.assigned_partner_id == assigned_partner_id)

    # 전체 개수
    total = query.count()

    # 정렬 및 페이징
    applications = (
        query.order_by(desc(Application.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # 복호화된 목록 생성
    items = []
    for app in applications:
        decrypted = decrypt_application(app, db)
        items.append(ApplicationListItem(
            id=decrypted["id"],
            application_number=decrypted["application_number"],
            customer_name=decrypted["customer_name"],
            customer_phone=decrypted["customer_phone"],
            address=decrypted["address"],
            selected_services=decrypted["selected_services"],
            status=decrypted["status"],
            assigned_partner_id=decrypted["assigned_partner_id"],
            scheduled_date=decrypted["scheduled_date"],
            preferred_consultation_date=decrypted["preferred_consultation_date"],
            preferred_work_date=decrypted["preferred_work_date"],
            created_at=decrypted["created_at"],
        ))

    return ApplicationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/bulk-assign", response_model=BulkAssignResponse)
async def bulk_assign_applications(
    data: BulkAssignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 일괄 배정 (관리자용)

    - 다수의 신청을 한 협력사에 일괄 배정
    - 배정 가능 상태(new, consulting)의 신청만 배정
    - SMS 알림 발송 옵션
    """
    # 협력사 검증
    partner = db.query(Partner).filter(Partner.id == data.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")
    if partner.status != "approved":
        raise HTTPException(status_code=400, detail="승인된 협력사만 배정할 수 있습니다")

    partner_phone = decrypt_value(partner.contact_phone)
    results: list[BulkAssignResult] = []
    success_count = 0

    for app_id in data.application_ids:
        application = db.query(Application).filter(Application.id == app_id).first()

        if not application:
            results.append(BulkAssignResult(
                application_id=app_id,
                application_number="",
                success=False,
                message="신청을 찾을 수 없습니다"
            ))
            continue

        # 배정 가능 상태 확인
        if application.status not in ASSIGNABLE_STATUSES:
            results.append(BulkAssignResult(
                application_id=app_id,
                application_number=application.application_number,
                success=False,
                message=f"배정 불가 상태입니다 (현재: {application.status})"
            ))
            continue

        # 서비스 영역 매칭 확인
        if application.selected_services and partner.service_areas:
            app_services = set(application.selected_services)
            partner_services = set(partner.service_areas)
            if not app_services.intersection(partner_services):
                results.append(BulkAssignResult(
                    application_id=app_id,
                    application_number=application.application_number,
                    success=False,
                    message="협력사가 해당 서비스를 제공하지 않습니다"
                ))
                continue

        # 배정 처리
        prev_partner_id = application.assigned_partner_id
        application.assigned_partner_id = data.partner_id
        application.status = "assigned"
        application.assigned_admin_id = current_admin.id

        # SMS 발송 (백그라운드)
        if data.send_sms and data.partner_id != prev_partner_id:
            decrypted = decrypt_application(application, db)
            # 고객에게 배정 알림
            background_tasks.add_task(
                send_partner_assignment_notification,
                decrypted["customer_phone"],
                application.application_number,
                partner.company_name,
                partner_phone,
                decrypted["customer_name"],
                "",  # scheduled_date (일괄 배정에서는 미정)
                "",  # scheduled_time
                "",  # estimated_cost
            )
            # 협력사에게 배정 알림
            background_tasks.add_task(
                send_partner_notify_assignment,
                partner_phone,
                application.application_number,
                decrypted["customer_name"],
                decrypted["customer_phone"],
                decrypted["customer_address"],
                application.services or [],
                "",  # scheduled_date (일괄 배정에서는 미정)
            )

        results.append(BulkAssignResult(
            application_id=app_id,
            application_number=application.application_number,
            success=True,
            message="배정 완료"
        ))
        success_count += 1

        # 개별 신청에 대한 배정 audit log
        log_bulk_assignment(
            db=db,
            entity_type="application",
            entity_id=app_id,
            partner_id=data.partner_id,
            partner_name=partner.company_name,
            total_count=len(data.application_ids),
            success_count=success_count,
            admin=current_admin,
        )

    db.commit()

    if success_count > 0:
        logger.info(f"Bulk assignment: {success_count}/{len(data.application_ids)} to partner {partner.company_name}")

    return BulkAssignResponse(
        total=len(data.application_ids),
        success_count=success_count,
        failed_count=len(data.application_ids) - success_count,
        results=results,
        partner_name=partner.company_name
    )


def get_assignments_for_application(db: Session, application_id: int) -> list[AssignmentSummary]:
    """신청에 연결된 배정 목록 조회 (협력사 정보 포함, 서비스 코드→이름 변환)"""
    assignments = (
        db.query(ApplicationPartnerAssignment)
        .filter(ApplicationPartnerAssignment.application_id == application_id)
        .order_by(ApplicationPartnerAssignment.created_at.desc())
        .all()
    )

    result = []
    for assignment in assignments:
        # 협력사 정보 조회
        partner = db.query(Partner).filter(Partner.id == assignment.partner_id).first()
        partner_name = partner.company_name if partner else "알 수 없음"
        partner_company = partner.company_name if partner else None

        result.append(AssignmentSummary(
            id=assignment.id,
            partner_id=assignment.partner_id,
            partner_name=partner_name,
            partner_company=partner_company,
            assigned_services=convert_service_codes_to_names(db, assignment.assigned_services),
            status=assignment.status,
            scheduled_date=str(assignment.scheduled_date) if assignment.scheduled_date else None,
            scheduled_time=assignment.scheduled_time,
            estimated_cost=assignment.estimated_cost,
            final_cost=assignment.final_cost,
            estimate_note=assignment.estimate_note,
            note=assignment.note,
            quote_status=assignment.quote_status,
            quote_sent_at=assignment.quote_sent_at,
            quote_viewed_at=assignment.quote_viewed_at,
        ))

    return result


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 상세 조회 (관리자용)

    - 1:N 배정 정보 포함 (assignments 필드)
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    decrypted = decrypt_application(application, db)

    # 배정 목록 조회 (1:N)
    assignments = get_assignments_for_application(db, application_id)

    return ApplicationDetailResponse(**decrypted, assignments=assignments)


@router.put("/{application_id}", response_model=ApplicationDetailResponse)
async def update_application(
    application_id: int,
    data: ApplicationUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 수정 (관리자용)

    - 상태 변경
    - 협력사 배정
    - 일정 설정
    - 비용 설정
    - 관리자 메모
    - SMS 알림 발송 (선택)
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    # 이전 상태 저장 (SMS 발송 및 Audit 로그용)
    prev_partner_id = application.assigned_partner_id
    prev_scheduled_date = application.scheduled_date
    prev_status = application.status
    prev_estimated_cost = application.estimated_cost
    prev_final_cost = application.final_cost

    # 상태 변경 시 유효성 검증
    if data.status and data.status != prev_status:
        check_status_transition(prev_status, data.status)

    # 협력사 배정 시 검증
    if data.assigned_partner_id and data.assigned_partner_id != prev_partner_id:
        # 협력사 존재 및 상태 확인
        partner = db.query(Partner).filter(Partner.id == data.assigned_partner_id).first()
        if not partner:
            raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")
        if partner.status != "approved":
            raise HTTPException(status_code=400, detail="승인된 협력사만 배정할 수 있습니다")

        # 서비스 영역 매칭 확인
        if application.selected_services and partner.service_areas:
            app_services = set(application.selected_services)
            partner_services = set(partner.service_areas)
            if not app_services.intersection(partner_services):
                raise HTTPException(
                    status_code=400,
                    detail="협력사가 해당 서비스를 제공하지 않습니다"
                )

    # 필드 업데이트 (None이 아닌 값만, send_sms 제외)
    update_data = data.model_dump(exclude_unset=True, exclude={"send_sms"})

    for field, value in update_data.items():
        if value is not None:
            # 상태 변경 시 타임스탬프 기록
            if field == "status":
                if value == "completed" and application.status != "completed":
                    application.completed_at = datetime.now(timezone.utc)
                elif value == "cancelled" and application.status != "cancelled":
                    application.cancelled_at = datetime.now(timezone.utc)

            setattr(application, field, value)

    # 담당 관리자 자동 설정
    if data.status or data.assigned_partner_id:
        application.assigned_admin_id = current_admin.id

    # Application 상태 변경 시 관련 Assignment 상태도 동기화
    if data.status and data.status != prev_status:
        # Application → Assignment 상태 매핑
        # scheduled, completed, cancelled는 Assignment에도 동일하게 적용
        sync_statuses = ["scheduled", "completed", "cancelled"]
        if data.status in sync_statuses:
            assignments = db.query(ApplicationPartnerAssignment).filter(
                ApplicationPartnerAssignment.application_id == application_id,
                ApplicationPartnerAssignment.status.notin_(["completed", "cancelled"])  # 이미 완료/취소된 건 제외
            ).all()
            for assignment in assignments:
                assignment.status = data.status
                if data.status == "completed":
                    assignment.completed_at = datetime.now(timezone.utc)
                elif data.status == "cancelled":
                    assignment.cancelled_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(application)

    # Audit Log 기록
    # 상태 변경 로그
    if data.status and data.status != prev_status:
        log_status_change(
            db=db,
            entity_type="application",
            entity_id=application.id,
            old_status=prev_status,
            new_status=data.status,
            admin=current_admin,
        )

    # 협력사 배정 로그
    if data.assigned_partner_id and data.assigned_partner_id != prev_partner_id:
        partner = db.query(Partner).filter(Partner.id == data.assigned_partner_id).first()
        if partner:
            log_assignment(
                db=db,
                entity_type="application",
                entity_id=application.id,
                partner_id=data.assigned_partner_id,
                partner_name=partner.company_name,
                admin=current_admin,
            )

    # 일정 변경 로그
    if data.scheduled_date and str(data.scheduled_date) != str(prev_scheduled_date) if prev_scheduled_date else data.scheduled_date:
        log_schedule_change(
            db=db,
            entity_type="application",
            entity_id=application.id,
            scheduled_date=str(data.scheduled_date),
            scheduled_time=data.scheduled_time,
            admin=current_admin,
        )

    # 금액 변경 로그
    cost_changed = (
        (data.estimated_cost is not None and data.estimated_cost != prev_estimated_cost) or
        (data.final_cost is not None and data.final_cost != prev_final_cost)
    )
    if cost_changed:
        log_cost_change(
            db=db,
            entity_type="application",
            entity_id=application.id,
            old_estimated_cost=prev_estimated_cost,
            new_estimated_cost=data.estimated_cost if data.estimated_cost is not None else prev_estimated_cost,
            old_final_cost=prev_final_cost,
            new_final_cost=data.final_cost if data.final_cost is not None else prev_final_cost,
            admin=current_admin,
        )

    # Audit Log commit
    db.commit()

    # SMS 발송 처리 (백그라운드)
    if data.send_sms:
        decrypted = decrypt_application(application, db)
        customer_phone = decrypted["customer_phone"]
        customer_name = decrypted["customer_name"]
        address = decrypted["address"]

        # 협력사 배정 알림
        if data.assigned_partner_id and data.assigned_partner_id != prev_partner_id:
            partner = db.query(Partner).filter(Partner.id == data.assigned_partner_id).first()
            if partner:
                partner_phone = decrypt_value(partner.contact_phone)
                # 배정 정보 조회 (있다면)
                assignment = db.query(ApplicationAssignment).filter(
                    ApplicationAssignment.application_id == application.id,
                    ApplicationAssignment.partner_id == partner.id
                ).first()
                scheduled_date_str = str(assignment.scheduled_date) if assignment and assignment.scheduled_date else "미정"
                scheduled_time_str = assignment.scheduled_time if assignment and assignment.scheduled_time else "미정"
                estimated_cost_str = f"{assignment.estimated_cost:,}원" if assignment and assignment.estimated_cost else "협의"

                # 고객에게 배정 알림
                background_tasks.add_task(
                    send_partner_assignment_notification,
                    customer_phone,
                    application.application_number,
                    partner.company_name,
                    partner_phone,
                    customer_name,
                    scheduled_date_str,
                    scheduled_time_str,
                    estimated_cost_str,
                )
                # 협력사에게 배정 알림
                background_tasks.add_task(
                    send_partner_notify_assignment,
                    partner_phone,
                    application.application_number,
                    customer_name,
                    customer_phone,
                    customer_address,
                    application.services or [],
                    scheduled_date_str,
                )
                logger.info(f"SMS scheduled: partner assignment for {application.application_number}")

        # 일정 확정 알림 (scheduled 상태로 변경되거나, 일정이 새로 설정된 경우)
        if (data.status == "scheduled" and prev_status != "scheduled") or \
           (data.scheduled_date and data.scheduled_date != str(prev_scheduled_date) if prev_scheduled_date else True):
            if application.scheduled_date:
                # 협력사 정보 조회
                partner_name = None
                partner_phone = None
                if application.assigned_partner_id:
                    partner = db.query(Partner).filter(Partner.id == application.assigned_partner_id).first()
                    if partner:
                        partner_name = partner.company_name
                        partner_phone = decrypt_value(partner.contact_phone)

                # 고객에게 알림
                background_tasks.add_task(
                    send_schedule_confirmation,
                    customer_phone,
                    application.application_number,
                    str(application.scheduled_date),
                    application.scheduled_time,
                    partner_name,
                    customer_name,
                )

                # 협력사에게 알림
                if partner_phone:
                    background_tasks.add_task(
                        send_partner_schedule_notification,
                        partner_phone,
                        application.application_number,
                        customer_name,
                        customer_phone,
                        address,
                        str(application.scheduled_date),
                        application.scheduled_time,
                        application.selected_services or [],
                    )
                logger.info(f"SMS scheduled: schedule confirmation for {application.application_number}")

        # 접수 확인 알림 (new -> consulting 상태 전환)
        if data.status == "consulting" and prev_status == "new":
            background_tasks.add_task(
                send_application_received_notification,
                customer_phone,
                application.application_number,
                customer_name,
            )
            logger.info(f"SMS scheduled: application received for {application.application_number}")

        # 취소 알림
        if data.status == "cancelled" and prev_status != "cancelled":
            background_tasks.add_task(
                send_application_cancelled_notification,
                customer_phone,
                application.application_number,
                data.admin_memo,  # 취소 사유로 admin_memo 사용
                customer_name,
            )
            logger.info(f"SMS scheduled: cancellation for {application.application_number}")

        # 완료 알림
        if data.status == "completed" and prev_status != "completed":
            partner_name = None
            customer_view_url = None

            if application.assigned_partner_id:
                partner = db.query(Partner).filter(Partner.id == application.assigned_partner_id).first()
                if partner:
                    partner_name = partner.company_name

            # 고객 열람 URL 가져오기 또는 생성
            assignment = db.query(ApplicationPartnerAssignment).filter(
                ApplicationPartnerAssignment.application_id == application_id,
                ApplicationPartnerAssignment.status.in_(["completed", "in_progress", "scheduled", "accepted"])
            ).first()

            if assignment:
                # 토큰이 없거나 만료된 경우 새로 생성 (기본 7일)
                if not assignment.customer_token:
                    token = generate_customer_view_token(assignment.id, expires_in_days=7)
                    assignment.customer_token = token

                    from app.core.file_token import decode_file_token_extended
                    token_info = decode_file_token_extended(token)
                    if not isinstance(token_info, str):
                        assignment.customer_token_expires_at = datetime.fromtimestamp(
                            token_info.expires_at, tz=timezone.utc
                        )
                    db.commit()

                customer_view_url = _build_customer_view_url(assignment.customer_token)

            background_tasks.add_task(
                send_completion_notification,
                customer_phone,
                application.application_number,
                partner_name,
                customer_name,
                customer_view_url,
            )
            logger.info(f"SMS scheduled: completion for {application.application_number} with URL: {customer_view_url}")

    decrypted = decrypt_application(application, db)

    # 일정 충돌 검사 (경고만, 차단하지 않음)
    schedule_conflicts: list[ScheduleConflict] = []
    if application.scheduled_date and application.assigned_partner_id:
        conflict_apps = db.query(Application).filter(
            Application.assigned_partner_id == application.assigned_partner_id,
            Application.scheduled_date == application.scheduled_date,
            Application.id != application_id,
            Application.status.in_(["assigned", "scheduled"])
        ).all()

        for conflict_app in conflict_apps:
            # 같은 시간대인 경우에만 충돌로 간주
            if application.scheduled_time and conflict_app.scheduled_time:
                if application.scheduled_time == conflict_app.scheduled_time:
                    conflict_decrypted = decrypt_application(conflict_app, db)
                    schedule_conflicts.append(ScheduleConflict(
                        application_id=conflict_app.id,
                        application_number=conflict_app.application_number,
                        customer_name=conflict_decrypted["customer_name"],
                        scheduled_time=conflict_app.scheduled_time
                    ))
            else:
                # 시간이 지정되지 않은 경우 같은 날 다른 신청이 있으면 경고
                conflict_decrypted = decrypt_application(conflict_app, db)
                schedule_conflicts.append(ScheduleConflict(
                    application_id=conflict_app.id,
                    application_number=conflict_app.application_number,
                    customer_name=conflict_decrypted["customer_name"],
                    scheduled_time=conflict_app.scheduled_time
                ))

    if schedule_conflicts:
        logger.warning(f"Schedule conflicts detected for {application.application_number}: {len(schedule_conflicts)} conflicts")

    # 배정 목록 조회 (1:N)
    assignments = get_assignments_for_application(db, application_id)

    return ApplicationDetailResponse(
        **decrypted,
        schedule_conflicts=schedule_conflicts if schedule_conflicts else None,
        assignments=assignments
    )


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 삭제 (관리자용)

    - 실제 삭제가 아닌 취소 처리 권장
    - super_admin만 실제 삭제 가능
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    # super_admin만 삭제 가능
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다. 취소 처리를 이용해주세요.")

    db.delete(application)
    db.commit()

    return {"success": True, "message": "신청이 삭제되었습니다"}


# ==================== 관리자 메모 API ====================


@router.get("/{application_id}/notes", response_model=ApplicationNotesListResponse)
def get_application_notes(
    application_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 관리자 메모 목록 조회

    - 최신순 정렬
    - 히스토리 형태로 제공
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    query = db.query(ApplicationNote).filter(ApplicationNote.application_id == application_id)
    total = query.count()

    notes = (
        query.order_by(desc(ApplicationNote.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApplicationNotesListResponse(
        items=[ApplicationNoteResponse.model_validate(note) for note in notes],
        total=total,
    )


@router.post("/{application_id}/notes", response_model=ApplicationNoteResponse)
def create_application_note(
    application_id: int,
    data: ApplicationNoteCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 관리자 메모 추가

    - 히스토리 방식으로 계속 추가됨 (덮어쓰기 아님)
    - 작성자 정보 자동 기록
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    note = ApplicationNote(
        application_id=application_id,
        admin_id=current_admin.id,
        admin_name=current_admin.name,
        content=data.content,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    logger.info(f"Note added to application {application.application_number} by {current_admin.name}")

    return ApplicationNoteResponse.model_validate(note)


@router.delete("/{application_id}/notes/{note_id}")
def delete_application_note(
    application_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청 관리자 메모 삭제

    - 본인이 작성한 메모만 삭제 가능
    - super_admin은 모든 메모 삭제 가능
    """
    note = db.query(ApplicationNote).filter(
        ApplicationNote.id == note_id,
        ApplicationNote.application_id == application_id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다")

    # 권한 확인
    if note.admin_id != current_admin.id and current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="본인이 작성한 메모만 삭제할 수 있습니다")

    db.delete(note)
    db.commit()

    return {"success": True, "message": "메모가 삭제되었습니다"}


# ==================== 협력사 배정 API (1:N) ====================


@router.get("/{application_id}/assignments", response_model=AssignmentListResponse)
def get_application_assignments(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청의 협력사 배정 목록 조회

    - 1:N 배정 지원
    - 협력사 정보 포함
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    assignments = (
        db.query(ApplicationPartnerAssignment)
        .filter(ApplicationPartnerAssignment.application_id == application_id)
        .order_by(ApplicationPartnerAssignment.created_at.desc())
        .all()
    )

    items = []
    for assignment in assignments:
        partner = db.query(Partner).filter(Partner.id == assignment.partner_id).first()
        items.append(AssignmentResponse(
            id=assignment.id,
            application_id=assignment.application_id,
            partner_id=assignment.partner_id,
            assigned_services=assignment.assigned_services or [],
            status=assignment.status,
            scheduled_date=str(assignment.scheduled_date) if assignment.scheduled_date else None,
            scheduled_time=assignment.scheduled_time,
            estimated_cost=assignment.estimated_cost,
            final_cost=assignment.final_cost,
            estimate_note=assignment.estimate_note,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at,
            note=assignment.note,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
            completed_at=assignment.completed_at,
            cancelled_at=assignment.cancelled_at,
            partner_name=partner.company_name if partner else None,
            partner_phone=decrypt_value(partner.contact_phone) if partner else None,
            partner_company=partner.company_name if partner else None,
        ))

    return AssignmentListResponse(items=items, total=len(items))


@router.post("/{application_id}/assignments", response_model=AssignmentResponse)
async def create_application_assignment(
    application_id: int,
    data: AssignmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    신청에 협력사 배정 추가

    - 1:N 배정 지원 (여러 협력사 배정 가능)
    - 서비스 영역 매칭 검증
    - SMS 알림 발송 옵션
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    # 협력사 검증
    partner = db.query(Partner).filter(Partner.id == data.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="협력사를 찾을 수 없습니다")
    if partner.status != "approved":
        raise HTTPException(status_code=400, detail="승인된 협력사만 배정할 수 있습니다")

    # 서비스 영역 매칭 확인
    if data.assigned_services and partner.service_areas:
        assigned_services = set(data.assigned_services)
        partner_services = set(partner.service_areas)
        if not assigned_services.issubset(partner_services):
            unmatched = assigned_services - partner_services
            raise HTTPException(
                status_code=400,
                detail=f"협력사가 해당 서비스를 제공하지 않습니다: {', '.join(unmatched)}"
            )

    # 신청의 선택 서비스에 포함되어 있는지 확인
    app_services = set(application.selected_services or [])
    if not set(data.assigned_services).issubset(app_services):
        raise HTTPException(
            status_code=400,
            detail="배정 서비스가 신청의 선택 서비스에 포함되어 있지 않습니다"
        )

    # 배정 생성
    assignment = ApplicationPartnerAssignment(
        application_id=application_id,
        partner_id=data.partner_id,
        assigned_services=data.assigned_services,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        estimated_cost=data.estimated_cost,
        estimate_note=data.estimate_note,
        note=data.note,
        assigned_by=current_admin.id,
    )

    db.add(assignment)

    # 기존 배정 조회 (레거시 필드 업데이트와 전체 배정 확인에 사용)
    existing_assignments = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.application_id == application_id
    ).all()

    # 전체 서비스가 배정되었는지 확인 후 상태 업데이트
    if application.status in ["new", "consulting"]:
        all_services = set(application.selected_services or [])
        # 기존 배정 서비스 + 현재 배정 서비스
        assigned_services = set()
        for a in existing_assignments:
            assigned_services.update(a.assigned_services or [])
        assigned_services.update(data.assigned_services or [])

        # 전체 서비스가 배정된 경우에만 상태 변경
        if assigned_services >= all_services:
            application.status = "assigned"
            application.assigned_admin_id = current_admin.id

    # 레거시 필드 업데이트 (첫 번째 배정인 경우)
    existing_count = len(existing_assignments)
    if existing_count == 0:
        application.assigned_partner_id = data.partner_id
        if data.scheduled_date:
            application.scheduled_date = data.scheduled_date
        if data.scheduled_time:
            application.scheduled_time = data.scheduled_time
        if data.estimated_cost:
            application.estimated_cost = data.estimated_cost

    db.commit()
    db.refresh(assignment)

    # Audit Log
    log_assignment(
        db=db,
        entity_type="application",
        entity_id=application_id,
        partner_id=data.partner_id,
        partner_name=partner.company_name,
        admin=current_admin,
    )

    # SMS 발송
    if data.send_sms:
        decrypted = decrypt_application(application, db)
        partner_phone = decrypt_value(partner.contact_phone)
        scheduled_date_str = str(data.scheduled_date) if data.scheduled_date else "미정"
        scheduled_time_str = data.scheduled_time if data.scheduled_time else "미정"
        estimated_cost_str = f"{data.estimated_cost:,}원" if data.estimated_cost else "협의"

        # 협력사용 열람 URL 생성
        _, view_url = get_partner_view_url(assignment.id)

        # 고객에게 배정 알림
        background_tasks.add_task(
            send_partner_assignment_notification,
            decrypted["customer_phone"],
            application.application_number,
            partner.company_name,
            partner_phone,
            decrypted["customer_name"],
            scheduled_date_str,
            scheduled_time_str,
            estimated_cost_str,
        )
        # 협력사에게 배정 알림 (열람 URL 포함)
        background_tasks.add_task(
            send_partner_notify_assignment,
            partner_phone,
            application.application_number,
            decrypted["customer_name"],
            decrypted["customer_phone"],
            decrypted["address"],
            application.selected_services or [],
            scheduled_date_str,
            view_url,
        )
        logger.info(f"SMS scheduled: assignment created for {application.application_number}")

    logger.info(f"Assignment created: app={application.application_number}, partner={partner.company_name}")

    # 배정 생성 시 신청 상태 자동 동기화
    old_app_status, new_app_status = sync_application_from_assignments(
        db, application_id, trigger_source="assignment_create"
    )
    if old_app_status != new_app_status:
        db.commit()
        logger.info(
            f"Application status synced: {application_id} "
            f"({old_app_status} → {new_app_status}) due to new assignment"
        )

    return AssignmentResponse(
        id=assignment.id,
        application_id=assignment.application_id,
        partner_id=assignment.partner_id,
        assigned_services=assignment.assigned_services or [],
        status=assignment.status,
        scheduled_date=str(assignment.scheduled_date) if assignment.scheduled_date else None,
        scheduled_time=assignment.scheduled_time,
        estimated_cost=assignment.estimated_cost,
        final_cost=assignment.final_cost,
        estimate_note=assignment.estimate_note,
        quote_status=assignment.quote_status,
        quote_sent_at=assignment.quote_sent_at,
        quote_viewed_at=assignment.quote_viewed_at,
        assigned_by=assignment.assigned_by,
        assigned_at=assignment.assigned_at,
        note=assignment.note,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        completed_at=assignment.completed_at,
        cancelled_at=assignment.cancelled_at,
        partner_name=partner.company_name,
        partner_phone=decrypt_value(partner.contact_phone),
        partner_company=partner.company_name,
    )


@router.put("/{application_id}/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_application_assignment(
    application_id: int,
    assignment_id: int,
    data: AssignmentUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정 수정

    - 상태, 일정, 비용 등 수정
    - SMS 알림 발송 옵션
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정 정보를 찾을 수 없습니다")

    application = db.query(Application).filter(Application.id == application_id).first()
    partner = db.query(Partner).filter(Partner.id == assignment.partner_id).first()

    prev_status = assignment.status
    prev_scheduled_date = assignment.scheduled_date
    prev_scheduled_time = assignment.scheduled_time
    prev_estimated_cost = assignment.estimated_cost

    # 필드 업데이트
    update_data = data.model_dump(exclude_unset=True, exclude={"send_sms"})
    for field, value in update_data.items():
        if value is not None:
            if field == "status":
                if value == "completed" and assignment.status != "completed":
                    assignment.completed_at = datetime.now(timezone.utc)
                elif value == "cancelled" and assignment.status != "cancelled":
                    assignment.cancelled_at = datetime.now(timezone.utc)
            setattr(assignment, field, value)

    db.commit()
    db.refresh(assignment)

    # 배정 상태 변경 시 신청 상태 자동 동기화
    if data.status and data.status != prev_status:
        old_app_status, new_app_status = sync_application_from_assignments(
            db, application_id, trigger_source="assignment_update"
        )
        if old_app_status != new_app_status:
            db.commit()
            logger.info(
                f"Application status synced: {application_id} "
                f"({old_app_status} → {new_app_status}) due to assignment {assignment_id}"
            )

    # Audit Log
    if data.status and data.status != prev_status:
        log_status_change(
            db=db,
            entity_type="assignment",
            entity_id=assignment.id,
            old_status=prev_status,
            new_status=data.status,
            admin=current_admin,
        )

    if data.scheduled_date and str(data.scheduled_date) != str(prev_scheduled_date) if prev_scheduled_date else data.scheduled_date:
        log_schedule_change(
            db=db,
            entity_type="assignment",
            entity_id=assignment.id,
            scheduled_date=str(data.scheduled_date),
            scheduled_time=data.scheduled_time,
            admin=current_admin,
        )

    # SMS 발송
    if data.send_sms and application and partner:
        decrypted = decrypt_application(application, db)
        partner_phone = decrypt_value(partner.contact_phone)

        # 일정 확정 알림 (scheduled 상태로 처음 변경될 때)
        if data.status == "scheduled" and prev_status != "scheduled":
            background_tasks.add_task(
                send_schedule_confirmation,
                decrypted["customer_phone"],
                application.application_number,
                str(assignment.scheduled_date) if assignment.scheduled_date else "",
                assignment.scheduled_time,
                partner.company_name,
                decrypted["customer_name"],
            )
            # 협력사에게도 알림
            background_tasks.add_task(
                send_partner_schedule_notification,
                partner_phone,
                application.application_number,
                decrypted["customer_name"],
                decrypted["customer_phone"],
                decrypted["address"],
                str(assignment.scheduled_date) if assignment.scheduled_date else "",
                assignment.scheduled_time,
                assignment.assigned_services or [],
            )
        else:
            # 배정 정보 변경 알림 (일정 또는 견적이 변경된 경우)
            schedule_changed = (
                (data.scheduled_date is not None and str(data.scheduled_date) != str(prev_scheduled_date)) or
                (data.scheduled_time is not None and data.scheduled_time != prev_scheduled_time)
            )
            cost_changed = data.estimated_cost is not None and data.estimated_cost != prev_estimated_cost

            if schedule_changed or cost_changed:
                scheduled_date_str = str(assignment.scheduled_date) if assignment.scheduled_date else "미정"
                scheduled_time_str = assignment.scheduled_time if assignment.scheduled_time else "미정"
                estimated_cost_str = f"{assignment.estimated_cost:,}원" if assignment.estimated_cost else "협의"

                background_tasks.add_task(
                    send_assignment_changed_notification,
                    decrypted["customer_phone"],
                    application.application_number,
                    decrypted["customer_name"],
                    scheduled_date_str,
                    scheduled_time_str,
                    estimated_cost_str,
                )
                logger.info(f"SMS scheduled: assignment changed for {application.application_number}")

    logger.info(f"Assignment updated: id={assignment_id}")

    return AssignmentResponse(
        id=assignment.id,
        application_id=assignment.application_id,
        partner_id=assignment.partner_id,
        assigned_services=assignment.assigned_services or [],
        status=assignment.status,
        scheduled_date=str(assignment.scheduled_date) if assignment.scheduled_date else None,
        scheduled_time=assignment.scheduled_time,
        estimated_cost=assignment.estimated_cost,
        final_cost=assignment.final_cost,
        estimate_note=assignment.estimate_note,
        quote_status=assignment.quote_status,
        quote_sent_at=assignment.quote_sent_at,
        quote_viewed_at=assignment.quote_viewed_at,
        assigned_by=assignment.assigned_by,
        assigned_at=assignment.assigned_at,
        note=assignment.note,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        completed_at=assignment.completed_at,
        cancelled_at=assignment.cancelled_at,
        partner_name=partner.company_name if partner else None,
        partner_phone=decrypt_value(partner.contact_phone) if partner else None,
        partner_company=partner.company_name if partner else None,
    )


@router.delete("/{application_id}/assignments/{assignment_id}")
def delete_application_assignment(
    application_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정 삭제

    - 배정 취소 (soft delete가 아닌 실제 삭제)
    - 다른 배정이 없으면 신청 상태도 조정
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정 정보를 찾을 수 없습니다")

    partner = db.query(Partner).filter(Partner.id == assignment.partner_id).first()
    partner_name = partner.company_name if partner else "Unknown"

    # Audit Log
    log_change(
        db=db,
        entity_type="assignment",
        entity_id=assignment_id,
        action="delete",
        old_value={
            "partner_id": assignment.partner_id,
            "partner_name": partner_name,
            "assigned_services": assignment.assigned_services,
        },
        summary=f"배정 삭제: {partner_name}",
        admin=current_admin,
    )

    db.delete(assignment)

    # 남은 배정 확인
    remaining = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.application_id == application_id
    ).count()

    # 모든 배정이 삭제되면 레거시 필드 초기화
    if remaining == 0:
        application = db.query(Application).filter(Application.id == application_id).first()
        if application:
            application.assigned_partner_id = None
            # 상태는 그대로 유지 (사용자가 수동으로 변경)

    db.commit()

    # 배정 삭제 후 신청 상태 자동 동기화
    old_app_status, new_app_status = sync_application_from_assignments(
        db, application_id, trigger_source="assignment_delete"
    )
    if old_app_status != new_app_status:
        db.commit()
        logger.info(
            f"Application status synced: {application_id} "
            f"({old_app_status} → {new_app_status}) due to assignment deletion"
        )

    logger.info(f"Assignment deleted: id={assignment_id}, partner={partner_name}")

    return {"success": True, "message": "배정이 삭제되었습니다"}


# =============================================================================
# 고객 이력 조회 API
# =============================================================================


@router.get("/{application_id}/customer-history")
def get_customer_history(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    고객 신청 이력 조회 (관리자용)

    특정 신청의 고객(전화번호 기준)이 가진 모든 신청 목록을 반환합니다.
    현재 신청은 목록에서 is_current로 표시됩니다.
    """
    # 현재 신청 조회
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")

    # 전화번호 복호화
    customer_phone = decrypt_value(application.customer_phone)
    if not customer_phone:
        return {
            "customer_phone_masked": None,
            "total_applications": 1,
            "applications": [],
        }

    # 동일 전화번호의 모든 신청 조회
    customer_applications = get_customer_applications(db, customer_phone, limit=20)

    # 전화번호 마스킹 (010-****-1234 형식)
    phone_parts = customer_phone.replace("-", "")
    if len(phone_parts) >= 7:
        masked_phone = f"{phone_parts[:3]}-****-{phone_parts[-4:]}"
    else:
        masked_phone = customer_phone

    # 응답 생성
    applications_list = []
    for app in customer_applications:
        applications_list.append({
            "id": app.id,
            "application_number": app.application_number,
            "status": app.status,
            "selected_services": app.selected_services or [],
            "created_at": app.created_at.isoformat() if app.created_at else None,
            "completed_at": app.completed_at.isoformat() if app.completed_at else None,
            "is_current": app.id == application_id,
        })

    return {
        "customer_phone_masked": masked_phone,
        "total_applications": len(applications_list),
        "applications": applications_list,
    }


# ===== URL 관리 API =====

from pydantic import BaseModel, Field
from app.core.file_token import decode_file_token_extended
from app.core.config import settings


class URLInfoResponse(BaseModel):
    """URL 정보 응답"""
    assignment_id: int
    token: Optional[str] = None  # 발급된 URL이 없으면 None
    view_url: Optional[str] = None
    expires_at: Optional[str] = None
    is_issued: bool = False  # URL 발급 여부
    is_expired: bool = False  # 만료 여부


class URLRenewRequest(BaseModel):
    """URL 갱신 요청"""
    expires_in_days: int = Field(default=7, ge=1, le=30)


class URLRevokeRequest(BaseModel):
    """URL 만료 요청"""
    reason: Optional[str] = Field(None, max_length=255)


def _build_view_url(token: str) -> str:
    """토큰으로 협력사 포털 URL 생성"""
    base_url = getattr(settings, 'FRONTEND_URL', 'https://jeonbang-homecare.com')
    base_path = getattr(settings, 'BASE_PATH', '/homecare')
    return f"{base_url}{base_path}/view/{token}"


@router.get("/{application_id}/assignments/{assignment_id}/url", response_model=URLInfoResponse)
def get_assignment_url(
    application_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 협력사 포털 URL 조회 (발급된 URL만 반환, 자동 발급 안함)
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # DB에 저장된 토큰이 없으면 미발급 상태 반환
    if not assignment.url_token:
        return URLInfoResponse(
            assignment_id=assignment_id,
            is_issued=False,
        )

    # 만료 시간 확인
    now = datetime.now(timezone.utc)
    is_expired = False
    if assignment.url_expires_at and assignment.url_expires_at < now:
        is_expired = True

    return URLInfoResponse(
        assignment_id=assignment_id,
        token=assignment.url_token,
        view_url=_build_view_url(assignment.url_token),
        expires_at=assignment.url_expires_at.isoformat() if assignment.url_expires_at else None,
        is_issued=True,
        is_expired=is_expired,
    )


@router.post("/{application_id}/assignments/{assignment_id}/generate-url", response_model=URLInfoResponse)
def generate_assignment_url(
    application_id: int,
    assignment_id: int,
    data: URLRenewRequest = URLRenewRequest(),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 협력사 포털 URL 발급 (명시적 발급)
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 새 토큰 생성
    token = generate_partner_view_token(assignment_id, expires_in_days=data.expires_in_days)

    # 토큰에서 만료 시간 추출
    token_info = decode_file_token_extended(token)
    expires_at = None
    if not isinstance(token_info, str):
        expires_at = datetime.fromtimestamp(token_info.expires_at, tz=timezone.utc)

    # DB에 저장
    assignment.url_token = token
    assignment.url_expires_at = expires_at
    db.commit()

    logger.info(f"URL generated: assignment={assignment_id} by admin={current_admin.id}")

    return URLInfoResponse(
        assignment_id=assignment_id,
        token=token,
        view_url=_build_view_url(token),
        expires_at=expires_at.isoformat() if expires_at else None,
        is_issued=True,
        is_expired=False,
    )


@router.post("/{application_id}/assignments/{assignment_id}/renew-url", response_model=URLInfoResponse)
def renew_assignment_url(
    application_id: int,
    assignment_id: int,
    data: URLRenewRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 협력사 포털 URL 재발급

    기존 토큰을 무효화하고 새 토큰 발급
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 기존 토큰 무효화 (현재 시점 이전 토큰은 무효)
    from datetime import timedelta
    assignment.url_invalidated_before = datetime.now(timezone.utc) - timedelta(seconds=1)

    # 새 토큰 생성
    token = generate_partner_view_token(assignment_id, expires_in_days=data.expires_in_days)

    # 토큰에서 만료 시간 추출
    token_info = decode_file_token_extended(token)
    expires_at = None
    if not isinstance(token_info, str):
        expires_at = datetime.fromtimestamp(token_info.expires_at, tz=timezone.utc)

    # DB에 저장
    assignment.url_token = token
    assignment.url_expires_at = expires_at
    db.commit()

    logger.info(f"URL renewed: assignment={assignment_id} by admin={current_admin.id}")

    return URLInfoResponse(
        assignment_id=assignment_id,
        token=token,
        view_url=_build_view_url(token),
        expires_at=expires_at.isoformat() if expires_at else None,
        is_issued=True,
        is_expired=False,
    )


@router.post("/{application_id}/assignments/{assignment_id}/revoke-url")
def revoke_assignment_url(
    application_id: int,
    assignment_id: int,
    data: URLRevokeRequest = URLRevokeRequest(),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 협력사 포털 URL 만료(취소)

    토큰 삭제 및 무효화 처리
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 토큰 삭제 및 무효화
    assignment.url_token = None
    assignment.url_expires_at = None
    assignment.url_invalidated_before = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"URL revoked: assignment={assignment_id} by admin={current_admin.id}, reason={data.reason}")

    return {"success": True, "message": "URL이 만료 처리되었습니다"}


@router.post("/{application_id}/assignments/{assignment_id}/extend-url", response_model=URLInfoResponse)
def extend_assignment_url(
    application_id: int,
    assignment_id: int,
    data: PartnerUrlExtend,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    배정의 협력사 포털 URL 기간 연장 (기존 URL 유지)

    기존 URL을 유지하면서 만료 시간만 연장합니다.
    """
    from datetime import timedelta

    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    if not assignment.url_token:
        raise HTTPException(status_code=400, detail="발급된 URL이 없습니다. 먼저 URL을 발급해주세요.")

    # 기존 만료 시간 + 추가 일수 (기존 URL 유지)
    current_expires = assignment.url_expires_at or datetime.now(timezone.utc)
    new_expires_at = current_expires + timedelta(days=data.additional_days)

    # 만료 시간만 업데이트 (토큰 변경 없음)
    assignment.url_expires_at = new_expires_at
    db.commit()

    logger.info(f"URL extended: assignment={assignment_id} by admin={current_admin.id}, additional_days={data.additional_days}")

    return URLInfoResponse(
        assignment_id=assignment_id,
        token=assignment.url_token,
        view_url=_build_view_url(assignment.url_token),
        expires_at=new_expires_at.isoformat() if new_expires_at else None,
        is_issued=True,
        is_expired=False,
    )


# =============================================================================
# 시공 사진 관리 API
# =============================================================================

from fastapi import UploadFile, File
from app.services.file_upload import process_uploaded_files
from app.core.file_token import encode_file_token
from app.schemas.application_assignment import (
    WorkPhotoUploadResponse,
    WorkPhotosResponse,
    CustomerUrlCreate,
    CustomerUrlExtend,
    PartnerUrlExtend,
    CustomerUrlResponse,
)

MAX_WORK_PHOTOS_PER_TYPE = 30  # 시공 전/후 각각 최대 30장


@router.get("/{application_id}/assignments/{assignment_id}/work-photos", response_model=WorkPhotosResponse)
def get_work_photos(
    application_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    시공 사진 조회

    - 시공 전/후 사진 목록과 토큰화된 URL 반환
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    before_photos = assignment.work_photos_before or []
    after_photos = assignment.work_photos_after or []

    # 토큰화된 URL 생성
    def get_photo_urls(photos: list) -> list:
        return [get_file_url(photo) for photo in photos]

    # 썸네일 URL 생성 (thumb_ 접두사)
    def get_thumbnail_urls(photos: list) -> list:
        thumbnails = []
        for photo in photos:
            # /uploads/assignments/202512/abc123.webp -> /uploads/assignments/202512/thumb_abc123.webp
            parts = photo.rsplit("/", 1)
            if len(parts) == 2:
                thumb_path = f"{parts[0]}/thumb_{parts[1]}"
                thumbnails.append(get_file_url(thumb_path))
            else:
                thumbnails.append(get_file_url(photo))
        return thumbnails

    return WorkPhotosResponse(
        assignment_id=assignment_id,
        before_photos=before_photos,
        after_photos=after_photos,
        before_photo_urls=get_photo_urls(before_photos),
        after_photo_urls=get_photo_urls(after_photos),
        before_thumbnail_urls=get_thumbnail_urls(before_photos),
        after_thumbnail_urls=get_thumbnail_urls(after_photos),
        uploaded_at=assignment.work_photos_uploaded_at,
        updated_at=assignment.work_photos_updated_at,
    )


@router.post("/{application_id}/assignments/{assignment_id}/work-photos/{photo_type}", response_model=WorkPhotoUploadResponse)
async def upload_work_photos(
    application_id: int,
    assignment_id: int,
    photo_type: str,
    photos: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    시공 사진 업로드

    - photo_type: "before" (시공 전) 또는 "after" (시공 후)
    - 각 유형별 최대 10장까지
    """
    if photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="photo_type은 'before' 또는 'after'여야 합니다")

    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 기존 사진 목록
    if photo_type == "before":
        existing_photos = assignment.work_photos_before or []
    else:
        existing_photos = assignment.work_photos_after or []

    # 최대 개수 체크
    if len(existing_photos) + len(photos) > MAX_WORK_PHOTOS_PER_TYPE:
        raise HTTPException(
            status_code=400,
            detail=f"시공 {photo_type} 사진은 최대 {MAX_WORK_PHOTOS_PER_TYPE}장까지 업로드할 수 있습니다. "
                   f"현재 {len(existing_photos)}장, 추가 요청 {len(photos)}장"
        )

    # 파일 업로드 처리
    try:
        uploaded_paths = await process_uploaded_files(
            files=photos,
            upload_dir=settings.UPLOAD_DIR,
            entity_type="assignments",
        )
    except Exception as e:
        logger.error(f"Work photo upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"사진 업로드 중 오류가 발생했습니다: {str(e)}")

    # 사진 목록 업데이트
    new_photos = existing_photos + uploaded_paths
    now = datetime.now(timezone.utc)

    if photo_type == "before":
        assignment.work_photos_before = new_photos
    else:
        assignment.work_photos_after = new_photos

    if not assignment.work_photos_uploaded_at:
        assignment.work_photos_uploaded_at = now
    assignment.work_photos_updated_at = now

    db.commit()

    logger.info(f"Work photos uploaded: assignment={assignment_id}, type={photo_type}, count={len(uploaded_paths)}")

    return WorkPhotoUploadResponse(
        assignment_id=assignment_id,
        photo_type=photo_type,
        photos=new_photos,
        total_count=len(new_photos),
        message=f"{len(uploaded_paths)}개 이미지가 업로드되었습니다.",
    )


@router.delete("/{application_id}/assignments/{assignment_id}/work-photos/{photo_type}")
def delete_work_photo(
    application_id: int,
    assignment_id: int,
    photo_type: str,
    photo_index: int = Query(..., ge=0, description="삭제할 사진 인덱스"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    시공 사진 삭제

    - photo_type: "before" 또는 "after"
    - photo_index: 삭제할 사진의 인덱스 (0부터 시작)
    """
    if photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="photo_type은 'before' 또는 'after'여야 합니다")

    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 기존 사진 목록
    if photo_type == "before":
        photos = list(assignment.work_photos_before or [])
    else:
        photos = list(assignment.work_photos_after or [])

    if photo_index >= len(photos):
        raise HTTPException(status_code=404, detail="해당 인덱스의 사진을 찾을 수 없습니다")

    # 사진 삭제
    deleted_photo = photos.pop(photo_index)

    if photo_type == "before":
        assignment.work_photos_before = photos
    else:
        assignment.work_photos_after = photos

    assignment.work_photos_updated_at = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"Work photo deleted: assignment={assignment_id}, type={photo_type}, index={photo_index}")

    return {
        "success": True,
        "message": "사진이 삭제되었습니다",
        "deleted_photo": deleted_photo,
        "remaining_count": len(photos),
    }


@router.put("/{application_id}/assignments/{assignment_id}/work-photos/{photo_type}/reorder")
def reorder_work_photos(
    application_id: int,
    assignment_id: int,
    photo_type: str,
    order: List[int],
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    시공 사진 순서 변경

    - photo_type: "before" 또는 "after"
    - order: 새로운 인덱스 순서 배열 [2, 0, 1] → 2번 사진이 첫번째로
    """
    if photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="photo_type은 'before' 또는 'after'여야 합니다")

    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 기존 사진 목록
    if photo_type == "before":
        photos = list(assignment.work_photos_before or [])
    else:
        photos = list(assignment.work_photos_after or [])

    # 인덱스 유효성 검사
    if len(order) != len(photos):
        raise HTTPException(
            status_code=400,
            detail=f"순서 배열 길이({len(order)})가 사진 수({len(photos)})와 일치하지 않습니다"
        )

    if sorted(order) != list(range(len(photos))):
        raise HTTPException(
            status_code=400,
            detail="순서 배열에 유효하지 않은 인덱스가 포함되어 있습니다"
        )

    # 순서 재정렬
    reordered = [photos[i] for i in order]

    if photo_type == "before":
        assignment.work_photos_before = reordered
    else:
        assignment.work_photos_after = reordered

    assignment.work_photos_updated_at = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"Work photos reordered: assignment={assignment_id}, type={photo_type}, order={order}")

    return {
        "success": True,
        "message": "사진 순서가 변경되었습니다",
        "photos": reordered,
    }


# =============================================================================
# 고객 열람 URL 관리 API
# =============================================================================


def generate_customer_view_token(assignment_id: int, expires_in_days: int = 30) -> str:
    """고객 열람용 토큰 생성"""
    virtual_path = f"/customer-view/assignment/{assignment_id}"
    return encode_file_token(
        file_path=virtual_path,
        expires_in=expires_in_days * 24 * 60 * 60,
        entity_type="customer_view",
        entity_id=assignment_id,
        requires_auth=False,
    )


def _build_customer_view_url(token: str) -> str:
    """토큰으로 고객 열람 URL 생성"""
    base_url = getattr(settings, 'FRONTEND_URL', 'https://jeonbang-homecare.com')
    base_path = getattr(settings, 'BASE_PATH', '/homecare')
    return f"{base_url}{base_path}/view/customer/{token}"


@router.get("/{application_id}/assignments/{assignment_id}/customer-url", response_model=CustomerUrlResponse)
def get_customer_url(
    application_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    고객 열람 URL 조회
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    if not assignment.customer_token:
        return CustomerUrlResponse(
            assignment_id=assignment_id,
            is_valid=False,
            message="발급된 URL이 없습니다",
        )

    # 만료 여부 확인
    now = datetime.now(timezone.utc)
    is_valid = True
    message = None

    if assignment.customer_token_expires_at and assignment.customer_token_expires_at < now:
        is_valid = False
        message = "URL이 만료되었습니다"

    return CustomerUrlResponse(
        assignment_id=assignment_id,
        token=assignment.customer_token,
        url=_build_customer_view_url(assignment.customer_token),
        expires_at=assignment.customer_token_expires_at,
        is_valid=is_valid,
        message=message,
    )


@router.post("/{application_id}/assignments/{assignment_id}/customer-url", response_model=CustomerUrlResponse)
def create_customer_url(
    application_id: int,
    assignment_id: int,
    data: CustomerUrlCreate = CustomerUrlCreate(),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    고객 열람 URL 발급
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 새 토큰 생성
    token = generate_customer_view_token(assignment_id, expires_in_days=data.expires_in_days)

    # 토큰에서 만료 시간 추출
    token_info = decode_file_token_extended(token)
    expires_at = None
    if not isinstance(token_info, str):
        expires_at = datetime.fromtimestamp(token_info.expires_at, tz=timezone.utc)

    # DB에 저장
    assignment.customer_token = token
    assignment.customer_token_expires_at = expires_at
    db.commit()

    logger.info(f"Customer URL created: assignment={assignment_id} by admin={current_admin.id}")

    return CustomerUrlResponse(
        assignment_id=assignment_id,
        token=token,
        url=_build_customer_view_url(token),
        expires_at=expires_at,
        is_valid=True,
        message="URL이 발급되었습니다",
    )


@router.post("/{application_id}/assignments/{assignment_id}/customer-url/extend", response_model=CustomerUrlResponse)
def extend_customer_url(
    application_id: int,
    assignment_id: int,
    data: CustomerUrlExtend,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    고객 열람 URL 기간 연장 (기존 URL 유지)

    기존 URL을 유지하면서 만료 시간만 연장합니다.
    """
    from datetime import timedelta

    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    if not assignment.customer_token:
        raise HTTPException(status_code=400, detail="발급된 URL이 없습니다. 먼저 URL을 발급해주세요.")

    # 기존 만료 시간 + 추가 일수 (기존 URL 유지)
    current_expires = assignment.customer_token_expires_at or datetime.now(timezone.utc)
    new_expires_at = current_expires + timedelta(days=data.additional_days)

    # 만료 시간만 업데이트 (토큰 변경 없음)
    assignment.customer_token_expires_at = new_expires_at
    db.commit()

    logger.info(f"Customer URL extended: assignment={assignment_id} by admin={current_admin.id}, additional_days={data.additional_days}")

    return CustomerUrlResponse(
        assignment_id=assignment_id,
        token=assignment.customer_token,
        url=_build_customer_view_url(assignment.customer_token),
        expires_at=new_expires_at,
        is_valid=True,
        message=f"URL 유효기간이 {data.additional_days}일 연장되었습니다",
    )


@router.post("/{application_id}/assignments/{assignment_id}/customer-url/renew", response_model=CustomerUrlResponse)
def renew_customer_url(
    application_id: int,
    assignment_id: int,
    data: CustomerUrlCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    고객 열람 URL 재발급 (기존 토큰 무효화)
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    # 기존 토큰 무효화
    from datetime import timedelta
    assignment.customer_token_invalidated_before = datetime.now(timezone.utc) - timedelta(seconds=1)

    # 새 토큰 생성
    token = generate_customer_view_token(assignment_id, expires_in_days=data.expires_in_days)

    token_info = decode_file_token_extended(token)
    expires_at = None
    if not isinstance(token_info, str):
        expires_at = datetime.fromtimestamp(token_info.expires_at, tz=timezone.utc)

    assignment.customer_token = token
    assignment.customer_token_expires_at = expires_at
    db.commit()

    logger.info(f"Customer URL renewed: assignment={assignment_id} by admin={current_admin.id}")

    return CustomerUrlResponse(
        assignment_id=assignment_id,
        token=token,
        url=_build_customer_view_url(token),
        expires_at=expires_at,
        is_valid=True,
        message="URL이 재발급되었습니다",
    )


@router.post("/{application_id}/assignments/{assignment_id}/customer-url/revoke")
def revoke_customer_url(
    application_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    고객 열람 URL 만료(취소)
    """
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id,
        ApplicationPartnerAssignment.application_id == application_id,
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="배정을 찾을 수 없습니다")

    assignment.customer_token = None
    assignment.customer_token_expires_at = None
    assignment.customer_token_invalidated_before = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"Customer URL revoked: assignment={assignment_id} by admin={current_admin.id}")

    return {"success": True, "message": "URL이 만료 처리되었습니다"}
