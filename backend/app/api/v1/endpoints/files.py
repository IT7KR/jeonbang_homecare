"""
File serving API endpoints
토큰 기반 파일 서빙
"""

import os
from urllib.parse import quote
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.file_token import decode_file_token

router = APIRouter(prefix="/files", tags=["Files"])

# 업로드 디렉토리 (기본값)
UPLOAD_BASE_DIR = getattr(settings, 'UPLOAD_DIR', '/app/uploads')


@router.get("/{token}")
async def serve_file(token: str, download: bool = False):
    """
    토큰 기반 파일 서빙

    Args:
        token: 파일 접근 토큰
        download: True이면 다운로드, False이면 브라우저에서 보기

    Returns:
        파일 응답
    """
    # 토큰 디코딩
    file_path, error = decode_file_token(token)

    if error:
        raise HTTPException(status_code=403, detail=error)

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
