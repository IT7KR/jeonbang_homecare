"""Encrypt admin phone column

암호화된 값을 저장하기 위해 phone 컬럼 크기를 확장하고
기존 데이터를 암호화합니다.

Revision ID: 20251226_000005
Revises: 20251226_000004
Create Date: 2025-12-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session

# revision identifiers
revision = '20251226_000005'
down_revision = '20251226_000004'
branch_labels = None
depends_on = None


def upgrade():
    """
    1. phone 컬럼 크기 확장 (VARCHAR(20) → VARCHAR(500))
    2. 기존 평문 데이터 암호화
    """
    # 1. 컬럼 크기 변경
    op.alter_column(
        'admins',
        'phone',
        existing_type=sa.String(20),
        type_=sa.String(500),
        existing_nullable=True
    )

    # 2. 기존 데이터 암호화
    # 암호화 모듈 import (마이그레이션 시점에 동적 로드)
    try:
        from app.core.encryption import encrypt_value

        bind = op.get_bind()
        session = Session(bind=bind)

        # 기존 평문 데이터 조회 및 암호화
        result = session.execute(
            sa.text("SELECT id, phone FROM admins WHERE phone IS NOT NULL AND phone != ''")
        )
        rows = result.fetchall()

        for row in rows:
            admin_id, phone = row
            # 이미 암호화된 값인지 확인 (Fernet 토큰은 gAAAAA로 시작)
            if phone and not phone.startswith('gAAAAA'):
                encrypted_phone = encrypt_value(phone)
                session.execute(
                    sa.text("UPDATE admins SET phone = :phone WHERE id = :id"),
                    {"phone": encrypted_phone, "id": admin_id}
                )

        session.commit()
    except ImportError:
        # 테스트 환경 등에서 encryption 모듈이 없을 수 있음
        pass


def downgrade():
    """
    1. 암호화된 데이터 복호화
    2. phone 컬럼 크기 원복
    """
    # 1. 기존 데이터 복호화
    try:
        from app.core.encryption import decrypt_value

        bind = op.get_bind()
        session = Session(bind=bind)

        result = session.execute(
            sa.text("SELECT id, phone FROM admins WHERE phone IS NOT NULL AND phone != ''")
        )
        rows = result.fetchall()

        for row in rows:
            admin_id, phone = row
            # 암호화된 값인지 확인
            if phone and phone.startswith('gAAAAA'):
                decrypted_phone = decrypt_value(phone)
                # 복호화된 값이 20자를 초과하면 잘라냄 (데이터 손실 주의)
                if decrypted_phone and len(decrypted_phone) > 20:
                    decrypted_phone = decrypted_phone[:20]
                session.execute(
                    sa.text("UPDATE admins SET phone = :phone WHERE id = :id"),
                    {"phone": decrypted_phone, "id": admin_id}
                )

        session.commit()
    except ImportError:
        pass

    # 2. 컬럼 크기 원복
    op.alter_column(
        'admins',
        'phone',
        existing_type=sa.String(500),
        type_=sa.String(20),
        existing_nullable=True
    )
