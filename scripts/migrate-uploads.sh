#!/bin/bash
#
# 파일 저장소 마이그레이션 스크립트
# /app/uploads → /data/uploads 로 파일 이동
#
# 사용법:
#   docker exec jeonbang-backend /app/scripts/migrate-uploads.sh
#
# 주의:
#   - 이 스크립트는 컨테이너 내부에서 실행됩니다
#   - 마이그레이션 전 백업을 권장합니다
#

set -e

OLD_UPLOAD_DIR="/app/uploads"
NEW_UPLOAD_DIR="/data/uploads"

echo "=================================================="
echo "파일 저장소 마이그레이션"
echo "원본: $OLD_UPLOAD_DIR"
echo "대상: $NEW_UPLOAD_DIR"
echo "=================================================="

# 대상 디렉토리 확인
if [ ! -d "$NEW_UPLOAD_DIR" ]; then
    echo "대상 디렉토리가 없습니다. 생성합니다..."
    mkdir -p "$NEW_UPLOAD_DIR"
fi

# 원본 디렉토리 확인
if [ ! -d "$OLD_UPLOAD_DIR" ]; then
    echo "원본 디렉토리가 존재하지 않습니다: $OLD_UPLOAD_DIR"
    echo "마이그레이션할 파일이 없습니다."
    exit 0
fi

# 파일 수 확인
FILE_COUNT=$(find "$OLD_UPLOAD_DIR" -type f 2>/dev/null | wc -l)
DIR_COUNT=$(find "$OLD_UPLOAD_DIR" -type d 2>/dev/null | wc -l)

echo ""
echo "마이그레이션 대상:"
echo "  - 디렉토리: $DIR_COUNT 개"
echo "  - 파일: $FILE_COUNT 개"
echo ""

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "마이그레이션할 파일이 없습니다."
    exit 0
fi

# 사용자 확인
read -p "마이그레이션을 진행하시겠습니까? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "취소되었습니다."
    exit 0
fi

echo ""
echo "마이그레이션 시작..."

# 디렉토리 구조 복사 (partners, applications 등)
for subdir in "$OLD_UPLOAD_DIR"/*; do
    if [ -d "$subdir" ]; then
        DIRNAME=$(basename "$subdir")
        echo "복사 중: $DIRNAME/"

        # rsync가 있으면 사용, 없으면 cp 사용
        if command -v rsync &> /dev/null; then
            rsync -av "$subdir/" "$NEW_UPLOAD_DIR/$DIRNAME/"
        else
            cp -rv "$subdir" "$NEW_UPLOAD_DIR/"
        fi
    fi
done

echo ""
echo "마이그레이션 완료!"
echo ""

# 결과 확인
NEW_FILE_COUNT=$(find "$NEW_UPLOAD_DIR" -type f 2>/dev/null | wc -l)
echo "새 디렉토리 파일 수: $NEW_FILE_COUNT 개"

echo ""
echo "=================================================="
echo "주의사항:"
echo "1. 새 경로에서 파일 접근이 정상인지 확인하세요"
echo "2. 정상 확인 후 원본 디렉토리를 삭제할 수 있습니다:"
echo "   rm -rf $OLD_UPLOAD_DIR/*"
echo "=================================================="
