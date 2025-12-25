"""
파일 경로 토큰화 유틸리티
실제 파일 경로를 숨기고 토큰으로 접근하도록 함
"""

import base64
import hashlib
import hmac
import time
from typing import Optional, Tuple
from urllib.parse import quote, unquote

from app.core.config import settings


def _get_signing_key() -> bytes:
    """서명용 키 생성"""
    return hashlib.sha256(settings.SECRET_KEY.encode()).digest()


def encode_file_token(file_path: str, expires_in: int = 86400 * 7) -> str:
    """
    파일 경로를 토큰으로 인코딩

    Args:
        file_path: 실제 파일 경로 (예: /uploads/partners/1/file.jpg)
        expires_in: 토큰 만료 시간 (초, 기본 7일)

    Returns:
        인코딩된 토큰
    """
    # 만료 시간 계산
    expires_at = int(time.time()) + expires_in

    # 페이로드: 경로|만료시간
    payload = f"{file_path}|{expires_at}"

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
    토큰을 파일 경로로 디코딩

    Args:
        token: 인코딩된 토큰

    Returns:
        (file_path, error_message) 튜플
        성공 시 (파일경로, None), 실패 시 (None, 에러메시지)
    """
    try:
        # 토큰 분리
        parts = token.split(".")
        if len(parts) != 2:
            return None, "Invalid token format"

        encoded_payload, signature = parts

        # 서명 검증
        expected_signature = hmac.new(
            _get_signing_key(),
            encoded_payload.encode(),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(signature, expected_signature):
            return None, "Invalid token signature"

        # 페이로드 디코딩
        payload = base64.urlsafe_b64decode(encoded_payload.encode()).decode()

        # 경로와 만료시간 분리
        parts = payload.rsplit("|", 1)
        if len(parts) != 2:
            return None, "Invalid payload format"

        file_path, expires_at_str = parts
        expires_at = int(expires_at_str)

        # 만료 확인
        if time.time() > expires_at:
            return None, "Token expired"

        return file_path, None

    except Exception as e:
        return None, f"Token decode error: {str(e)}"


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
