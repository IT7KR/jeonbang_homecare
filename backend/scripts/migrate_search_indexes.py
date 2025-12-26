"""
기존 데이터에 대한 검색 인덱스 생성 스크립트

사용법:
    cd backend
    python -m scripts.migrate_search_indexes

기능:
    - 기존 Application 데이터의 검색 인덱스 생성
    - 기존 Partner 데이터의 검색 인덱스 생성
    - 진행 상황 표시
"""

import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.encryption import decrypt_value
from app.models import Application, Partner
from app.services.search_index import (
    update_application_search_index,
    update_partner_search_index,
    delete_search_index,
)


def migrate_applications(db, batch_size: int = 100):
    """신청 데이터 검색 인덱스 생성"""
    print("\n=== 신청(Application) 검색 인덱스 마이그레이션 ===")

    # 전체 개수 조회
    total = db.query(Application).count()
    print(f"총 {total}개의 신청 데이터 처리 예정")

    if total == 0:
        print("처리할 데이터가 없습니다.")
        return

    processed = 0
    errors = 0

    # 배치 처리
    offset = 0
    while offset < total:
        applications = db.query(Application).offset(offset).limit(batch_size).all()

        for app in applications:
            try:
                # 암호화된 값 복호화
                customer_name = decrypt_value(app.customer_name) if app.customer_name else None
                customer_phone = decrypt_value(app.customer_phone) if app.customer_phone else None

                if customer_name or customer_phone:
                    update_application_search_index(
                        db,
                        app.id,
                        customer_name or "",
                        customer_phone or ""
                    )
                    processed += 1
            except Exception as e:
                errors += 1
                print(f"  오류 (ID={app.id}): {e}")

        # 배치 커밋
        db.commit()
        offset += batch_size
        print(f"  진행: {min(offset, total)}/{total} ({processed} 성공, {errors} 오류)")

    print(f"완료: {processed}개 인덱스 생성, {errors}개 오류")


def migrate_partners(db, batch_size: int = 100):
    """협력사 데이터 검색 인덱스 생성"""
    print("\n=== 협력사(Partner) 검색 인덱스 마이그레이션 ===")

    # 전체 개수 조회
    total = db.query(Partner).count()
    print(f"총 {total}개의 협력사 데이터 처리 예정")

    if total == 0:
        print("처리할 데이터가 없습니다.")
        return

    processed = 0
    errors = 0

    # 배치 처리
    offset = 0
    while offset < total:
        partners = db.query(Partner).offset(offset).limit(batch_size).all()

        for partner in partners:
            try:
                # 암호화된 값 복호화
                representative_name = decrypt_value(partner.representative_name) if partner.representative_name else None
                contact_phone = decrypt_value(partner.contact_phone) if partner.contact_phone else None

                if representative_name or contact_phone:
                    update_partner_search_index(
                        db,
                        partner.id,
                        representative_name or "",
                        contact_phone or ""
                    )
                    processed += 1
            except Exception as e:
                errors += 1
                print(f"  오류 (ID={partner.id}): {e}")

        # 배치 커밋
        db.commit()
        offset += batch_size
        print(f"  진행: {min(offset, total)}/{total} ({processed} 성공, {errors} 오류)")

    print(f"완료: {processed}개 인덱스 생성, {errors}개 오류")


def clear_all_indexes(db):
    """모든 검색 인덱스 삭제"""
    print("\n=== 기존 검색 인덱스 삭제 ===")
    result = db.execute(text("DELETE FROM search_indexes"))
    db.commit()
    print(f"삭제된 인덱스: {result.rowcount}개")


def main():
    """메인 함수"""
    print("=" * 60)
    print("검색 인덱스 마이그레이션 스크립트")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 기존 인덱스 삭제 (선택적)
        clear_all_indexes(db)

        # 신청 데이터 마이그레이션
        migrate_applications(db)

        # 협력사 데이터 마이그레이션
        migrate_partners(db)

        print("\n" + "=" * 60)
        print("마이그레이션 완료!")
        print("=" * 60)

    except Exception as e:
        print(f"\n오류 발생: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
