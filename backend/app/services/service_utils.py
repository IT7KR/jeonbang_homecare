"""
서비스 코드 → 이름 변환 유틸리티
DB service_types 테이블 기반 동적 변환
"""

from functools import lru_cache
from sqlalchemy.orm import Session
from typing import Optional

from app.models.service import ServiceType


@lru_cache(maxsize=1)
def _get_service_code_to_name_map(cache_key: str = "default") -> dict[str, str]:
    """
    서비스 코드 → 이름 매핑 조회 (캐시됨)

    Note: lru_cache는 세션 간에 공유되지 않으므로,
    이 함수는 앱 시작 시 한 번만 호출되어야 합니다.
    실제 운영에서는 Redis 등의 외부 캐시 사용 권장.
    """
    return {}


def get_service_code_to_name_map(db: Session) -> dict[str, str]:
    """
    서비스 코드 → 이름 매핑 조회

    Args:
        db: 데이터베이스 세션

    Returns:
        서비스 코드를 키로, 서비스 이름을 값으로 하는 딕셔너리
    """
    service_types = db.query(ServiceType.code, ServiceType.name).all()
    return {st.code: st.name for st in service_types}


def convert_service_codes_to_names(
    db: Session,
    codes: list[str] | None
) -> list[str]:
    """
    서비스 코드 배열을 서비스 이름 배열로 변환

    Args:
        db: 데이터베이스 세션
        codes: 서비스 코드 배열 (예: ["WEEDING", "SNOW_REMOVAL"])

    Returns:
        서비스 이름 배열 (예: ["제초 작업", "제설 작업"])
        매핑이 없는 코드는 원본 그대로 반환
    """
    if not codes:
        return []

    code_to_name = get_service_code_to_name_map(db)
    return [code_to_name.get(code, code) for code in codes]


def convert_service_code_to_name(
    db: Session,
    code: str | None
) -> str | None:
    """
    단일 서비스 코드를 서비스 이름으로 변환

    Args:
        db: 데이터베이스 세션
        code: 서비스 코드 (예: "WEEDING")

    Returns:
        서비스 이름 (예: "제초 작업")
        매핑이 없는 코드는 원본 그대로 반환
    """
    if not code:
        return None

    code_to_name = get_service_code_to_name_map(db)
    return code_to_name.get(code, code)
