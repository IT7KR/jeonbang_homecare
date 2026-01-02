"""
File serving API endpoints
토큰 기반 파일 서빙 (감사 로깅 및 접근 제어 포함)
"""

import os
import logging
from typing import Optional
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.file_token import decode_file_token_extended, FileTokenInfo
from app.core.database import get_db
from app.core.security import get_current_admin_optional
from app.models.admin import Admin
from app.services.audit import log_file_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["Files"])

# 업로드 디렉토리 (기본값)
UPLOAD_BASE_DIR = getattr(settings, 'UPLOAD_DIR', '/app/uploads')

# 파일 접근 모드
FILE_ACCESS_MODE = getattr(settings, 'FILE_ACCESS_MODE', 'public')


def _extract_entity_from_path(file_path: str) -> tuple[Optional[str], Optional[int]]:
    """
    파일 경로에서 관련 엔티티 정보 추출

    /uploads/partners/123/file.jpg -> ("partner", 123)
    /uploads/applications/456/file.jpg -> ("application", 456)
    """
    try:
        parts = file_path.strip("/").split("/")
        if len(parts) >= 3:
            entity_type = parts[1].rstrip("s")  # partners -> partner
            entity_id = int(parts[2])
            return entity_type, entity_id
    except (ValueError, IndexError):
        pass
    return None, None


@router.get("/{token}")
async def serve_file(
    token: str,
    download: bool = False,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_admin: Optional[Admin] = Depends(get_current_admin_optional),
):
    """
    토큰 기반 파일 서빙

    Args:
        token: 파일 접근 토큰
        download: True이면 다운로드, False이면 브라우저에서 보기

    Returns:
        파일 응답

    접근 제어:
        - FILE_ACCESS_MODE=public: 토큰만으로 접근 가능
        - FILE_ACCESS_MODE=admin_only: 관리자 JWT 인증 필수
        - 토큰에 requires_auth=True 설정: 관리자 JWT 인증 필수
    """
    # 토큰 디코딩 (확장된 정보 포함)
    token_result = decode_file_token_extended(token)

    # 에러인 경우 문자열 반환
    if isinstance(token_result, str):
        raise HTTPException(status_code=403, detail=token_result)

    token_info: FileTokenInfo = token_result
    file_path = token_info.file_path

    # 접근 권한 확인
    requires_auth = (
        FILE_ACCESS_MODE == "admin_only" or
        token_info.requires_auth
    )

    if requires_auth and current_admin is None:
        raise HTTPException(
            status_code=401,
            detail="이 파일에 접근하려면 관리자 인증이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    # 파일 경로 검증 (/uploads/... 형태)
    if not file_path.startswith("/uploads/"):
        raise HTTPException(status_code=403, detail="Invalid file path")

    # 실제 파일 시스템 경로로 변환
    # /uploads/partners/1/file.jpg -> /app/uploads/partners/1/file.jpg
    relative_path = file_path[len("/uploads/"):]  # "partners/1/file.jpg"
    full_path = os.path.join(UPLOAD_BASE_DIR, relative_path)

    # 경로 보안 검증 (path traversal 방지)
    if not os.path.abspath(full_path).startswith(os.path.abspath(UPLOAD_BASE_DIR)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    # 파일명 추출
    filename = os.path.basename(full_path)

    # 파일 정보 수집
    file_size = os.path.getsize(full_path)

    # 엔티티 정보: 토큰에서 먼저 가져오고, 없으면 경로에서 추출
    entity_type = token_info.entity_type
    entity_id = token_info.entity_id
    if not entity_type:
        entity_type, entity_id = _extract_entity_from_path(file_path)

    # 감사 로그 기록
    action = "download" if download else "view"
    try:
        await log_file_access(
            db=db,
            action=action,
            file_path=file_path,
            file_size=file_size,
            original_name=filename,
            related_entity_type=entity_type,
            related_entity_id=entity_id,
            admin=current_admin,  # 인증된 관리자 정보 추가
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to log file access: {e}")
        # 로깅 실패해도 파일 서빙은 계속

    if download:
        # RFC 5987 방식으로 파일명 인코딩 (한글 파일명 지원, 헤더 인젝션 방지)
        # 파일명에서 위험한 문자 제거
        safe_filename = filename.replace('"', "").replace("\\", "").replace("\n", "").replace("\r", "")
        encoded_filename = quote(safe_filename, safe="")

        return FileResponse(
            full_path,
            filename=safe_filename,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )

    return FileResponse(full_path)
