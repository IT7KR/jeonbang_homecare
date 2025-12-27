"""
Application Partner Assignment model
신청-협력사 배정 관계 테이블 (1:N 매핑 지원)

PK: BIGSERIAL as per CLAUDE.md
No FK constraints - relationships managed at application level

이 테이블을 통해:
- 하나의 신청에 여러 협력사를 배정할 수 있음
- 각 배정별로 담당 서비스, 일정, 비용을 별도 관리
- 배정별 상태 추적 가능
"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime, Date, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class ApplicationPartnerAssignment(Base):
    """신청-협력사 배정 (Application Partner Assignment)"""

    __tablename__ = "application_partner_assignments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 관계 (FK 없음 - 애플리케이션 레벨에서 관리)
    application_id = Column(BigInteger, nullable=False, index=True)  # Application.id
    partner_id = Column(BigInteger, nullable=False, index=True)  # Partner.id

    # 이 배정에서 담당할 서비스 (신청의 selected_services 중 일부)
    assigned_services = Column(JSONB, nullable=False, default=list)  # ["제초", "정원관리"]

    # 배정별 상태
    # pending: 배정 대기 (협력사에 알림 전)
    # notified: 협력사에 알림 발송됨
    # accepted: 협력사가 수락함
    # scheduled: 일정 확정됨
    # in_progress: 작업 진행중
    # completed: 완료
    # cancelled: 취소됨
    status = Column(String(20), nullable=False, default="pending", index=True)

    # 일정 정보 (배정별로 별도 관리)
    scheduled_date = Column(Date, nullable=True)
    scheduled_time = Column(String(20), nullable=True)  # "오전" / "오후" / "14:00"

    # 비용 정보 (배정별로 별도 관리)
    estimated_cost = Column(Integer, nullable=True)  # 견적 금액
    final_cost = Column(Integer, nullable=True)  # 최종 금액
    estimate_note = Column(Text, nullable=True)  # 견적 메모 (견적에 대한 설명)

    # 배정자 정보
    assigned_by = Column(BigInteger, nullable=True)  # Admin.id
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    # 메모
    note = Column(Text, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # URL 토큰 관리 - 협력사 포털 (명시적 발급 필요)
    url_token = Column(String(500), nullable=True)  # 발급된 토큰
    url_expires_at = Column(DateTime(timezone=True), nullable=True)  # 토큰 만료 시간
    url_invalidated_before = Column(DateTime(timezone=True), nullable=True)  # 무효화 시점

    # 시공 사진 (관리자가 업로드)
    work_photos_before = Column(JSONB, nullable=True, default=list)  # 시공 전 사진 경로 배열
    work_photos_after = Column(JSONB, nullable=True, default=list)  # 시공 후 사진 경로 배열
    work_photos_uploaded_at = Column(DateTime(timezone=True), nullable=True)  # 최초 업로드 시각
    work_photos_updated_at = Column(DateTime(timezone=True), nullable=True)  # 마지막 수정 시각

    # 고객 열람 토큰 관리
    customer_token = Column(String(500), nullable=True)  # 고객 열람 토큰
    customer_token_expires_at = Column(DateTime(timezone=True), nullable=True)  # 토큰 만료 시간
    customer_token_invalidated_before = Column(DateTime(timezone=True), nullable=True)  # 무효화 시점

    def __repr__(self):
        return f"<ApplicationPartnerAssignment app={self.application_id} partner={self.partner_id} status={self.status}>"
