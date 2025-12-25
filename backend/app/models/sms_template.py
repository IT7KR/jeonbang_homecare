"""
SMS Template model
SMS 템플릿 모델

PK: BIGSERIAL as per CLAUDE.md
"""

from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class SMSTemplate(Base):
    """SMS 템플릿"""

    __tablename__ = "sms_templates"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 템플릿 키 (유니크)
    # 예: new_application, partner_assigned, schedule_confirmed 등
    template_key = Column(String(50), unique=True, nullable=False, index=True)

    # 템플릿 제목 (관리용)
    title = Column(String(100), nullable=False)

    # 템플릿 설명
    description = Column(String(255), nullable=True)

    # 템플릿 내용
    # 변수: {customer_name}, {application_number}, {partner_name}, {scheduled_date} 등
    content = Column(Text, nullable=False)

    # 사용 가능한 변수 목록 (JSON 형태로 저장)
    # 예: ["customer_name", "application_number"]
    available_variables = Column(Text, nullable=True)

    # 활성화 여부
    is_active = Column(Boolean, default=True, nullable=False)

    # 시스템 템플릿 여부 (시스템 템플릿은 삭제 불가)
    is_system = Column(Boolean, default=False, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 수정자 (FK 없음)
    updated_by = Column(BigInteger, nullable=True)

    def __repr__(self):
        return f"<SMSTemplate {self.template_key}: {self.title}>"

    def format_message(self, **kwargs) -> str:
        """
        템플릿 변수를 치환하여 메시지 생성

        Args:
            **kwargs: 변수명=값 형태의 인자들

        Returns:
            변수가 치환된 메시지
        """
        message = self.content
        for key, value in kwargs.items():
            message = message.replace(f"{{{key}}}", str(value) if value else "")
        return message
