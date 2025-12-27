"""Add revoked_tokens table

만료된 토큰 블랙리스트 테이블 추가:
- 취소된 협력사 열람 토큰 관리
- 토큰 해시로 저장 (SHA256)
- 만료 처리자 및 사유 기록

Revision ID: 20251228_000001
Revises: 20251227_100002
Create Date: 2025-12-28
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251228_000001'
down_revision = '20251227_100002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('assignment_id', sa.BigInteger(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('revoked_by', sa.BigInteger(), nullable=True),
        sa.Column('reason', sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 인덱스 생성
    op.create_index('idx_revoked_tokens_hash', 'revoked_tokens', ['token_hash'])
    op.create_index('idx_revoked_tokens_assignment', 'revoked_tokens', ['assignment_id'])


def downgrade():
    op.drop_index('idx_revoked_tokens_assignment', table_name='revoked_tokens')
    op.drop_index('idx_revoked_tokens_hash', table_name='revoked_tokens')
    op.drop_table('revoked_tokens')
