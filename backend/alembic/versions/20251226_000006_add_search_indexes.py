"""Add search_indexes table for encrypted field search

암호화된 필드(고객명, 연락처 등)를 검색하기 위한 인덱스 테이블 생성

Revision ID: 20251226_000006
Revises: 20251226_000005
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '20251226_000006'
down_revision = '20251226_000005'
branch_labels = None
depends_on = None


def upgrade():
    """
    search_indexes 테이블 생성
    - entity_type: 'application' / 'partner'
    - entity_id: 원본 레코드 ID
    - field_type: 'name' / 'phone'
    - search_token: 정규화된 검색 토큰 (부분 검색용)
    - hash_value: SHA256 해시 (정확 매칭용)
    """
    op.create_table(
        'search_indexes',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.BigInteger(), nullable=False),
        sa.Column('field_type', sa.String(50), nullable=False),
        sa.Column('search_token', sa.String(500), nullable=False),
        sa.Column('hash_value', sa.String(128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # 인덱스 생성
    op.create_index('idx_search_entity', 'search_indexes', ['entity_type', 'entity_id'])
    op.create_index('idx_search_token', 'search_indexes', ['entity_type', 'field_type', 'search_token'])
    op.create_index('idx_search_hash', 'search_indexes', ['entity_type', 'field_type', 'hash_value'])


def downgrade():
    """search_indexes 테이블 삭제"""
    op.drop_index('idx_search_hash', table_name='search_indexes')
    op.drop_index('idx_search_token', table_name='search_indexes')
    op.drop_index('idx_search_entity', table_name='search_indexes')
    op.drop_table('search_indexes')
