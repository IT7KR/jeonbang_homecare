"""Add quote_items table

견적 항목 테이블 추가:
- 배정별 견적 항목 관리
- 항목명, 설명, 수량, 단위, 단가, 금액
- 정렬 순서 지원

Revision ID: 20251227_100002
Revises: 20251227_100001
Create Date: 2025-12-27
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251227_100002'
down_revision = '20251227_100001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'quote_items',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('assignment_id', sa.BigInteger(), nullable=False),
        sa.Column('item_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Numeric(10, 2), nullable=False, server_default='1'),
        sa.Column('unit', sa.String(20), nullable=True),
        sa.Column('unit_price', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # 인덱스 생성
    op.create_index('idx_quote_items_assignment', 'quote_items', ['assignment_id'])
    op.create_index('idx_quote_items_sort', 'quote_items', ['assignment_id', 'sort_order'])


def downgrade():
    op.drop_index('idx_quote_items_sort', table_name='quote_items')
    op.drop_index('idx_quote_items_assignment', table_name='quote_items')
    op.drop_table('quote_items')
