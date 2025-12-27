"""
견적서 PDF 생성 서비스
WeasyPrint를 사용하여 HTML 템플릿을 PDF로 변환
"""
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.models.quote_item import QuoteItem
from app.models.application_assignment import ApplicationPartnerAssignment
from app.models.application import Application
from app.models.partner import Partner
from app.core.encryption import decrypt_field


# 템플릿 디렉토리 경로
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"


def get_quote_data(
    db: Session,
    assignment_id: int
) -> dict:
    """
    견적서 생성에 필요한 데이터 조회
    """
    # 배정 정보 조회
    assignment = db.query(ApplicationPartnerAssignment).filter(
        ApplicationPartnerAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise ValueError(f"Assignment not found: {assignment_id}")

    # 신청 정보 조회
    application = db.query(Application).filter(
        Application.id == assignment.application_id
    ).first()
    if not application:
        raise ValueError(f"Application not found: {assignment.application_id}")

    # 협력사 정보 조회
    partner = db.query(Partner).filter(
        Partner.id == assignment.partner_id
    ).first()

    # 견적 항목 조회
    items = db.query(QuoteItem).filter(
        QuoteItem.assignment_id == assignment_id
    ).order_by(asc(QuoteItem.sort_order)).all()

    # 고객 정보 복호화
    customer_name = decrypt_field(application.customer_name) if application.customer_name else "고객"
    customer_address = decrypt_field(application.customer_address) if application.customer_address else ""

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
                "quantity": float(item.quantity),
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
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template("quote_template.html")
    return template.render(**data)


def generate_pdf_from_html(html_content: str) -> bytes:
    """
    HTML을 PDF로 변환
    """
    font_config = FontConfiguration()

    # 한글 폰트 CSS 추가
    css = CSS(string='''
        @font-face {
            font-family: 'Noto Sans KR';
            src: local('Noto Sans KR'), local('NotoSansKR');
        }
        body {
            font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
        }
    ''', font_config=font_config)

    html = HTML(string=html_content)
    pdf_bytes = html.write_pdf(stylesheets=[css], font_config=font_config)

    return pdf_bytes


def generate_quote_pdf(
    db: Session,
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
    data = get_quote_data(db, assignment_id)

    # HTML 렌더링
    html_content = render_quote_html(data)

    # PDF 생성
    pdf_bytes = generate_pdf_from_html(html_content)

    return pdf_bytes


def save_quote_pdf(
    db: Session,
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
    pdf_bytes = generate_quote_pdf(db, assignment_id)

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
