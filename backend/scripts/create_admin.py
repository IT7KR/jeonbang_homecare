#!/usr/bin/env python3
"""
초기 슈퍼 관리자 생성 스크립트
Usage: python scripts/create_admin.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.admin import Admin


def create_super_admin(
    email: str = "admin@jeonbang.kr",
    password: str = "admin1234",
    name: str = "슈퍼관리자",
):
    """초기 슈퍼 관리자 생성"""
    db = SessionLocal()

    try:
        # 이미 존재하는지 확인
        existing = db.query(Admin).filter(Admin.email == email).first()
        if existing:
            print(f"Admin with email {email} already exists.")
            return

        # 슈퍼 관리자 생성
        admin = Admin(
            email=email,
            password_hash=hash_password(password),
            name=name,
            role="super_admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print(f"Super admin created successfully!")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  Name: {name}")
        print(f"\n⚠️  Please change the password after first login!")

    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create super admin")
    parser.add_argument("--email", default="admin@jeonbang.kr", help="Admin email")
    parser.add_argument("--password", default="admin1234", help="Admin password")
    parser.add_argument("--name", default="슈퍼관리자", help="Admin name")

    args = parser.parse_args()
    create_super_admin(args.email, args.password, args.name)
