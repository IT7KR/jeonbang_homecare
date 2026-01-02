"""
견적서 PDF 생성 서비스
pdfkit(wkhtmltopdf)를 사용하여 HTML 템플릿을 PDF로 변환

성능:
- wkhtmltopdf는 WebKit 렌더링 엔진 사용으로 빠른 PDF 생성 (~0.5초)
- 한글 폰트 지원 (Noto Sans CJK)
"""
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

import pdfkit
from jinja2 import Environment, FileSystemLoader

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc

from app.models.quote_item import QuoteItem
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.application import Application
from app.models.partner import Partner
from app.core.encryption import decrypt_value


# 템플릿 디렉토리 경로
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

# ============================================================
# 캐싱된 리소스 (모듈 로드 시 한 번만 초기화)
# ============================================================

# Jinja2 Environment 캐싱
_jinja_env: Optional[Environment] = None

# pdfkit 옵션 (wkhtmltopdf 설정)
PDFKIT_OPTIONS = {
    'page-size': 'A4',
    'margin-top': '20mm',
    'margin-right': '20mm',
    'margin-bottom': '20mm',
    'margin-left': '20mm',
    'encoding': 'UTF-8',
    'enable-local-file-access': None,  # 로컬 파일 접근 허용
    'no-outline': None,
    'quiet': '',  # wkhtmltopdf 출력 억제
}


def _get_jinja_env() -> Environment:
    """캐싱된 Jinja2 Environment 반환"""
    global _jinja_env
    if _jinja_env is None:
        _jinja_env = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            auto_reload=False,  # 프로덕션에서는 자동 리로드 비활성화
        )
    return _jinja_env


# ============================================================
# PDF 생성 함수
# ============================================================

async def get_quote_data(
    db: AsyncSession,
    assignment_id: int
) -> dict:
    """
    견적서 생성에 필요한 데이터 조회
    """
    # 배정 정보 조회
    result = await db.execute(
        select(ApplicationPartnerAssignment).where(
            ApplicationPartnerAssignment.id == assignment_id
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise ValueError(f"Assignment not found: {assignment_id}")

    # 신청 정보 조회
    result = await db.execute(
        select(Application).where(
            Application.id == assignment.application_id
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise ValueError(f"Application not found: {assignment.application_id}")

    # 협력사 정보 조회
    result = await db.execute(
        select(Partner).where(
            Partner.id == assignment.partner_id
        )
    )
    partner = result.scalar_one_or_none()

    # 견적 항목 조회
    result = await db.execute(
        select(QuoteItem).where(
            QuoteItem.assignment_id == assignment_id
        ).order_by(asc(QuoteItem.sort_order))
    )
    items = result.scalars().all()

    # 고객 정보 복호화
    customer_name = decrypt_value(application.customer_name) if application.customer_name else "고객"
    customer_address = decrypt_value(application.address) if application.address else ""

    # 합계 계산
    total_amount = sum(item.amount for item in items)

    # 견적번호 생성 (신청번호-배정ID)
    quote_number = f"{application.application_number}-Q{assignment.id}"

    # 데이터 구성
    data = {
        "quote_number": quote_number,
        "quote_date": datetime.now().strftime("%Y년 %m월 %d일"),
        "customer_name": customer_name,
        "application_number": application.application_number,
        "address": customer_address,
        "partner_name": partner.company_name if partner else "미배정",
        "scheduled_date": assignment.scheduled_date.strftime("%Y년 %m월 %d일") if assignment.scheduled_date else None,
        "items": [
            {
                "item_name": item.item_name,
                "description": item.description,
                "quantity": item.quantity,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "amount": item.amount,
            }
            for item in items
        ],
        "total_amount": total_amount,
        "estimate_note": assignment.estimate_note,
    }

    return data


def render_quote_html(data: dict) -> str:
    """
    Jinja2 템플릿을 사용하여 견적서 HTML 렌더링
    """
    env = _get_jinja_env()
    template = env.get_template("quote_template.html")
    return template.render(**data)


def generate_pdf_from_html(html_content: str) -> bytes:
    """
    HTML을 PDF로 변환 (pdfkit/wkhtmltopdf 사용)
    """
    # pdfkit.from_string은 바이트로 반환
    pdf_bytes = pdfkit.from_string(
        html_content,
        False,  # False를 전달하면 바이트로 반환
        options=PDFKIT_OPTIONS
    )

    return pdf_bytes


async def generate_quote_pdf(
    db: AsyncSession,
    assignment_id: int
) -> bytes:
    """
    배정 ID로 견적서 PDF 생성

    Args:
        db: 데이터베이스 세션
        assignment_id: 배정 ID

    Returns:
        PDF 바이트 데이터
    """
    # 데이터 조회
    data = await get_quote_data(db, assignment_id)

    # HTML 렌더링
    html_content = render_quote_html(data)

    # PDF 생성
    pdf_bytes = generate_pdf_from_html(html_content)

    return pdf_bytes


async def save_quote_pdf(
    db: AsyncSession,
    assignment_id: int,
    output_path: Optional[str] = None
) -> str:
    """
    견적서 PDF를 파일로 저장

    Args:
        db: 데이터베이스 세션
        assignment_id: 배정 ID
        output_path: 저장 경로 (None이면 임시 파일)

    Returns:
        저장된 파일 경로
    """
    pdf_bytes = await generate_quote_pdf(db, assignment_id)

    if output_path is None:
        # 임시 파일 생성
        fd, output_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)

    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    return output_path


def get_quote_filename(quote_number: str) -> str:
    """
    견적서 파일명 생성
    """
    # 파일명에 사용할 수 없는 문자 제거
    safe_number = quote_number.replace("/", "-").replace("\\", "-")
    return f"견적서_{safe_number}.pdf"


def warmup_pdf_engine():
    """
    PDF 엔진 워밍업 (서버 시작 시 호출하면 첫 요청 지연 방지)
    """
    _get_jinja_env()
