"""
기존 데이터에 대한 해시 컬럼 생성 스크립트

사용법:
    cd backend
    python -m scripts.migrate_hash_columns

기능:
    - 기존 Application 데이터의 phone_hash 생성
    - 기존 Partner 데이터의 phone_hash, business_number_hash, phone_company_hash 생성
    - 진행 상황 표시
    - 배치 처리로 대량 데이터 처리 지원
"""

import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.encryption import (
    decrypt_value,
    generate_search_hash,
    generate_composite_hash,
)
from app.models import Application, Partner


def migrate_applications(db, batch_size: int = 100):
    """신청 데이터 phone_hash 생성"""
    print("\n=== 신청(Application) phone_hash 마이그레이션 ===")

    # phone_hash가 없는 데이터만 조회
    total = db.query(Application).filter(Application.phone_hash.is_(None)).count()
    print(f"총 {total}개의 신청 데이터 처리 예정 (phone_hash가 NULL인 데이터)")

    if total == 0:
        print("처리할 데이터가 없습니다.")
        return

    processed = 0
    errors = 0
    skipped = 0

    # 배치 처리
    while True:
        # phone_hash가 NULL인 데이터를 배치 단위로 조회
        applications = (
            db.query(Application)
            .filter(Application.phone_hash.is_(None))
            .limit(batch_size)
            .all()
        )

        if not applications:
            break

        for app in applications:
            try:
                # 암호화된 전화번호 복호화
                customer_phone = decrypt_value(app.customer_phone) if app.customer_phone else None

                if customer_phone:
                    # 해시 생성
                    phone_hash = generate_search_hash(customer_phone, "phone")
                    app.phone_hash = phone_hash
                    processed += 1
                else:
                    skipped += 1
                    print(f"  건너뜀 (ID={app.id}): 전화번호 없음")

            except Exception as e:
                errors += 1
                print(f"  오류 (ID={app.id}): {e}")

        # 배치 커밋
        db.commit()
        current = processed + errors + skipped
        print(f"  진행: {current}/{total} ({processed} 성공, {skipped} 건너뜀, {errors} 오류)")

    print(f"완료: {processed}개 해시 생성, {skipped}개 건너뜀, {errors}개 오류")


def migrate_partners(db, batch_size: int = 100):
    """협력사 데이터 해시 컬럼 생성"""
    print("\n=== 협력사(Partner) 해시 컬럼 마이그레이션 ===")

    # 해시가 없는 데이터 조회 (하나라도 NULL이면 처리 대상)
    total = (
        db.query(Partner)
        .filter(
            (Partner.phone_hash.is_(None)) |
            (Partner.business_number_hash.is_(None)) |
            (Partner.phone_company_hash.is_(None))
        )
        .count()
    )
    print(f"총 {total}개의 협력사 데이터 처리 예정")

    if total == 0:
        print("처리할 데이터가 없습니다.")
        return

    processed = 0
    errors = 0
    skipped = 0
    bn_duplicates = 0

    # 중복 사업자번호 추적 (UNIQUE 제약 충돌 방지)
    seen_bn_hashes = set()

    # 기존 business_number_hash 조회
    existing_bn_hashes = db.execute(
        text("SELECT business_number_hash FROM partners WHERE business_number_hash IS NOT NULL")
    ).fetchall()
    for row in existing_bn_hashes:
        seen_bn_hashes.add(row[0])

    # 배치 처리
    while True:
        partners = (
            db.query(Partner)
            .filter(
                (Partner.phone_hash.is_(None)) |
                (Partner.phone_company_hash.is_(None))
            )
            .limit(batch_size)
            .all()
        )

        if not partners:
            break

        for partner in partners:
            try:
                # 암호화된 값 복호화
                contact_phone = decrypt_value(partner.contact_phone) if partner.contact_phone else None
                business_number = decrypt_value(partner.business_number) if partner.business_number else None
                company_name = partner.company_name  # 평문

                # 1. phone_hash 생성
                if contact_phone and partner.phone_hash is None:
                    partner.phone_hash = generate_search_hash(contact_phone, "phone")

                # 2. business_number_hash 생성 (있는 경우)
                if business_number and partner.business_number_hash is None:
                    bn_hash = generate_search_hash(business_number, "business_number")
                    if bn_hash in seen_bn_hashes:
                        # 중복 사업자번호 발견
                        bn_duplicates += 1
                        print(f"  경고 (ID={partner.id}): 중복 사업자번호 발견, business_number_hash 건너뜀")
                    else:
                        partner.business_number_hash = bn_hash
                        seen_bn_hashes.add(bn_hash)

                # 3. phone_company_hash 생성 (전화번호+회사명 복합)
                if contact_phone and company_name and partner.phone_company_hash is None:
                    partner.phone_company_hash = generate_composite_hash([
                        (contact_phone, "phone"),
                        (company_name, "company_name")
                    ])

                processed += 1

            except Exception as e:
                errors += 1
                print(f"  오류 (ID={partner.id}): {e}")

        # 배치 커밋
        db.commit()
        current = processed + errors + skipped
        print(f"  진행: {current}/{total} ({processed} 성공, {errors} 오류)")

    print(f"완료: {processed}개 해시 생성, {bn_duplicates}개 중복 사업자번호, {errors}개 오류")


def show_statistics(db):
    """마이그레이션 결과 통계"""
    print("\n=== 마이그레이션 결과 통계 ===")

    # Application 통계
    app_total = db.query(Application).count()
    app_with_hash = db.query(Application).filter(Application.phone_hash.isnot(None)).count()
    print(f"Application: {app_with_hash}/{app_total} ({app_with_hash/app_total*100:.1f}% if app_total else 0)개 해시 생성됨")

    # Partner 통계
    partner_total = db.query(Partner).count()
    partner_phone_hash = db.query(Partner).filter(Partner.phone_hash.isnot(None)).count()
    partner_bn_hash = db.query(Partner).filter(Partner.business_number_hash.isnot(None)).count()
    partner_pc_hash = db.query(Partner).filter(Partner.phone_company_hash.isnot(None)).count()

    print(f"Partner phone_hash: {partner_phone_hash}/{partner_total}")
    print(f"Partner business_number_hash: {partner_bn_hash}/{partner_total}")
    print(f"Partner phone_company_hash: {partner_pc_hash}/{partner_total}")


def main():
    """메인 함수"""
    print("=" * 60)
    print("해시 컬럼 마이그레이션 스크립트")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 신청 데이터 마이그레이션
        migrate_applications(db)

        # 협력사 데이터 마이그레이션
        migrate_partners(db)

        # 통계 출력
        show_statistics(db)

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
