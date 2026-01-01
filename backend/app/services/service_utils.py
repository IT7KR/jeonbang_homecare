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


def convert_service_codes_with_map(
    service_map: dict[str, str],
    codes: list[str] | None
) -> list[str]:
    """
    캐시된 서비스 맵을 사용하여 코드→이름 변환 (DB 조회 없음)

    N+1 쿼리 방지를 위해 미리 조회한 service_map을 재사용합니다.
    목록 조회 시 루프 전에 get_service_code_to_name_map()을 한 번 호출하고,
    각 항목에 이 함수를 사용하세요.

    Args:
        service_map: get_service_code_to_name_map()으로 조회한 매핑 딕셔너리
        codes: 서비스 코드 배열 (예: ["WEEDING", "SNOW_REMOVAL"])

    Returns:
        서비스 이름 배열 (예: ["제초 작업", "제설 작업"])
        매핑이 없는 코드는 원본 그대로 반환
    """
    if not codes:
        return []

    return [service_map.get(code, code) for code in codes]


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


def get_service_name_to_code_map(db: Session) -> dict[str, str]:
    """
    서비스 이름 → 코드 매핑 조회

    Args:
        db: 데이터베이스 세션

    Returns:
        서비스 이름을 키로, 서비스 코드를 값으로 하는 딕셔너리
    """
    service_types = db.query(ServiceType.code, ServiceType.name).all()
    return {st.name: st.code for st in service_types}


def convert_service_names_to_codes(
    db: Session,
    names: list[str] | None
) -> list[str]:
    """
    서비스 이름 배열을 서비스 코드 배열로 변환

    Args:
        db: 데이터베이스 세션
        names: 서비스 이름 배열 (예: ["제초 작업", "제설 작업"])

    Returns:
        서비스 코드 배열 (예: ["WEEDING", "SNOW_REMOVAL"])
        매핑이 없는 이름은 원본 그대로 반환
    """
    if not names:
        return []

    name_to_code = get_service_name_to_code_map(db)
    return [name_to_code.get(name, name) for name in names]


def convert_service_name_to_code(
    db: Session,
    name: str | None
) -> str | None:
    """
    단일 서비스 이름을 서비스 코드로 변환

    Args:
        db: 데이터베이스 세션
        name: 서비스 이름 (예: "제초 작업")

    Returns:
        서비스 코드 (예: "WEEDING")
        매핑이 없는 이름은 원본 그대로 반환
    """
    if not name:
        return None

    name_to_code = get_service_name_to_code_map(db)
    return name_to_code.get(name, name)
