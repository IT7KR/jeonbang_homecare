"""
Image optimization service
서버 측 이미지 최적화 서비스
"""

import os
import uuid
from io import BytesIO
from datetime import datetime
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# 최적화 설정
MAX_SIZE = 1920  # 최대 크기 (긴 쪽 기준)
JPEG_QUALITY = 80  # JPEG 품질
THUMBNAIL_SIZE = 300  # 썸네일 크기
WEBP_QUALITY = 80  # WebP 품질


def optimize_image(
    image_data: bytes,
    original_filename: str,
    max_size: int = MAX_SIZE,
    quality: int = JPEG_QUALITY,
) -> tuple[bytes, str]:
    """
    이미지 최적화 (리사이즈 + 압축)

    Args:
        image_data: 원본 이미지 바이트 데이터
        original_filename: 원본 파일명
        max_size: 최대 크기 (px)
        quality: JPEG 품질 (1-100)

    Returns:
        (최적화된 이미지 바이트, 새 파일명)
    """
    try:
        # 이미지 열기
        img = Image.open(BytesIO(image_data))

        # EXIF 회전 정보 적용
        img = _apply_exif_orientation(img)

        # RGB 변환 (PNG의 RGBA 등 처리)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # 리사이즈 (비율 유지)
        img = _resize_image(img, max_size)

        # 최적화된 이미지 저장
        output = BytesIO()

        # WebP 지원 확인 후 저장
        try:
            img.save(output, format="WEBP", quality=quality, method=4)
            new_ext = ".webp"
        except Exception:
            # WebP 실패 시 JPEG로 저장
            img.save(output, format="JPEG", quality=quality, optimize=True)
            new_ext = ".jpg"

        output.seek(0)

        # 새 파일명 생성
        base_name = os.path.splitext(original_filename)[0]
        new_filename = f"{uuid.uuid4().hex}{new_ext}"

        logger.info(
            f"Image optimized: {original_filename} -> {new_filename} "
            f"({len(image_data)} -> {output.getbuffer().nbytes} bytes)"
        )

        return output.read(), new_filename

    except Exception as e:
        logger.error(f"Image optimization failed: {e}")
        raise


def create_thumbnail(
    image_data: bytes,
    size: int = THUMBNAIL_SIZE,
) -> bytes:
    """
    썸네일 생성

    Args:
        image_data: 원본 이미지 바이트 데이터
        size: 썸네일 크기 (정사각형)

    Returns:
        썸네일 이미지 바이트
    """
    try:
        img = Image.open(BytesIO(image_data))

        # EXIF 회전 정보 적용
        img = _apply_exif_orientation(img)

        # RGB 변환
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # 정사각형 크롭 후 리사이즈
        img = _crop_center_square(img)
        img.thumbnail((size, size), Image.Resampling.LANCZOS)

        # 저장
        output = BytesIO()
        try:
            img.save(output, format="WEBP", quality=75, method=4)
        except Exception:
            img.save(output, format="JPEG", quality=75, optimize=True)

        output.seek(0)
        return output.read()

    except Exception as e:
        logger.error(f"Thumbnail creation failed: {e}")
        raise


def process_uploaded_image(
    image_data: bytes,
    original_filename: str,
    upload_dir: str,
    entity_type: str = "applications",
    generate_thumbnail: bool = True,
) -> dict:
    """
    업로드된 이미지 처리 (최적화 + 썸네일 생성 + 저장)

    Args:
        image_data: 원본 이미지 바이트 데이터
        original_filename: 원본 파일명
        upload_dir: 업로드 디렉토리 경로
        entity_type: 엔티티 유형 (applications, partners, assignments 등)
        generate_thumbnail: 썸네일 생성 여부 (기본: True)

    Returns:
        {
            "path": "/uploads/.../abc123.webp",
            "thumbnail_path": "/uploads/.../thumb_abc123.webp" | None,
            "original_size": 12345,
            "optimized_size": 1234
        }
    """
    # 월별 디렉토리 생성 (entity_type 포함)
    date_dir = datetime.now().strftime("%Y%m")
    full_dir = os.path.join(upload_dir, entity_type, date_dir)
    os.makedirs(full_dir, exist_ok=True)

    # 이미지 최적화
    optimized_data, new_filename = optimize_image(image_data, original_filename)

    # 파일 저장 경로
    file_path = os.path.join(full_dir, new_filename)

    # 최적화된 이미지 저장
    with open(file_path, "wb") as f:
        f.write(optimized_data)

    # 상대 경로 반환 (API 응답용)
    rel_path = f"/uploads/{entity_type}/{date_dir}/{new_filename}"

    result = {
        "path": rel_path,
        "thumbnail_path": None,
        "original_size": len(image_data),
        "optimized_size": len(optimized_data),
    }

    # 썸네일 생성 (옵션)
    if generate_thumbnail:
        try:
            thumbnail_data = create_thumbnail(image_data)

            # 썸네일 파일명 (thumb_ 접두사)
            thumb_filename = f"thumb_{new_filename}"
            thumb_path = os.path.join(full_dir, thumb_filename)

            with open(thumb_path, "wb") as f:
                f.write(thumbnail_data)

            result["thumbnail_path"] = f"/uploads/{entity_type}/{date_dir}/{thumb_filename}"

            logger.info(f"Thumbnail created: {thumb_filename} ({len(thumbnail_data)} bytes)")
        except Exception as e:
            logger.warning(f"Thumbnail creation skipped: {e}")

    return result


def _apply_exif_orientation(img: Image.Image) -> Image.Image:
    """EXIF 회전 정보 적용"""
    try:
        exif = img._getexif()
        if exif:
            orientation = exif.get(274)  # Orientation tag
            if orientation == 3:
                img = img.rotate(180, expand=True)
            elif orientation == 6:
                img = img.rotate(270, expand=True)
            elif orientation == 8:
                img = img.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        pass
    return img


def _resize_image(img: Image.Image, max_size: int) -> Image.Image:
    """비율 유지하며 리사이즈"""
    width, height = img.size

    if max(width, height) <= max_size:
        return img

    if width > height:
        new_width = max_size
        new_height = int(height * max_size / width)
    else:
        new_height = max_size
        new_width = int(width * max_size / height)

    return img.resize((new_width, new_height), Image.Resampling.LANCZOS)


def _crop_center_square(img: Image.Image) -> Image.Image:
    """중앙 기준 정사각형 크롭"""
    width, height = img.size
    size = min(width, height)

    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size

    return img.crop((left, top, right, bottom))
