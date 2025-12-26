"""
Audit Log Service
변경 이력 추적 서비스
"""

from typing import Optional, Any, Dict
from sqlalchemy.orm import Session

from app.models import AuditLog, Admin
from app.services.application_status import STATUS_NAMES as APPLICATION_STATUS_NAMES


# 협력사 상태 한글 매핑
PARTNER_STATUS_NAMES: Dict[str, str] = {
    "pending": "대기중",
    "approved": "승인됨",
    "rejected": "거절됨",
    "inactive": "비활성",
}


def get_status_label(entity_type: str, status: str) -> str:
    """
    상태값을 한글 라벨로 변환

    Args:
        entity_type: 엔티티 유형 (application, partner)
        status: 영문 상태값

    Returns:
        한글 상태 라벨
    """
    if entity_type == "application":
        return APPLICATION_STATUS_NAMES.get(status, status)
    elif entity_type == "partner":
        return PARTNER_STATUS_NAMES.get(status, status)
    return status


def log_change(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    summary: Optional[str] = None,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    변경 이력 기록

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형 (application, partner, etc.)
        entity_id: 엔티티 ID
        action: 변경 유형 (create, update, delete, status_change, etc.)
        old_value: 변경 전 값
        new_value: 변경 후 값
        summary: 변경 요약
        admin: 변경자 Admin 객체
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    audit_log = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        summary=summary,
        admin_id=admin.id if admin else None,
        admin_name=admin.name if admin else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(audit_log)
    db.flush()  # ID 생성을 위해 flush

    return audit_log


def log_status_change(
    db: Session,
    entity_type: str,
    entity_id: int,
    old_status: str,
    new_status: str,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    상태 변경 이력 기록

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형
        entity_id: 엔티티 ID
        old_status: 이전 상태
        new_status: 새 상태
        admin: 변경자
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    # 상태값을 한글로 변환
    old_label = get_status_label(entity_type, old_status)
    new_label = get_status_label(entity_type, new_status)

    return log_change(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action="status_change",
        old_value={"status": old_status},
        new_value={"status": new_status},
        summary=f"상태 변경: {old_label} → {new_label}",
        admin=admin,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_assignment(
    db: Session,
    entity_type: str,
    entity_id: int,
    partner_id: int,
    partner_name: str,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    배정 이력 기록

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형
        entity_id: 엔티티 ID
        partner_id: 배정된 협력사 ID
        partner_name: 협력사명
        admin: 변경자
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    return log_change(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action="assignment",
        new_value={"partner_id": partner_id, "partner_name": partner_name},
        summary=f"협력사 배정: {partner_name}",
        admin=admin,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_schedule_change(
    db: Session,
    entity_type: str,
    entity_id: int,
    scheduled_date: str,
    scheduled_time: Optional[str] = None,
    old_date: Optional[str] = None,
    old_time: Optional[str] = None,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    일정 변경 이력 기록

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형
        entity_id: 엔티티 ID
        scheduled_date: 새 예정일
        scheduled_time: 새 예정시간
        old_date: 이전 예정일
        old_time: 이전 예정시간
        admin: 변경자
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    old_value = None
    if old_date:
        old_value = {"scheduled_date": old_date, "scheduled_time": old_time}

    time_str = f" {scheduled_time}" if scheduled_time else ""
    summary = f"일정 설정: {scheduled_date}{time_str}"

    return log_change(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action="schedule_change",
        old_value=old_value,
        new_value={"scheduled_date": scheduled_date, "scheduled_time": scheduled_time},
        summary=summary,
        admin=admin,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_cost_change(
    db: Session,
    entity_type: str,
    entity_id: int,
    old_estimated_cost: Optional[int] = None,
    new_estimated_cost: Optional[int] = None,
    old_final_cost: Optional[int] = None,
    new_final_cost: Optional[int] = None,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    금액 변경 이력 기록

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형
        entity_id: 엔티티 ID
        old_estimated_cost: 이전 견적금액
        new_estimated_cost: 새 견적금액
        old_final_cost: 이전 최종금액
        new_final_cost: 새 최종금액
        admin: 변경자
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    old_value = {}
    new_value = {}
    changes = []

    if old_estimated_cost != new_estimated_cost:
        old_value["estimated_cost"] = old_estimated_cost
        new_value["estimated_cost"] = new_estimated_cost
        old_str = f"{old_estimated_cost:,}원" if old_estimated_cost else "없음"
        new_str = f"{new_estimated_cost:,}원" if new_estimated_cost else "없음"
        changes.append(f"견적금액: {old_str} → {new_str}")

    if old_final_cost != new_final_cost:
        old_value["final_cost"] = old_final_cost
        new_value["final_cost"] = new_final_cost
        old_str = f"{old_final_cost:,}원" if old_final_cost else "없음"
        new_str = f"{new_final_cost:,}원" if new_final_cost else "없음"
        changes.append(f"최종금액: {old_str} → {new_str}")

    summary = ", ".join(changes) if changes else "금액 변경"

    return log_change(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action="cost_change",
        old_value=old_value if old_value else None,
        new_value=new_value if new_value else None,
        summary=summary,
        admin=admin,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_bulk_assignment(
    db: Session,
    entity_type: str,
    entity_id: int,
    partner_id: int,
    partner_name: str,
    total_count: int,
    success_count: int,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    일괄 배정 이력 기록

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형
        entity_id: 엔티티 ID
        partner_id: 배정된 협력사 ID
        partner_name: 협력사명
        total_count: 전체 배정 시도 건수
        success_count: 성공 건수
        admin: 변경자
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    return log_change(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action="bulk_assignment",
        new_value={
            "partner_id": partner_id,
            "partner_name": partner_name,
            "total_count": total_count,
            "success_count": success_count,
        },
        summary=f"일괄 배정: {partner_name} ({success_count}/{total_count}건)",
        admin=admin,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def get_entity_history(
    db: Session,
    entity_type: str,
    entity_id: int,
    limit: int = 50,
) -> list[AuditLog]:
    """
    특정 엔티티의 변경 이력 조회

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 유형
        entity_id: 엔티티 ID
        limit: 조회 개수

    Returns:
        AuditLog 목록 (최신순)
    """
    return (
        db.query(AuditLog)
        .filter(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id,
        )
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )


def log_file_access(
    db: Session,
    action: str,
    file_path: str,
    file_size: Optional[int] = None,
    file_type: Optional[str] = None,
    original_name: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    admin: Optional[Admin] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    파일 접근 감사 로그 기록

    파일 업로드, 다운로드, 삭제 등의 파일 관련 작업을 기록

    Args:
        db: 데이터베이스 세션
        action: 파일 작업 유형 (upload, download, delete)
        file_path: 파일 경로
        file_size: 파일 크기 (바이트)
        file_type: 파일 MIME 타입
        original_name: 원본 파일명
        related_entity_type: 관련 엔티티 유형 (partner, application)
        related_entity_id: 관련 엔티티 ID
        admin: 접근자 Admin 객체
        ip_address: IP 주소
        user_agent: User Agent

    Returns:
        생성된 AuditLog 객체
    """
    # 액션별 요약 메시지 생성
    action_labels = {
        "upload": "파일 업로드",
        "download": "파일 다운로드",
        "delete": "파일 삭제",
        "view": "파일 조회",
    }
    action_label = action_labels.get(action, action)

    # 요약 생성
    summary_parts = [action_label]
    if original_name:
        summary_parts.append(f": {original_name}")
    elif file_path:
        # 경로에서 파일명 추출
        import os
        summary_parts.append(f": {os.path.basename(file_path)}")

    summary = "".join(summary_parts)

    # 상세 정보
    new_value = {
        "file_path": file_path,
    }
    if file_size is not None:
        new_value["file_size"] = file_size
    if file_type:
        new_value["file_type"] = file_type
    if original_name:
        new_value["original_name"] = original_name
    if related_entity_type and related_entity_id:
        new_value["related_entity"] = f"{related_entity_type}:{related_entity_id}"

    return log_change(
        db=db,
        entity_type="file",
        entity_id=related_entity_id or 0,
        action=action,
        old_value=None,
        new_value=new_value,
        summary=summary,
        admin=admin,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def get_file_access_history(
    db: Session,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 50,
) -> list[AuditLog]:
    """
    파일 접근 이력 조회

    Args:
        db: 데이터베이스 세션
        related_entity_type: 관련 엔티티 유형으로 필터 (partner, application)
        related_entity_id: 관련 엔티티 ID로 필터
        action: 액션 유형으로 필터 (upload, download, delete)
        limit: 조회 개수

    Returns:
        AuditLog 목록 (최신순)
    """
    query = db.query(AuditLog).filter(AuditLog.entity_type == "file")

    if action:
        query = query.filter(AuditLog.action == action)

    if related_entity_type and related_entity_id:
        # JSONB 필드 내 related_entity 값으로 필터링
        related_str = f"{related_entity_type}:{related_entity_id}"
        query = query.filter(
            AuditLog.new_value["related_entity"].astext == related_str
        )

    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
