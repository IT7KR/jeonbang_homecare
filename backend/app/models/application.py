"""
Application model for service requests
서비스 신청 모델

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level
신청번호 형식: YYYYMMDD-XXX (예: 20251125-001)
상태: new → consulting → assigned → scheduled → completed / cancelled
"""

from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime, Date, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from datetime import date

from app.core.database import Base


class Application(Base):
    """서비스 신청 (Application)"""

    __tablename__ = "applications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 신청번호 (YYYYMMDD-XXX 형식)
    application_number = Column(String(12), unique=True, nullable=False, index=True)

    # 고객 정보 (암호화 저장)
    customer_name = Column(String(500), nullable=False)  # 암호화된 값
    customer_phone = Column(String(500), nullable=False)  # 암호화된 값

    # 주소 정보 (암호화 저장)
    address = Column(String(1000), nullable=False)  # 암호화된 값
    address_detail = Column(String(500), nullable=True)  # 암호화된 값

    # 서비스 정보
    selected_services = Column(JSONB, nullable=False, default=list)  # ["제초", "잔디관리"]
    description = Column(Text, nullable=False)  # 상세 요청 내용

    # 사진 첨부 (파일 경로 목록)
    photos = Column(JSONB, nullable=True, default=list)  # ["/uploads/app/xxx.jpg", ...]

    # 신청 상태
    # new: 신규신청
    # consulting: 상담중
    # assigned: 협력사 배정됨
    # scheduled: 일정 확정
    # completed: 완료
    # cancelled: 취소
    status = Column(String(20), nullable=False, default="new", index=True)

    # 배정 정보 (FK 없음)
    assigned_partner_id = Column(BigInteger, nullable=True, index=True)  # Partner.id
    assigned_admin_id = Column(BigInteger, nullable=True)  # Admin.id

    # 일정 정보
    scheduled_date = Column(Date, nullable=True)
    scheduled_time = Column(String(20), nullable=True)  # "오전" / "오후" / "14:00"

    # 견적 및 비용
    estimated_cost = Column(Integer, nullable=True)  # 견적 금액
    final_cost = Column(Integer, nullable=True)  # 최종 금액

    # 관리자 메모
    admin_memo = Column(Text, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Application {self.application_number}: {self.status}>"


def generate_application_number(db) -> str:
    """신청번호 생성: YYYYMMDD-XXX 형식"""
    from sqlalchemy import select, func as sql_func

    today = date.today()
    date_prefix = today.strftime("%Y%m%d")

    # 오늘 날짜로 시작하는 마지막 신청번호 조회
    stmt = (
        select(sql_func.max(Application.application_number))
        .where(Application.application_number.like(f"{date_prefix}-%"))
    )
    result = db.execute(stmt)
    last_number = result.scalar()

    if last_number:
        # 마지막 번호에서 순번 추출 후 증가
        last_seq = int(last_number.split("-")[1])
        new_seq = last_seq + 1
    else:
        new_seq = 1

    return f"{date_prefix}-{new_seq:03d}"
