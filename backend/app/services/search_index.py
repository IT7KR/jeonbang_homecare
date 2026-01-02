"""
Search Index Service
암호화된 필드 검색을 위한 인덱스 관리 서비스

주요 기능:
- 해시 생성 (정확 매칭용)
- 토큰 생성 (부분 검색용)
- 인덱스 생성/삭제/갱신
- 검색 (이름, 전화번호)
"""

import hashlib
import re
from typing import List, Optional, Literal
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.search_index import SearchIndex


EntityType = Literal["application", "partner"]
FieldType = Literal["name", "phone"]


def normalize_value(value: str) -> str:
    """검색값 정규화 (공백/특수문자 제거, 소문자 변환)"""
    if not value:
        return ""
    # 한글, 영문, 숫자만 남기고 소문자로 변환
    return "".join(c.lower() for c in value if c.isalnum() or ord(c) > 0x1100)


def normalize_phone(phone: str) -> str:
    """전화번호 정규화 (숫자만 추출)"""
    if not phone:
        return ""
    return "".join(c for c in phone if c.isdigit())


def generate_search_hash(value: str, field_type: FieldType) -> str:
    """단방향 해시 생성 (정확 매칭용)"""
    if not value:
        return ""

    # 필드 타입에 따른 정규화
    if field_type == "phone":
        normalized = normalize_phone(value)
    else:
        normalized = normalize_value(value)

    if not normalized:
        return ""

    salt = settings.SEARCH_HASH_SALT
    return hashlib.sha256(f"{salt}:{normalized}".encode()).hexdigest()


def generate_search_tokens(value: str, field_type: FieldType) -> List[str]:
    """부분 검색을 위한 토큰 생성

    전화번호: 연속된 숫자 시퀀스 (최소 4자리)
    이름: 2글자 이상의 연속 문자열
    """
    if not value:
        return []

    # 필드 타입에 따른 정규화
    if field_type == "phone":
        normalized = normalize_phone(value)
        min_length = 4  # 전화번호는 최소 4자리
    else:
        normalized = normalize_value(value)
        min_length = 2  # 이름은 최소 2글자

    if len(normalized) < min_length:
        return [normalized] if normalized else []

    tokens = set()
    # 전체 문자열 추가
    tokens.add(normalized)

    # N-gram 방식으로 토큰 생성
    for i in range(len(normalized)):
        for j in range(i + min_length, len(normalized) + 1):
            token = normalized[i:j]
            if len(token) >= min_length:
                tokens.add(token)

    return list(tokens)


async def create_search_index(
    db: AsyncSession,
    entity_type: EntityType,
    entity_id: int,
    field_type: FieldType,
    value: str
) -> None:
    """검색 인덱스 생성

    기존 인덱스가 있으면 삭제 후 새로 생성
    """
    if not value:
        return

    # 기존 인덱스 삭제
    await delete_search_index(db, entity_type, entity_id, field_type)

    # 해시 생성
    hash_value = generate_search_hash(value, field_type)
    if not hash_value:
        return

    # 토큰 생성
    tokens = generate_search_tokens(value, field_type)

    # 인덱스 생성 (토큰별로)
    for token in tokens:
        index = SearchIndex(
            entity_type=entity_type,
            entity_id=entity_id,
            field_type=field_type,
            search_token=token,
            hash_value=hash_value
        )
        db.add(index)


async def delete_search_index(
    db: AsyncSession,
    entity_type: EntityType,
    entity_id: int,
    field_type: Optional[FieldType] = None
) -> None:
    """검색 인덱스 삭제

    field_type이 None이면 해당 엔티티의 모든 인덱스 삭제
    """
    stmt = delete(SearchIndex).where(
        SearchIndex.entity_type == entity_type,
        SearchIndex.entity_id == entity_id
    )

    if field_type:
        stmt = stmt.where(SearchIndex.field_type == field_type)

    await db.execute(stmt)


async def update_application_search_index(
    db: AsyncSession,
    application_id: int,
    customer_name: str,
    customer_phone: str
) -> None:
    """신청 검색 인덱스 갱신"""
    await create_search_index(db, "application", application_id, "name", customer_name)
    await create_search_index(db, "application", application_id, "phone", customer_phone)


