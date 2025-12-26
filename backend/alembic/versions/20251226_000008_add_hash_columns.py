"""Add hash columns for duplicate detection

applications와 partners 테이블에 중복 감지용 해시 컬럼 추가
- applications.phone_hash: 고객 전화번호 해시 (중복 신청 감지)
- partners.phone_hash: 협력사 전화번호 해시
- partners.business_number_hash: 사업자등록번호 해시
- partners.phone_company_hash: 전화번호+회사명 복합 해시 (사업자번호 없는 경우)

Revision ID: 20251226_000008
Revises: 20251226_000007
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '20251226_000008'
down_revision = '20251226_000007'
branch_labels = None
depends_on = None


def upgrade():
    """해시 컬럼 추가 및 인덱스 생성"""

    # ==========================================================================
    # applications 테이블
    # ==========================================================================

    # phone_hash 컬럼 추가 (nullable=True로 시작, 마이그레이션 후 NOT NULL로 변경 가능)
    op.add_column(
        'applications',
        sa.Column('phone_hash', sa.String(64), nullable=True)
    )

    # phone_hash 인덱스 생성 (중복 체크용)
    op.create_index(
        'idx_applications_phone_hash',
        'applications',
        ['phone_hash']
    )

    # ==========================================================================
    # partners 테이블
    # ==========================================================================

    # phone_hash 컬럼 추가
    op.add_column(
        'partners',
        sa.Column('phone_hash', sa.String(64), nullable=True)
    )

    # business_number_hash 컬럼 추가 (사업자번호 해시)
    op.add_column(
        'partners',
        sa.Column('business_number_hash', sa.String(64), nullable=True)
    )

    # phone_company_hash 컬럼 추가 (전화번호+회사명 복합 해시)
    op.add_column(
        'partners',
        sa.Column('phone_company_hash', sa.String(64), nullable=True)
    )

    # partners 인덱스 생성
    op.create_index(
        'idx_partners_phone_hash',
        'partners',
        ['phone_hash']
    )

    # business_number_hash에 UNIQUE 인덱스 (NULL 제외)
    # PostgreSQL에서 NULL은 UNIQUE 제약에서 제외됨
    op.create_index(
        'idx_partners_business_number_hash',
        'partners',
        ['business_number_hash'],
        unique=True,
        postgresql_where=sa.text('business_number_hash IS NOT NULL')
    )

    # phone_company_hash 인덱스 (사업자번호 없는 경우 중복 체크용)
    op.create_index(
        'idx_partners_phone_company_hash',
        'partners',
        ['phone_company_hash']
    )


def downgrade():
    """해시 컬럼 및 인덱스 삭제"""

    # partners 인덱스 삭제
    op.drop_index('idx_partners_phone_company_hash', table_name='partners')
    op.drop_index('idx_partners_business_number_hash', table_name='partners')
    op.drop_index('idx_partners_phone_hash', table_name='partners')

    # partners 컬럼 삭제
    op.drop_column('partners', 'phone_company_hash')
    op.drop_column('partners', 'business_number_hash')
    op.drop_column('partners', 'phone_hash')

    # applications 인덱스 삭제
    op.drop_index('idx_applications_phone_hash', table_name='applications')

    # applications 컬럼 삭제
    op.drop_column('applications', 'phone_hash')
