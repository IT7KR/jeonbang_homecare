"""
File Upload Service
파일 업로드 공통 서비스
"""

import os
import logging
from typing import Optional
from datetime import datetime
from fastapi import UploadFile, HTTPException

from app.services.image import process_uploaded_image

logger = logging.getLogger(__name__)

# 업로드 설정
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"}
MAX_FILES_PER_UPLOAD = 30  # 한 번에 최대 30개 파일 업로드 가능


async def process_uploaded_files(
    files: list[UploadFile],
    upload_dir: str,
    max_files: int = MAX_FILES_PER_UPLOAD,
    allowed_types: Optional[set[str]] = None,
    entity_type: str = "applications",
) -> list[str]:
    """
    업로드된 파일들을 처리하고 저장

    Args:
        files: UploadFile 리스트
        upload_dir: 업로드 디렉토리 경로
        max_files: 최대 파일 수
        allowed_types: 허용된 MIME 타입 (기본: 이미지)
        entity_type: 엔티티 유형 (applications, partners 등)

    Returns:
        저장된 파일 경로 리스트

    Raises:
        HTTPException: 파일 처리 오류 시
    """
    if allowed_types is None:
        allowed_types = ALLOWED_IMAGE_TYPES

    saved_paths: list[str] = []

    for file in files[:max_files]:
        # 빈 파일 스킵
        if not file.filename:
            continue

        # MIME 타입 검증
        if file.content_type not in allowed_types:
            logger.warning(f"Skipped invalid file type: {file.content_type} for {file.filename}")
            continue

        try:
            # 파일 읽기
            content = await file.read()

            # 파일 크기 검증
            if len(content) > MAX_FILE_SIZE:
                logger.warning(f"Skipped oversized file: {file.filename} ({len(content)} bytes)")
                continue

            # 이미지 처리 및 저장
            if file.content_type and file.content_type.startswith("image/"):
                result = process_uploaded_image(
                    image_data=content,
                    original_filename=file.filename,
                    upload_dir=upload_dir,
                    entity_type=entity_type,
                )
                saved_paths.append(result["path"])

                logger.info(
                    f"Image processed: {result['original_size']} -> {result['optimized_size']} bytes "
                    f"({100 - (result['optimized_size'] / result['original_size'] * 100):.1f}% reduction)"
                )
            else:
                # 이미지가 아닌 파일은 그대로 저장 (추후 필요시 확장)
                logger.warning(f"Non-image file skipped: {file.filename}")

        except Exception as e:
            logger.error(f"File processing failed for {file.filename}: {e}")
            # 개별 파일 실패는 전체 요청 실패로 처리하지 않음

    return saved_paths


def validate_upload_request(
    files: list[UploadFile],
    max_files: int = MAX_FILES_PER_UPLOAD,
) -> None:
    """
    업로드 요청 사전 검증

    Args:
        files: UploadFile 리스트
        max_files: 최대 파일 수

    Raises:
        HTTPException: 검증 실패 시
    """
    valid_files = [f for f in files if f.filename]

    if len(valid_files) > max_files:
        raise HTTPException(
            status_code=400,
            detail=f"최대 {max_files}개의 파일만 업로드 가능합니다.",
        )
