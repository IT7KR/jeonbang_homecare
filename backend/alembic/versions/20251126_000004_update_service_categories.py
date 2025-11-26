"""Update service categories and types based on new specification

Revision ID: 20251126_000004
Revises: 20251126_000003
Create Date: 2025-11-26

새로운 서비스 카테고리 체계:
- 13개 대분류 (건축, 외부관리, 조경공사, 외부시설, 실내가구, 화장실, 마감공사, 설비, 전기, 창호, 기타작업, 특화서비스, 관리서비스)
- 38개 소분류 서비스 타입
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251126_000004"
down_revision: Union[str, None] = "20251126_000003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 기존 데이터 삭제
    op.execute("DELETE FROM service_types")
    op.execute("DELETE FROM service_categories")

    # 새로운 서비스 카테고리 삽입 (13개)
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

    # 새로운 서비스 타입 삽입 (38개)
    op.execute("""
        INSERT INTO service_types (code, name, category_code, sort_order, is_active) VALUES
        -- 건축 (construction)
        ('HOUSE_CONSTRUCTION', '주택 건축', 'construction', 1, true),

        -- 외부 관리 (exterior)
        ('WEEDING', '제초 작업', 'exterior', 1, true),
        ('SNOW_REMOVAL', '제설 작업', 'exterior', 2, true),
        ('SPIDER_WEB', '거미줄 제거', 'exterior', 3, true),
        ('WASP_NEST', '벌집 제거', 'exterior', 4, true),
        ('PEST_CONTROL', '해충 방제', 'exterior', 5, true),
        ('YARD_CLEANING', '마당 청소', 'exterior', 6, true),

        -- 조경 공사 (landscaping)
        ('LANDSCAPING_MGMT', '조경 공사/관리', 'landscaping', 1, true),
        ('TREE_PRUNING', '수목 전지', 'landscaping', 2, true),
        ('GARDEN_WORK', '정원 공사', 'landscaping', 3, true),
        ('YARD_WORK', '마당 공사', 'landscaping', 4, true),

        -- 외부 시설 (outdoor_facility)
        ('DECK_WORK', '데크 공사', 'outdoor_facility', 1, true),
        ('FENCE_WALL', '펜스, 담장', 'outdoor_facility', 2, true),
        ('AWNING_PERGOLA', '어닝/핵산/파고라', 'outdoor_facility', 3, true),

        -- 실내 가구 (indoor_furniture)
        ('SINK', '씽크대', 'indoor_furniture', 1, true),
        ('BUILT_IN_CLOSET', '붙박이장', 'indoor_furniture', 2, true),
        ('SHOE_CABINET', '신발장', 'indoor_furniture', 3, true),

        -- 화장실 (bathroom)
        ('BATHROOM_PARTIAL', '일부 수리', 'bathroom', 1, true),
        ('BATHROOM_FULL', '전체 수리', 'bathroom', 2, true),

        -- 마감 공사 (finishing)
        ('PAINT_INTERIOR', '페인트 내부', 'finishing', 1, true),
        ('PAINT_EXTERIOR', '페인트 외부', 'finishing', 2, true),
        ('WALLPAPER', '도배', 'finishing', 3, true),
        ('TILE', '타일', 'finishing', 4, true),
        ('FLOOR_SHEET', '장판', 'finishing', 5, true),
        ('WOOD_FLOOR', '마루 바닥', 'finishing', 6, true),
        ('CURTAIN_BLIND', '커튼/블라인드', 'finishing', 7, true),
        ('FULL_INTERIOR', '전체 인테리어', 'finishing', 8, true),

        -- 설비 (plumbing)
        ('PLUMBING_LEAK', '배관/누수', 'plumbing', 1, true),

        -- 전기 (electrical)
        ('WIRING_LIGHTING', '배선/조명', 'electrical', 1, true),

        -- 창호 (window_door)
        ('SASH', '샷시', 'window_door', 1, true),
        ('SCREEN_DOOR', '방충망', 'window_door', 2, true),

        -- 기타 작업 (others)
        ('OTHERS', '기타 작업', 'others', 1, true),

        -- 특화 서비스 (special)
        ('CLEANING_INTERIOR', '내부 청소', 'special', 1, true),
        ('CLEANING_EXTERIOR', '외부 청소', 'special', 2, true),
        ('FIREPLACE', '장작 난로/벽난', 'special', 3, true),
        ('CCTV', 'CCTV 설치', 'special', 4, true),

        -- 관리 서비스 (management)
        ('EMPTY_HOUSE', '빈집 관리', 'management', 1, true),
        ('REGULAR_CARE', '정기 관리', 'management', 2, true),
        ('COMPLEX_CARE', '단지 관리', 'management', 3, true)
    """)


def downgrade() -> None:
    # 새 데이터 삭제
    op.execute("DELETE FROM service_types")
    op.execute("DELETE FROM service_categories")

    # 기존 데이터 복원 (6개 카테고리, 24개 서비스)
    op.execute("""
        INSERT INTO service_categories (code, name, icon, sort_order, is_active) VALUES
        ('exterior', '외부 관리', 'Leaf', 1, true),
        ('landscaping', '조경 공사', 'Trees', 2, true),
        ('outdoor_facility', '외부 시설', 'Fence', 3, true),
        ('interior', '실내 시공', 'Sofa', 4, true),
        ('facility', '설비 · 전기', 'Wrench', 5, true),
        ('special', '특화 서비스', 'Shield', 6, true)
    """)

    op.execute("""
        INSERT INTO service_types (code, name, category_code, sort_order, is_active) VALUES
        -- 외부 관리 (exterior)
        ('WEEDING', '제초', 'exterior', 1, true),
        ('SNOW_REMOVAL', '제설', 'exterior', 2, true),
        ('SPIDER_WEB', '거미줄 제거', 'exterior', 3, true),
        ('WASP_NEST', '벌집 제거', 'exterior', 4, true),
        ('PEST_CONTROL', '해충 방제', 'exterior', 5, true),
        ('YARD_CLEANING', '마당 청소', 'exterior', 6, true),

        -- 조경 공사 (landscaping)
        ('TREE_PRUNING', '수목 전지 및 제거', 'landscaping', 1, true),
        ('LANDSCAPING', '조경 공사 및 관리', 'landscaping', 2, true),
        ('GARDEN_WORK', '정원 공사', 'landscaping', 3, true),
        ('YARD_WORK', '마당 공사', 'landscaping', 4, true),

        -- 외부 시설 (outdoor_facility)
        ('DECK_WORK', '데크 공사', 'outdoor_facility', 1, true),
        ('FENCE_WALL', '펜스 및 담장', 'outdoor_facility', 2, true),
        ('AWNING', '어닝 설치', 'outdoor_facility', 3, true),

        -- 실내 시공 (interior)
        ('FURNITURE', '가구 제작 및 시공', 'interior', 1, true),
        ('BATHROOM', '화장실 공사', 'interior', 2, true),
        ('FINISHING', '마감 공사 (도배, 타일, 장판)', 'interior', 3, true),
        ('INTERIOR_DECOR', '인테리어 (커튼, 블라인드)', 'interior', 4, true),

        -- 설비 · 전기 (facility)
        ('PLUMBING', '배관/수전 공사', 'facility', 1, true),
        ('LEAK_REPAIR', '누수 수리', 'facility', 2, true),
        ('ELECTRICAL', '조명/배선 공사', 'facility', 3, true),
        ('WINDOW_DOOR', '창호 공사', 'facility', 4, true),

        -- 특화 서비스 (special)
        ('CLEANING', '청소 서비스', 'special', 1, true),
        ('CCTV_SECURITY', 'CCTV/보안 시스템', 'special', 2, true),
        ('EMPTY_HOUSE', '빈집 관리', 'special', 3, true),
        ('REGULAR_CARE', '정기 관리', 'special', 4, true)
    """)
