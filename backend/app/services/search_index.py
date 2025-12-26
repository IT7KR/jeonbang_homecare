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
from sqlalchemy.orm import Session
from sqlalchemy import or_

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


def create_search_index(
    db: Session,
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
    delete_search_index(db, entity_type, entity_id, field_type)

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


def delete_search_index(
    db: Session,
    entity_type: EntityType,
    entity_id: int,
    field_type: Optional[FieldType] = None
) -> None:
    """검색 인덱스 삭제

    field_type이 None이면 해당 엔티티의 모든 인덱스 삭제
    """
    query = db.query(SearchIndex).filter(
        SearchIndex.entity_type == entity_type,
        SearchIndex.entity_id == entity_id
    )

    if field_type:
        query = query.filter(SearchIndex.field_type == field_type)

    query.delete(synchronize_session=False)


def update_application_search_index(
    db: Session,
    application_id: int,
    customer_name: str,
    customer_phone: str
) -> None:
    """신청 검색 인덱스 갱신"""
    create_search_index(db, "application", application_id, "name", customer_name)
    create_search_index(db, "application", application_id, "phone", customer_phone)


def update_partner_search_index(
    db: Session,
    partner_id: int,
    representative_name: str,
    contact_phone: str
) -> None:
    """협력사 검색 인덱스 갱신"""
    create_search_index(db, "partner", partner_id, "name", representative_name)
    create_search_index(db, "partner", partner_id, "phone", contact_phone)


def search_by_field(
    db: Session,
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
        results = db.query(SearchIndex.entity_id).filter(
            SearchIndex.entity_type == entity_type,
            SearchIndex.field_type == field_type,
            SearchIndex.hash_value == hash_value
        ).distinct().all()
    else:
        # 부분 매칭: 토큰으로 검색
        results = db.query(SearchIndex.entity_id).filter(
            SearchIndex.entity_type == entity_type,
            SearchIndex.field_type == field_type,
            SearchIndex.search_token.ilike(f"%{normalized}%")
        ).distinct().all()

    return [r[0] for r in results]


def unified_search(
    db: Session,
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
        return search_by_field(db, entity_type, "phone", query)
    else:
        return search_by_field(db, entity_type, "name", query)


def detect_search_type(query: str) -> str:
    """검색어로 검색 타입 자동 감지

    Returns:
        'phone': 전화번호
        'name': 이름
    """
    # 숫자와 하이픈만 있고, 숫자가 4개 이상이면 전화번호
    cleaned = query.replace("-", "").replace(" ", "")
    if cleaned.isdigit() and len(cleaned) >= 4:
        return "phone"

    # 기본: 이름
    return "name"
