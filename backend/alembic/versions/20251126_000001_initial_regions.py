"""Initial regions tables

Revision ID: 20251126_000001
Revises:
Create Date: 2025-11-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20251126_000001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 시/도 테이블
    op.create_table(
        "provinces",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(2), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("short_name", sa.String(20), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_provinces_code", "provinces", ["code"], unique=True)

    # 시/군/구 테이블
    op.create_table(
        "districts",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(5), nullable=False),
        sa.Column("province_code", sa.String(2), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_districts_code", "districts", ["code"], unique=True)
    op.create_index("ix_districts_province_code", "districts", ["province_code"])


def downgrade() -> None:
    op.drop_index("ix_districts_province_code", table_name="districts")
    op.drop_index("ix_districts_code", table_name="districts")
    op.drop_table("districts")
    op.drop_index("ix_provinces_code", table_name="provinces")
    op.drop_table("provinces")
