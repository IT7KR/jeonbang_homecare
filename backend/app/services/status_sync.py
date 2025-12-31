"""
Application ↔ Assignment 상태 동기화 서비스

Assignment 상태 변경 시 Application 상태를 자동으로 동기화합니다.

배정 상태 (3개로 단순화):
- pending: 배정 대기 (일정 미확정)
- scheduled: 일정 확정됨
- completed: 완료
- 취소는 배정 삭제로 처리

동기화 규칙:
1. 배정 없음 → consulting
2. 모든 배정 completed → completed
3. 하나라도 scheduled → scheduled
4. 그 외 (pending만 있음) → assigned
"""

from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.application_assignment import ApplicationPartnerAssignment


# 배정 상태 (3개로 단순화)
ASSIGNMENT_STATUSES = ["pending", "scheduled", "completed"]

# 상태 우선순위 (숫자가 높을수록 진행됨)
STATUS_PRIORITY = {
    "pending": 1,
    "scheduled": 2,
    "completed": 3,
}


def calculate_application_status(assignments: List[ApplicationPartnerAssignment]) -> str:
    """
    모든 Assignment 상태를 기반으로 Application 상태 계산

    배정 상태 (3개): pending, scheduled, completed
    취소는 배정 삭제로 처리

    규칙:
    1. 배정 없음 → consulting
    2. 모든 배정 completed → completed
    3. 하나라도 scheduled → scheduled
    4. 그 외 (pending만 있음) → assigned
    """
    if not assignments:
        return "consulting"

    statuses = [a.status for a in assignments]

    # 모든 배정이 완료되어야 신청도 완료
    if all(s == "completed" for s in statuses):
        return "completed"

    # 하나라도 일정 확정이면 scheduled
    if "scheduled" in statuses:
        return "scheduled"

    # 그 외 (pending만 있음) → assigned
    return "assigned"


def sync_application_from_assignments(
    db: Session,
    application_id: int,
    trigger_source: str = "assignment_change"
) -> Tuple[Optional[str], Optional[str]]:
    """
    Assignment 상태 변경 시 Application 상태 자동 동기화

    Args:
        db: Database session
        application_id: Application ID
        trigger_source: 트리거 출처 (assignment_change, assignment_create, assignment_delete 등)

    Returns:
        (old_status, new_status) 튜플. 변경 없으면 동일한 값
    """
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if not application:
        return None, None

    assignments = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.application_id == application_id
    ).all()

    old_status = application.status
    new_status = calculate_application_status(assignments)

    # 상태가 변경되었을 때만 업데이트
    if old_status != new_status:
        application.status = new_status

        # 타임스탬프 업데이트
        now = datetime.now(timezone.utc)
        if new_status == "completed":
            application.completed_at = now

        db.flush()  # 변경사항을 DB에 반영하되 커밋은 호출자에게 위임

    return old_status, new_status


def get_status_mismatch_info(
    application: Application,
    assignments: List[ApplicationPartnerAssignment]
) -> Optional[dict]:
    """
    Application과 Assignment 간 상태 불일치 정보 반환

    Args:
        application: Application 모델 인스턴스
        assignments: Assignment 모델 인스턴스 리스트

    Returns:
        불일치가 있으면 상세 정보 딕셔너리, 없으면 None
    """
    if not assignments:
        return None

    expected_status = calculate_application_status(assignments)
    actual_status = application.status

    if expected_status != actual_status:
        return {
            "has_mismatch": True,
            "expected_status": expected_status,
            "actual_status": actual_status,
            "assignment_statuses": [
                {"id": a.id, "status": a.status, "partner_id": a.partner_id}
                for a in assignments
            ],
            "recommendation": f"신청 상태를 '{expected_status}'로 변경하는 것을 권장합니다."
        }

    return None


def auto_update_quote_status(
    db: Session,
    assignment: ApplicationPartnerAssignment
) -> str:
    """
    견적 항목 존재 여부에 따라 quote_status 자동 업데이트

    Args:
        db: Database session
        assignment: Assignment 모델 인스턴스

    Returns:
        업데이트된 quote_status
    """
    from app.models.quote_item import QuoteItem

    # 현재 quote_status가 none인 경우에만 draft로 자동 업데이트
    if assignment.quote_status == "none":
        has_quote_items = db.query(QuoteItem).filter(
            QuoteItem.assignment_id == assignment.id
        ).first() is not None

        if has_quote_items:
            assignment.quote_status = "draft"
            db.flush()

    return assignment.quote_status
