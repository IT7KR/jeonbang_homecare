"""
Application Status Service
신청 상태 전환 규칙 관리
"""

from typing import Dict, List, Set
from fastapi import HTTPException

# 모든 유효한 상태 목록
ALL_STATUSES: List[str] = ["new", "consulting", "assigned", "scheduled", "completed", "cancelled"]

# 상태별 한글 이름
STATUS_NAMES: Dict[str, str] = {
    "new": "신규",
    "consulting": "상담중",
    "assigned": "배정완료",
    "scheduled": "일정확정",
    "completed": "완료",
    "cancelled": "취소",
}

# 협력사 배정이 가능한 상태 (모든 상태에서 가능)
ASSIGNABLE_STATUSES: Set[str] = set(ALL_STATUSES)

# 일정 설정이 가능한 상태 (모든 상태에서 가능)
SCHEDULABLE_STATUSES: Set[str] = set(ALL_STATUSES)


def validate_status_transition(current_status: str, next_status: str) -> bool:
    """
    상태 전환이 유효한지 검증

    Args:
        current_status: 현재 상태
        next_status: 변경하려는 상태

    Returns:
        bool: 전환 가능 여부 (모든 상태 간 전환 허용)
    """
    # 모든 상태 간 전환 허용
    return next_status in ALL_STATUSES


def check_status_transition(current_status: str, next_status: str) -> None:
    """
    상태 전환을 검증하고 실패 시 HTTPException 발생

    Args:
        current_status: 현재 상태
        next_status: 변경하려는 상태

    Raises:
        HTTPException: 유효하지 않은 상태인 경우
    """
    if not validate_status_transition(current_status, next_status):
        next_name = STATUS_NAMES.get(next_status, next_status)
        raise HTTPException(
            status_code=400,
            detail=f"'{next_name}'은(는) 유효하지 않은 상태입니다"
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
    # 현재 상태를 제외한 모든 상태 반환
    return [
        {"value": status, "label": STATUS_NAMES.get(status, status)}
        for status in ALL_STATUSES
        if status != current_status
    ]
