"""Update service structure v2 - Remove special/management, fix typos

Revision ID: 20251127_000001
Revises: 20251126_000004
Create Date: 2025-11-27

변경 사항:
- 기존 신청/협력사 데이터 삭제
- 특화 서비스, 관리 서비스 카테고리 삭제
- 서비스명 수정: 핵산→렉산, 페인트 내부→페인트 실내, 페인트 외부→페인트 실외
- 최종: 11개 카테고리, 32개 서비스
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251127_000001"
down_revision: Union[str, None] = "20251126_000006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 기존 신청 및 협력사 데이터 삭제
    op.execute("DELETE FROM applications")
    op.execute("DELETE FROM partners")
    op.execute("DELETE FROM sms_logs")

    # 2. 기존 서비스 데이터 삭제
    op.execute("DELETE FROM service_types")
    op.execute("DELETE FROM service_categories")

    # 3. 새로운 서비스 카테고리 삽입 (11개)
    op.execute("""
        INSERT INTO service_categories (code, name, icon, description, sort_order, is_active) VALUES
        ('construction', '건축', 'Building2', '전원주택 신축, 전문가와 함께하세요', 1, true),
        ('exterior', '외부 관리', 'Leaf', '풀·벌레·눈 치우느라 주말을 다 쓰시나요?', 2, true),
        ('landscaping', '조경 공사', 'Trees', '전문 조경으로 집의 인상을 한 번에 바꿉니다', 3, true),
        ('outdoor_facility', '외부 시설', 'Fence', '데크·펜스로 야외 공간을 완성하세요', 4, true),
        ('indoor_furniture', '실내 가구', 'Sofa', '맞춤 가구로 공간 활용을 극대화', 5, true),
        ('bathroom', '화장실', 'Bath', '깔끔한 화장실로 집의 가치를 높이세요', 6, true),
        ('finishing', '마감 공사', 'PaintBucket', '오래된 인테리어, 새롭게 리뉴얼', 7, true),
        ('plumbing', '설비', 'Droplets', '배관·누수 문제, 신속하게 해결', 8, true),
        ('electrical', '전기', 'Zap', '안전한 전기 공사, 전문가에게 맡기세요', 9, true),
        ('window_door', '창호', 'DoorOpen', '단열과 방음, 창호 교체로 해결', 10, true),
        ('others', '기타 작업', 'MoreHorizontal', '그 외 필요한 작업을 알려주세요', 11, true)
    """)

    # 4. 새로운 서비스 타입 삽입 (32개)
    op.execute("""
        INSERT INTO service_types (code, name, category_code, sort_order, is_active) VALUES
        -- 건축 (construction) - 1개
        ('HOUSE_CONSTRUCTION', '주택 건축', 'construction', 1, true),

        -- 외부 관리 (exterior) - 6개
        ('WEEDING', '제초 작업', 'exterior', 1, true),
        ('SNOW_REMOVAL', '제설 작업', 'exterior', 2, true),
        ('SPIDER_WEB', '거미줄 제거', 'exterior', 3, true),
        ('WASP_NEST', '벌집 제거', 'exterior', 4, true),
        ('PEST_CONTROL', '해충 방제', 'exterior', 5, true),
        ('YARD_CLEANING', '마당 청소', 'exterior', 6, true),

        -- 조경 공사 (landscaping) - 4개
        ('LANDSCAPING_MGMT', '조경 공사/관리', 'landscaping', 1, true),
        ('TREE_PRUNING', '수목 전지', 'landscaping', 2, true),
        ('GARDEN_WORK', '정원 공사', 'landscaping', 3, true),
        ('YARD_WORK', '마당 공사', 'landscaping', 4, true),

        -- 외부 시설 (outdoor_facility) - 3개
        ('DECK_WORK', '데크 공사', 'outdoor_facility', 1, true),
        ('FENCE_WALL', '펜스, 담장', 'outdoor_facility', 2, true),
        ('AWNING_PERGOLA', '어닝/렉산/파고라', 'outdoor_facility', 3, true),

        -- 실내 가구 (indoor_furniture) - 3개
        ('SINK', '씽크대', 'indoor_furniture', 1, true),
        ('BUILT_IN_CLOSET', '붙박이장', 'indoor_furniture', 2, true),
        ('SHOE_CABINET', '신발장', 'indoor_furniture', 3, true),

        -- 화장실 (bathroom) - 2개
        ('BATHROOM_PARTIAL', '일부 수리', 'bathroom', 1, true),
        ('BATHROOM_FULL', '전체 수리', 'bathroom', 2, true),

        -- 마감 공사 (finishing) - 8개
        ('PAINT_INTERIOR', '페인트 실내', 'finishing', 1, true),
        ('PAINT_EXTERIOR', '페인트 실외', 'finishing', 2, true),
        ('WALLPAPER', '도배', 'finishing', 3, true),
        ('TILE', '타일', 'finishing', 4, true),
        ('FLOOR_SHEET', '장판', 'finishing', 5, true),
        ('WOOD_FLOOR', '마루 바닥', 'finishing', 6, true),
        ('CURTAIN_BLIND', '커튼/블라인드', 'finishing', 7, true),
        ('FULL_INTERIOR', '전체 인테리어', 'finishing', 8, true),

        -- 설비 (plumbing) - 1개
        ('PLUMBING_LEAK', '배관/누수', 'plumbing', 1, true),

        -- 전기 (electrical) - 1개
        ('WIRING_LIGHTING', '배선/조명', 'electrical', 1, true),

        -- 창호 (window_door) - 2개
        ('SASH', '샷시', 'window_door', 1, true),
        ('SCREEN_DOOR', '방충망', 'window_door', 2, true),

        -- 기타 작업 (others) - 1개
        ('OTHERS', '기타 작업', 'others', 1, true)
    """)


def downgrade() -> None:
    # 이전 버전으로 롤백 (20251126_000004의 상태로)
    op.execute("DELETE FROM service_types")
    op.execute("DELETE FROM service_categories")

    # 이전 13개 카테고리 복원
    op.execute("""
        INSERT INTO service_categories (code, name, icon, sort_order, is_active) VALUES
        ('construction', '건축', 'Building2', 1, true),
        ('exterior', '외부 관리', 'Leaf', 2, true),
        ('landscaping', '조경 공사', 'Trees', 3, true),
        ('outdoor_facility', '외부 시설', 'Fence', 4, true),
        ('indoor_furniture', '실내 가구', 'Sofa', 5, true),
        ('bathroom', '화장실', 'Bath', 6, true),
        ('finishing', '마감 공사', 'PaintBucket', 7, true),
        ('plumbing', '설비', 'Droplets', 8, true),
        ('electrical', '전기', 'Zap', 9, true),
        ('window_door', '창호', 'DoorOpen', 10, true),
        ('others', '기타 작업', 'MoreHorizontal', 11, true),
        ('special', '특화 서비스', 'Sparkles', 12, true),
        ('management', '관리 서비스', 'CalendarCheck', 13, true)
    """)

    # 이전 38개 서비스 타입 복원
    op.execute("""
        INSERT INTO service_types (code, name, category_code, sort_order, is_active) VALUES
        ('HOUSE_CONSTRUCTION', '주택 건축', 'construction', 1, true),
        ('WEEDING', '제초 작업', 'exterior', 1, true),
        ('SNOW_REMOVAL', '제설 작업', 'exterior', 2, true),
        ('SPIDER_WEB', '거미줄 제거', 'exterior', 3, true),
        ('WASP_NEST', '벌집 제거', 'exterior', 4, true),
        ('PEST_CONTROL', '해충 방제', 'exterior', 5, true),
        ('YARD_CLEANING', '마당 청소', 'exterior', 6, true),
        ('LANDSCAPING_MGMT', '조경 공사/관리', 'landscaping', 1, true),
        ('TREE_PRUNING', '수목 전지', 'landscaping', 2, true),
        ('GARDEN_WORK', '정원 공사', 'landscaping', 3, true),
        ('YARD_WORK', '마당 공사', 'landscaping', 4, true),
        ('DECK_WORK', '데크 공사', 'outdoor_facility', 1, true),
        ('FENCE_WALL', '펜스, 담장', 'outdoor_facility', 2, true),
        ('AWNING_PERGOLA', '어닝/핵산/파고라', 'outdoor_facility', 3, true),
        ('SINK', '씽크대', 'indoor_furniture', 1, true),
        ('BUILT_IN_CLOSET', '붙박이장', 'indoor_furniture', 2, true),
        ('SHOE_CABINET', '신발장', 'indoor_furniture', 3, true),
        ('BATHROOM_PARTIAL', '일부 수리', 'bathroom', 1, true),
        ('BATHROOM_FULL', '전체 수리', 'bathroom', 2, true),
        ('PAINT_INTERIOR', '페인트 내부', 'finishing', 1, true),
        ('PAINT_EXTERIOR', '페인트 외부', 'finishing', 2, true),
        ('WALLPAPER', '도배', 'finishing', 3, true),
        ('TILE', '타일', 'finishing', 4, true),
        ('FLOOR_SHEET', '장판', 'finishing', 5, true),
        ('WOOD_FLOOR', '마루 바닥', 'finishing', 6, true),
        ('CURTAIN_BLIND', '커튼/블라인드', 'finishing', 7, true),
        ('FULL_INTERIOR', '전체 인테리어', 'finishing', 8, true),
        ('PLUMBING_LEAK', '배관/누수', 'plumbing', 1, true),
        ('WIRING_LIGHTING', '배선/조명', 'electrical', 1, true),
        ('SASH', '샷시', 'window_door', 1, true),
        ('SCREEN_DOOR', '방충망', 'window_door', 2, true),
        ('OTHERS', '기타 작업', 'others', 1, true),
        ('CLEANING_INTERIOR', '내부 청소', 'special', 1, true),
        ('CLEANING_EXTERIOR', '외부 청소', 'special', 2, true),
        ('FIREPLACE', '장작 난로/벽난', 'special', 3, true),
        ('CCTV', 'CCTV 설치', 'special', 4, true),
        ('EMPTY_HOUSE', '빈집 관리', 'management', 1, true),
        ('REGULAR_CARE', '정기 관리', 'management', 2, true),
        ('COMPLEX_CARE', '단지 관리', 'management', 3, true)
    """)
