"""
Common Validators
공통 검증 패턴 및 유틸리티
"""

import html
import re
from typing import Optional, Pattern

# ===== 정규식 패턴 정의 =====

# 전화번호 패턴 (한국 휴대폰)
# 010-1234-5678, 01012345678, 010-123-4567 등 허용
PHONE_PATTERN: str = r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
PHONE_REGEX: Pattern = re.compile(PHONE_PATTERN)

# 사업자등록번호 패턴
# 123-45-67890 또는 1234567890
BUSINESS_NUMBER_PATTERN: str = r"^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$"
BUSINESS_NUMBER_REGEX: Pattern = re.compile(BUSINESS_NUMBER_PATTERN)

# 이메일 패턴 (기본)
EMAIL_PATTERN: str = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
EMAIL_REGEX: Pattern = re.compile(EMAIL_PATTERN)


# ===== 검증 함수 =====

def validate_phone(phone: str) -> bool:
    """전화번호 형식 검증"""
    if not phone:
        return False
    return bool(PHONE_REGEX.match(phone))


def validate_business_number(business_number: str) -> bool:
    """사업자등록번호 형식 검증"""
    if not business_number:
        return False
    return bool(BUSINESS_NUMBER_REGEX.match(business_number))


def validate_email(email: str) -> bool:
    """이메일 형식 검증"""
    if not email:
        return False
    return bool(EMAIL_REGEX.match(email))


def format_phone(phone: str) -> str:
    """
    전화번호를 표준 형식(010-1234-5678)으로 변환

    Args:
        phone: 입력 전화번호

    Returns:
        str: 포맷된 전화번호
    """
    if not phone:
        return phone

    # 숫자만 추출
    digits = re.sub(r"[^0-9]", "", phone)

    if len(digits) == 10:
        # 010-123-4567
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11:
        # 010-1234-5678
        return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"

    return phone


def format_business_number(number: str) -> str:
    """
    사업자등록번호를 표준 형식(123-45-67890)으로 변환

    Args:
        number: 입력 사업자등록번호

    Returns:
        str: 포맷된 사업자등록번호
    """
    if not number:
        return number

    # 숫자만 추출
    digits = re.sub(r"[^0-9]", "", number)

    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:5]}-{digits[5:]}"

    return number


# ===== XSS 방어 함수 =====

# 위험한 스크립트 패턴
XSS_DANGEROUS_PATTERNS = [
    r"<script[^>]*>.*?</script>",  # script 태그
    r"javascript\s*:",  # javascript: 프로토콜
    r"on\w+\s*=",  # 이벤트 핸들러 (onclick, onerror 등)
    r"<\s*img[^>]+onerror",  # img onerror
    r"<\s*svg[^>]+onload",  # svg onload
    r"<\s*iframe",  # iframe 태그
    r"<\s*object",  # object 태그
    r"<\s*embed",  # embed 태그
    r"<\s*form",  # form 태그
    r"expression\s*\(",  # CSS expression
    r"url\s*\(\s*['\"]?\s*javascript",  # CSS url(javascript:)
]


def sanitize_html_input(text: Optional[str]) -> Optional[str]:
    """
    HTML 특수문자 이스케이프

    Args:
        text: 입력 텍스트

    Returns:
        str: 이스케이프된 텍스트
    """
    if not text:
        return text
    return html.escape(text)


def validate_no_xss(text: Optional[str]) -> str:
    """
    XSS 위험 패턴 검증 (Pydantic validator용)

    위험한 스크립트 패턴이 감지되면 ValueError 발생

    Args:
        text: 검증할 텍스트

    Returns:
        str: 검증된 원본 텍스트

    Raises:
        ValueError: 위험한 패턴 발견 시
    """
    if not text:
        return text

    for pattern in XSS_DANGEROUS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
            raise ValueError("보안상 허용되지 않는 문자가 포함되어 있습니다")

    return text


def check_xss_patterns(text: Optional[str]) -> bool:
    """
    XSS 위험 패턴 존재 여부 확인

    Args:
        text: 확인할 텍스트

    Returns:
        bool: 위험 패턴이 없으면 True, 있으면 False
    """
    if not text:
        return True

    for pattern in XSS_DANGEROUS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
            return False

    return True


def escape_for_display(text: Optional[str]) -> Optional[str]:
    """
    API 응답용 HTML 이스케이프
    DB에서 읽은 데이터를 프론트엔드로 전달하기 전에 이스케이프

    Args:
        text: 이스케이프할 텍스트

    Returns:
        str: 이스케이프된 텍스트
    """
    if not text:
        return text
    return html.escape(text)
