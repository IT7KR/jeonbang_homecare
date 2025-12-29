"""
파일 경로 토큰화 유틸리티
실제 파일 경로를 숨기고 토큰으로 접근하도록 함

확장된 페이로드 형식:
- 기본: {file_path}|{expires_at}
- 확장 v1: {file_path}|{expires_at}|{entity_type}|{entity_id}|{requires_auth}
- 확장 v2: {file_path}|{expires_at}|{entity_type}|{entity_id}|{requires_auth}|{created_at}
"""

import base64
import hashlib
import hmac
import time
from dataclasses import dataclass
from typing import Optional, Tuple
from urllib.parse import quote, unquote

from app.core.config import settings


@dataclass
class FileTokenInfo:
    """파일 토큰 디코딩 결과"""
    file_path: str
    expires_at: int
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    requires_auth: bool = False
    created_at: Optional[int] = None  # 토큰 생성 시간 (v2 이상)


def _get_signing_key() -> bytes:
    """서명용 키 생성"""
    return hashlib.sha256(settings.SECRET_KEY.encode()).digest()


def encode_file_token(
    file_path: str,
    expires_in: int = 86400 * 7,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    requires_auth: bool = False,
) -> str:
    """
    파일 경로를 토큰으로 인코딩

    Args:
        file_path: 실제 파일 경로 (예: /uploads/partners/1/file.jpg)
        expires_in: 토큰 만료 시간 (초, 기본 7일)
        entity_type: 관련 엔티티 유형 (partner, application)
        entity_id: 관련 엔티티 ID
        requires_auth: 인증 필요 여부

    Returns:
        인코딩된 토큰
    """
    # 현재 시간 및 만료 시간 계산
    created_at = int(time.time())
    expires_at = created_at + expires_in

    # 페이로드 구성
    payload_parts = [file_path, str(expires_at)]

    # 확장 메타데이터 추가 (entity_type이 있는 경우)
    if entity_type and entity_id is not None:
        payload_parts.extend([
            entity_type,
            str(entity_id),
            "1" if requires_auth else "0",
            str(created_at),  # v2: 생성 시간 추가
        ])

    payload = "|".join(payload_parts)

    # Base64 인코딩
    encoded_payload = base64.urlsafe_b64encode(payload.encode()).decode()

    # HMAC 서명 생성
    signature = hmac.new(
        _get_signing_key(),
        encoded_payload.encode(),
        hashlib.sha256
    ).hexdigest()[:16]  # 앞 16자만 사용

    # 토큰: 페이로드.서명
    return f"{encoded_payload}.{signature}"


def decode_file_token(token: str) -> Tuple[Optional[str], Optional[str]]:
    """
    토큰을 파일 경로로 디코딩 (하위 호환성 유지)

    Args:
        token: 인코딩된 토큰

    Returns:
        (file_path, error_message) 튜플
        성공 시 (파일경로, None), 실패 시 (None, 에러메시지)
    """
    result = decode_file_token_extended(token)
    if isinstance(result, str):
        return None, result
    return result.file_path, None


def decode_file_token_extended(token: str) -> FileTokenInfo | str:
    """
    토큰을 확장된 정보로 디코딩

    Args:
        token: 인코딩된 토큰

    Returns:
        성공 시 FileTokenInfo, 실패 시 에러 메시지 문자열
    """
    try:
        # 토큰 분리
        parts = token.split(".")
        if len(parts) != 2:
            return "Invalid token format"

        encoded_payload, signature = parts

        # 서명 검증
        expected_signature = hmac.new(
            _get_signing_key(),
            encoded_payload.encode(),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(signature, expected_signature):
            return "Invalid token signature"

        # 페이로드 디코딩
        payload = base64.urlsafe_b64decode(encoded_payload.encode()).decode()

        # 페이로드 파싱 (기본 형식: path|expires, 확장 형식: path|expires|type|id|auth)
        parts = payload.split("|")
        if len(parts) < 2:
            return "Invalid payload format"

        file_path = parts[0]
        expires_at = int(parts[1])

        # 만료 확인
        if time.time() > expires_at:
            return "Token expired"

        # 확장 메타데이터 파싱 (있는 경우)
        entity_type = None
        entity_id = None
        requires_auth = False
        created_at = None

        if len(parts) >= 5:
            entity_type = parts[2]
            entity_id = int(parts[3])
            requires_auth = parts[4] == "1"
            # v2: created_at 파싱
            if len(parts) >= 6:
                created_at = int(parts[5])

        return FileTokenInfo(
            file_path=file_path,
            expires_at=expires_at,
            entity_type=entity_type,
            entity_id=entity_id,
            requires_auth=requires_auth,
            created_at=created_at,
        )

    except Exception as e:
        return f"Token decode error: {str(e)}"


def decode_file_token_extended_no_expiry(token: str) -> FileTokenInfo | str:
    """
    토큰을 확장된 정보로 디코딩 (만료 확인 없음)

    DB에서 만료 시간을 별도로 관리하는 경우 사용.
    토큰 내부의 expires_at은 무시하고 서명만 검증합니다.

    Args:
        token: 인코딩된 토큰

    Returns:
        성공 시 FileTokenInfo, 실패 시 에러 메시지 문자열
    """
    try:
        # 토큰 분리
        parts = token.split(".")
        if len(parts) != 2:
            return "Invalid token format"

        encoded_payload, signature = parts

        # 서명 검증
        expected_signature = hmac.new(
            _get_signing_key(),
            encoded_payload.encode(),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(signature, expected_signature):
            return "Invalid token signature"

        # 페이로드 디코딩
        payload = base64.urlsafe_b64decode(encoded_payload.encode()).decode()

        # 페이로드 파싱 (기본 형식: path|expires, 확장 형식: path|expires|type|id|auth)
        parts = payload.split("|")
        if len(parts) < 2:
            return "Invalid payload format"

        file_path = parts[0]
        expires_at = int(parts[1])

        # 만료 확인 생략 - DB에서 별도로 확인

        # 확장 메타데이터 파싱 (있는 경우)
        entity_type = None
        entity_id = None
        requires_auth = False
        created_at = None

        if len(parts) >= 5:
            entity_type = parts[2]
            entity_id = int(parts[3])
            requires_auth = parts[4] == "1"
            # v2: created_at 파싱
            if len(parts) >= 6:
                created_at = int(parts[5])

        return FileTokenInfo(
            file_path=file_path,
            expires_at=expires_at,
            entity_type=entity_type,
            entity_id=entity_id,
            requires_auth=requires_auth,
            created_at=created_at,
        )

    except Exception as e:
        return f"Token decode error: {str(e)}"


def get_file_url(file_path: Optional[str]) -> Optional[str]:
    """
    파일 경로를 토큰 기반 URL로 변환

    Args:
        file_path: DB에 저장된 파일 경로 (예: /uploads/partners/1/file.jpg)

    Returns:
        토큰 기반 URL (예: /api/v1/files/{token}) 또는 None
    """
    if not file_path:
        return None

    token = encode_file_token(file_path)
    return f"/api/v1/files/{token}"
