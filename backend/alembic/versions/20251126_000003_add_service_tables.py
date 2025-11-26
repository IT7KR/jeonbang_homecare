"""Add service_categories and service_types tables

Revision ID: 20251126_000003
Revises: 20251126_000002
Create Date: 2025-11-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20251126_000003"
down_revision: Union[str, None] = "20251126_000002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create service_categories table
    op.create_table(
        "service_categories",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(30), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("icon", sa.String(30), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_categories_code", "service_categories", ["code"], unique=True)

    # Create service_types table
    op.create_table(
        "service_types",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(30), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("category_code", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_types_code", "service_types", ["code"], unique=True)
    op.create_index("ix_service_types_category_code", "service_types", ["category_code"])

    # Seed service categories
    op.execute("""
        INSERT INTO service_categories (code, name, icon, sort_order, is_active) VALUES
        ('exterior', '외부 관리', 'Leaf', 1, true),
        ('landscaping', '조경 공사', 'Trees', 2, true),
        ('outdoor_facility', '외부 시설', 'Fence', 3, true),
        ('interior', '실내 시공', 'Sofa', 4, true),
        ('facility', '설비 · 전기', 'Wrench', 5, true),
        ('special', '특화 서비스', 'Shield', 6, true)
    """)

    # Seed service types
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


def downgrade() -> None:
    op.drop_index("ix_service_types_category_code", table_name="service_types")
    op.drop_index("ix_service_types_code", table_name="service_types")
    op.drop_table("service_types")
    op.drop_index("ix_service_categories_code", table_name="service_categories")
    op.drop_table("service_categories")
