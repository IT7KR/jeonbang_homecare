"""
File Validators
파일 업로드 보안 검증 유틸리티
"""

from typing import Optional
import os


# ===== 매직 바이트 시그니처 =====
# 파일 시작 부분의 바이트 패턴으로 실제 파일 형식 확인

MAGIC_SIGNATURES = {
    "image/jpeg": [
        b"\xff\xd8\xff\xe0",  # JFIF
        b"\xff\xd8\xff\xe1",  # EXIF
        b"\xff\xd8\xff\xe8",  # SPIFF
        b"\xff\xd8\xff\xdb",  # Raw JPEG
        b"\xff\xd8\xff\xee",  # JPEG with Adobe marker
    ],
    "image/png": [
        b"\x89PNG\r\n\x1a\n",  # PNG 시그니처
    ],
    "application/pdf": [
        b"%PDF",  # PDF 시그니처
    ],
    "image/gif": [
        b"GIF87a",  # GIF87
        b"GIF89a",  # GIF89
    ],
    "image/webp": [
        b"RIFF",  # WebP (RIFF 컨테이너)
    ],
}

# 위험한 파일 확장자 패턴
DANGEROUS_EXTENSIONS = [
    ".php",
    ".phtml",
    ".php3",
    ".php4",
    ".php5",
    ".phar",
    ".asp",
    ".aspx",
    ".jsp",
    ".jspx",
    ".exe",
    ".dll",
    ".sh",
    ".bash",
    ".bat",
    ".cmd",
    ".ps1",
    ".py",
    ".pl",
    ".cgi",
    ".htaccess",
    ".htpasswd",
]


def validate_file_magic(content: bytes, expected_mime: str) -> bool:
    """
    파일 매직 바이트 검증

    파일 내용의 시작 바이트를 확인하여 실제 파일 형식이
    예상한 MIME 타입과 일치하는지 확인

    Args:
        content: 파일 내용 (바이트)
        expected_mime: 예상 MIME 타입

    Returns:
        bool: 매직 바이트가 일치하면 True
    """
    if not content:
        return False

    signatures = MAGIC_SIGNATURES.get(expected_mime, [])
    if not signatures:
        # 알려지지 않은 MIME 타입은 검증 불가 - 거부
        return False

    for signature in signatures:
        if content.startswith(signature):
            return True

    # WebP 특수 처리 (RIFF + 4바이트 + WEBP)
    if expected_mime == "image/webp":
        if content.startswith(b"RIFF") and len(content) > 12:
            if content[8:12] == b"WEBP":
                return True

    return False


def validate_filename_security(filename: str) -> tuple[bool, Optional[str]]:
    """
    파일명 보안 검증

    위험한 확장자 패턴과 더블 확장자 공격을 탐지

    Args:
        filename: 검증할 파일명

    Returns:
        tuple: (검증 통과 여부, 실패 시 오류 메시지)
    """
    if not filename:
        return False, "파일명이 비어있습니다"

    lower_name = filename.lower()

    # 1. 위험한 확장자 검사 (파일명 어디에든 포함되면 거부)
    for ext in DANGEROUS_EXTENSIONS:
        if ext in lower_name:
            return False, f"보안상 허용되지 않는 파일 형식입니다: {ext}"

    # 2. 더블 확장자 공격 검사 (확장자가 2개 이상인 경우)
    # 예: malware.php.jpg, shell.asp.png
    parts = filename.split(".")
    if len(parts) > 2:
        # 마지막 확장자 제외하고 위험한 확장자가 있는지 확인
        for part in parts[1:-1]:
            for ext in DANGEROUS_EXTENSIONS:
                if f".{part.lower()}" == ext:
                    return False, "다중 확장자 파일은 허용되지 않습니다"

    # 3. 널 바이트 검사
    if "\x00" in filename or "%00" in filename:
        return False, "파일명에 허용되지 않는 문자가 포함되어 있습니다"

    # 4. 경로 구분자 검사 (Path Traversal)
    if "/" in filename or "\\" in filename or ".." in filename:
        return False, "파일명에 허용되지 않는 문자가 포함되어 있습니다"

    # 5. 특수 문자 검사
    dangerous_chars = ["<", ">", ":", '"', "|", "?", "*"]
    for char in dangerous_chars:
        if char in filename:
            return False, f"파일명에 허용되지 않는 문자가 포함되어 있습니다: {char}"

    return True, None


def get_safe_extension(filename: str, allowed_extensions: set[str]) -> Optional[str]:
    """
    안전한 파일 확장자 추출

    Args:
        filename: 파일명
        allowed_extensions: 허용된 확장자 집합 (예: {".jpg", ".png", ".pdf"})

    Returns:
        str: 허용된 확장자 또는 None
    """
    if not filename:
        return None

    # 마지막 확장자만 추출
    ext = os.path.splitext(filename)[1].lower()

    if ext in allowed_extensions:
        return ext

    return None


def validate_file_size(content: bytes, max_size: int) -> tuple[bool, Optional[str]]:
    """
    파일 크기 검증

    Args:
        content: 파일 내용 (바이트)
        max_size: 최대 허용 크기 (바이트)

    Returns:
        tuple: (검증 통과 여부, 실패 시 오류 메시지)
    """
    size = len(content)

    if size == 0:
        return False, "빈 파일은 업로드할 수 없습니다"

    if size > max_size:
        max_mb = max_size / (1024 * 1024)
        return False, f"파일 크기는 {max_mb:.1f}MB 이하여야 합니다"

    return True, None


def get_mime_from_extension(extension: str) -> Optional[str]:
    """
    확장자에서 MIME 타입 추론

    Args:
        extension: 파일 확장자 (예: ".jpg")

    Returns:
        str: MIME 타입 또는 None
    """
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }

    return mime_map.get(extension.lower())
