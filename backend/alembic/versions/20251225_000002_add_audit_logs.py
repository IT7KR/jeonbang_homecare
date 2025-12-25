"""Add audit logs table

Revision ID: 20251225_000002
Revises: 20251225_000001
Create Date: 2025-12-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '20251225_000002'
down_revision: Union[str, None] = '20251225_000001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Audit Log 테이블 생성
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.BigInteger(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('old_value', JSONB, nullable=True),
        sa.Column('new_value', JSONB, nullable=True),
        sa.Column('summary', sa.String(255), nullable=True),
        sa.Column('admin_id', sa.BigInteger(), nullable=True),
        sa.Column('admin_name', sa.String(100), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # 인덱스 생성
    op.create_index('idx_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_logs_admin', 'audit_logs', ['admin_id'])
    op.create_index('idx_audit_logs_created', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_audit_logs_created', table_name='audit_logs')
    op.drop_index('idx_audit_logs_admin', table_name='audit_logs')
    op.drop_index('idx_audit_logs_action', table_name='audit_logs')
    op.drop_index('idx_audit_logs_entity', table_name='audit_logs')
    op.drop_table('audit_logs')
