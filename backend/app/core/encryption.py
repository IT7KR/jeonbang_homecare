"""
Encryption utilities for sensitive data
고객 정보(customer_name, customer_phone, customer_address 등) 암호화

Blind Index (검색용 해시):
- 암호화된 필드를 검색하기 위한 단방향 해시
- 중복 검사 및 고객/협력사 식별에 사용
"""

import base64
import hashlib
import re
from typing import Literal

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


# =============================================================================
# Blind Index (검색용 해시) 함수
# =============================================================================

FieldType = Literal["phone", "business_number", "name", "company_name"]


def normalize_value(value: str, field_type: FieldType) -> str:
    """
    필드 타입별 값 정규화

    - phone: 010-1234-5678 → 01012345678
    - business_number: 123-45-67890 → 1234567890
    - name: 공백 제거, 소문자화
    - company_name: 공백 정규화, 소문자화
    """
    if not value:
        return ""

    value = value.strip()

    if field_type == "phone":
        # 숫자만 추출
        return re.sub(r"[^0-9]", "", value)

    elif field_type == "business_number":
        # 숫자만 추출
        return re.sub(r"[^0-9]", "", value)

    elif field_type == "name":
        # 공백 제거, 소문자화
        return value.replace(" ", "").lower()

    elif field_type == "company_name":
        # 연속 공백을 단일 공백으로, 소문자화
        return re.sub(r"\s+", " ", value).strip().lower()

    return value


def generate_search_hash(value: str | None, field_type: FieldType) -> str | None:
    """
    검색용 Blind Index 해시 생성

    Args:
        value: 원본 값 (예: "010-1234-5678")
        field_type: 필드 타입 ("phone", "business_number", "name", "company_name")

    Returns:
        SHA256 해시 문자열 (64자) 또는 None

    Example:
        >>> generate_search_hash("010-1234-5678", "phone")
        "a1b2c3d4e5f6..."  # 64자 해시
    """
    if value is None or value.strip() == "":
        return None

    normalized = normalize_value(value, field_type)
    if not normalized:
        return None

    # salt + field_type + normalized_value 조합으로 해시 생성
    salted = f"{settings.SEARCH_HASH_SALT}:{field_type}:{normalized}"
    return hashlib.sha256(salted.encode()).hexdigest()


def generate_composite_hash(values: list[tuple[str | None, FieldType]]) -> str | None:
    """
    복합 키 해시 생성 (예: 전화번호 + 회사명)

    Args:
        values: [(value, field_type), ...] 튜플 리스트

    Returns:
        SHA256 해시 문자열 (64자) 또는 None

    Example:
        >>> generate_composite_hash([
        ...     ("010-1234-5678", "phone"),
        ...     ("전방홈케어", "company_name")
        ... ])
        "x1y2z3..."  # 64자 해시
    """
    normalized_parts = []

    for value, field_type in values:
        if value is None or value.strip() == "":
            return None  # 하나라도 비어있으면 복합 해시 생성 불가
        normalized = normalize_value(value, field_type)
        if not normalized:
            return None
        normalized_parts.append(f"{field_type}:{normalized}")

    # 모든 부분을 결합하여 해시 생성
    combined = f"{settings.SEARCH_HASH_SALT}:composite:" + "|".join(normalized_parts)
    return hashlib.sha256(combined.encode()).hexdigest()


from functools import lru_cache

@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    """Generate Fernet instance from SECRET_KEY (Cached)"""
    # Derive a key from SECRET_KEY using PBKDF2
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"jeonbang_homecare_salt",  # Fixed salt for consistency
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return Fernet(key)


def encrypt_value(value: str | None) -> str | None:
    """Encrypt a string value"""
    if value is None or value == "":
        return value

    fernet = _get_fernet()
    encrypted = fernet.encrypt(value.encode())
    return encrypted.decode()


def decrypt_value(encrypted_value: str | None) -> str | None:
    """Decrypt an encrypted string value"""
    if encrypted_value is None or encrypted_value == "":
        return encrypted_value

    try:
        fernet = _get_fernet()
        decrypted = fernet.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception:
        # Return original value if decryption fails (for backward compatibility)
        return encrypted_value
