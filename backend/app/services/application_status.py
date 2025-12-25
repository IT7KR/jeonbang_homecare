"""
Application Status Service
신청 상태 전환 규칙 관리
"""

from typing import Dict, List, Set
from fastapi import HTTPException

# 유효한 상태 전환 규칙 정의
VALID_TRANSITIONS: Dict[str, List[str]] = {
    "new": ["consulting", "cancelled"],
    "consulting": ["assigned", "cancelled"],
    "assigned": ["scheduled", "consulting", "cancelled"],
    "scheduled": ["completed", "cancelled"],
    "completed": [],  # 최종 상태
    "cancelled": [],  # 최종 상태
}

# 상태별 한글 이름
STATUS_NAMES: Dict[str, str] = {
    "new": "신규",
    "consulting": "상담중",
    "assigned": "배정완료",
    "scheduled": "일정확정",
    "completed": "완료",
    "cancelled": "취소",
}

# 협력사 배정이 가능한 상태
ASSIGNABLE_STATUSES: Set[str] = {"new", "consulting"}

# 일정 설정이 가능한 상태
SCHEDULABLE_STATUSES: Set[str] = {"assigned", "scheduled"}


def validate_status_transition(current_status: str, next_status: str) -> bool:
    """
    상태 전환이 유효한지 검증

    Args:
        current_status: 현재 상태
        next_status: 변경하려는 상태

    Returns:
        bool: 전환 가능 여부
    """
    # 같은 상태로의 전환은 허용
    if current_status == next_status:
        return True

    return next_status in VALID_TRANSITIONS.get(current_status, [])


def check_status_transition(current_status: str, next_status: str) -> None:
    """
    상태 전환을 검증하고 실패 시 HTTPException 발생

    Args:
        current_status: 현재 상태
        next_status: 변경하려는 상태

    Raises:
        HTTPException: 유효하지 않은 상태 전환인 경우
    """
    if not validate_status_transition(current_status, next_status):
        current_name = STATUS_NAMES.get(current_status, current_status)
        next_name = STATUS_NAMES.get(next_status, next_status)
        allowed = VALID_TRANSITIONS.get(current_status, [])
        allowed_names = [STATUS_NAMES.get(s, s) for s in allowed]

        if not allowed:
            raise HTTPException(
                status_code=400,
                detail=f"'{current_name}' 상태에서는 상태를 변경할 수 없습니다"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"'{current_name}' 상태에서 '{next_name}'(으)로 변경할 수 없습니다. 가능한 상태: {', '.join(allowed_names)}"
            )


def can_assign_partner(status: str) -> bool:
    """
    협력사 배정이 가능한 상태인지 확인

    Args:
        status: 현재 상태

    Returns:
        bool: 배정 가능 여부
    """
    return status in ASSIGNABLE_STATUSES


def can_schedule(status: str) -> bool:
    """
    일정 설정이 가능한 상태인지 확인

    Args:
        status: 현재 상태

    Returns:
        bool: 일정 설정 가능 여부
    """
    return status in SCHEDULABLE_STATUSES


def get_next_status_options(current_status: str) -> List[Dict[str, str]]:
    """
    현재 상태에서 전환 가능한 상태 목록 반환

    Args:
        current_status: 현재 상태

    Returns:
        List[Dict]: 전환 가능한 상태 목록 [{value, label}]
    """
    allowed = VALID_TRANSITIONS.get(current_status, [])
    return [
        {"value": status, "label": STATUS_NAMES.get(status, status)}
        for status in allowed
    ]