async def update_partner_search_index(
    db: AsyncSession,
    partner_id: int,
    representative_name: str,
    contact_phone: str
) -> None:
    """협력사 검색 인덱스 갱신"""
    await create_search_index(db, "partner", partner_id, "name", representative_name)
    await create_search_index(db, "partner", partner_id, "phone", contact_phone)


async def search_by_field(
    db: AsyncSession,
    entity_type: EntityType,
    field_type: FieldType,
    query: str,
    exact_match: bool = False
) -> List[int]:
    """필드로 검색하여 entity_id 목록 반환

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 타입 ('application' / 'partner')
        field_type: 필드 타입 ('name' / 'phone')
        query: 검색어
        exact_match: 정확 매칭 여부 (True: 해시 검색, False: 토큰 검색)

    Returns:
        매칭된 entity_id 목록
    """
    if not query:
        return []

    # 정규화
    if field_type == "phone":
        normalized = normalize_phone(query)
    else:
        normalized = normalize_value(query)

    if not normalized:
        return []

    if exact_match:
        # 정확 매칭: 해시로 검색
        hash_value = generate_search_hash(query, field_type)
        stmt = (
            select(SearchIndex.entity_id)
            .where(
                SearchIndex.entity_type == entity_type,
                SearchIndex.field_type == field_type,
                SearchIndex.hash_value == hash_value
            )
            .distinct()
        )
    else:
        # 부분 매칭: 토큰으로 검색
        stmt = (
            select(SearchIndex.entity_id)
            .where(
                SearchIndex.entity_type == entity_type,
                SearchIndex.field_type == field_type,
                SearchIndex.search_token.ilike(f"%{normalized}%")
            )
            .distinct()
        )

    result = await db.execute(stmt)
    return [r[0] for r in result.all()]


async def unified_search(
    db: AsyncSession,
    entity_type: EntityType,
    query: str,
    search_type: Optional[str] = None
) -> List[int]:
    """통합 검색 - 자동으로 검색 타입 감지

    Args:
        db: 데이터베이스 세션
        entity_type: 엔티티 타입
        query: 검색어
        search_type: 검색 타입 (auto/name/phone) - None이면 자동 감지

    Returns:
        매칭된 entity_id 목록
    """
    if not query:
        return []

    # 검색 타입 자동 감지
    if search_type is None or search_type == "auto":
        search_type = detect_search_type(query)

    if search_type == "phone":
        return await search_by_field(db, entity_type, "phone", query)
    else:
        return await search_by_field(db, entity_type, "name", query)


def is_valid_date(date_str: str) -> bool:
    """YYYYMMDD 형식의 날짜 유효성 검사"""
    if len(date_str) != 8:
        return False

    try:
        year = int(date_str[0:4])
        month = int(date_str[4:6])
        day = int(date_str[6:8])

        # 연도: 2020~2099
        if year < 2020 or year > 2099:
            return False
        # 월: 1~12
        if month < 1 or month > 12:
            return False
        # 일: 1~31
        if day < 1 or day > 31:
            return False

        return True
    except ValueError:
        return False


def detect_search_type(query: str) -> str:
    """검색어로 검색 타입 자동 감지

    Returns:
        'number': 신청번호 (YYYYMMDD-XXX 또는 YYYYMMDDXXX 형식)
        'phone': 전화번호
        'name': 이름
    """
    import re

    # 신청번호: 하이픈 있는 경우 (YYYYMMDD-XXX)
    if re.match(r'^\d{8}-\d{1,3}$', query):
        date_part = query[0:8]
        if is_valid_date(date_part):
            return "number"

    # 신청번호: 하이픈 없는 경우 (9~11자리 숫자, 앞 8자리가 유효한 날짜)
    if re.match(r'^\d{9,11}$', query):
        date_part = query[0:8]
        if is_valid_date(date_part):
            return "number"

    # 전화번호: 숫자/하이픈만, 4~11자리
    cleaned = query.replace("-", "").replace(" ", "")
    if cleaned.isdigit() and 4 <= len(cleaned) <= 11:
        return "phone"

    # 기본: 이름
    return "name"
