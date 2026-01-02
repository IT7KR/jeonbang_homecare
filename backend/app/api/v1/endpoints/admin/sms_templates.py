"""
Admin SMS Template API endpoints
관리자용 SMS 템플릿 관리 API
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.sms_template import SMSTemplate
from app.schemas.sms_template import (
    SMSTemplateCreate,
    SMSTemplateUpdate,
    SMSTemplateResponse,
    SMSTemplateListResponse,
    SMSTemplatePreviewRequest,
    SMSTemplatePreviewResponse,
)

router = APIRouter(prefix="/sms-templates", tags=["Admin - SMS Templates"])


def template_to_response(template: SMSTemplate) -> SMSTemplateResponse:
    """템플릿 모델을 응답 스키마로 변환"""
    available_variables = None
    if template.available_variables:
        try:
            available_variables = json.loads(template.available_variables)
        except (json.JSONDecodeError, TypeError):
            available_variables = None

    return SMSTemplateResponse(
        id=template.id,
        template_key=template.template_key,
        title=template.title,
        description=template.description,
        content=template.content,
        available_variables=available_variables,
        is_active=template.is_active,
        is_system=template.is_system,
        created_at=template.created_at,
        updated_at=template.updated_at,
        updated_by=template.updated_by,
    )


@router.get("", response_model=SMSTemplateListResponse)
async def get_sms_templates(
    is_active: Optional[bool] = Query(None, description="활성화 상태 필터"),
    search: Optional[str] = Query(None, description="검색어 (제목, 키)"),
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 목록 조회
    """
    stmt = select(SMSTemplate)

    # 활성화 상태 필터
    if is_active is not None:
        stmt = stmt.where(SMSTemplate.is_active == is_active)

    # 검색
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            (SMSTemplate.title.ilike(search_term)) |
            (SMSTemplate.template_key.ilike(search_term))
        )

    # 정렬: 시스템 템플릿 먼저, 그 다음 제목순
    stmt = stmt.order_by(desc(SMSTemplate.is_system), SMSTemplate.title)

    result = await db.execute(stmt)
    templates = result.scalars().all()

    return SMSTemplateListResponse(
        items=[template_to_response(t) for t in templates],
        total=len(templates),
    )


@router.get("/{template_id}", response_model=SMSTemplateResponse)
async def get_sms_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 상세 조회
    """
    result = await db.execute(select(SMSTemplate).where(SMSTemplate.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    return template_to_response(template)


@router.get("/key/{template_key}", response_model=SMSTemplateResponse)
async def get_sms_template_by_key(
    template_key: str,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 키로 조회
    """
    result = await db.execute(
        select(SMSTemplate).where(SMSTemplate.template_key == template_key)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    return template_to_response(template)


@router.post("", response_model=SMSTemplateResponse)
async def create_sms_template(
    data: SMSTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 생성 (사용자 정의 템플릿)
    """
    # 키 중복 체크
    result = await db.execute(
        select(SMSTemplate).where(SMSTemplate.template_key == data.template_key)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 템플릿 키입니다")

    # 템플릿 생성
    template = SMSTemplate(
        template_key=data.template_key,
        title=data.title,
        description=data.description,
        content=data.content,
        available_variables=json.dumps(data.available_variables) if data.available_variables else None,
        is_active=data.is_active,
        is_system=False,  # 사용자 정의 템플릿은 항상 False
        updated_by=current_admin.id,
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)

    return template_to_response(template)


@router.put("/{template_id}", response_model=SMSTemplateResponse)
async def update_sms_template(
    template_id: int,
    data: SMSTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 수정

    시스템 템플릿은 content만 수정 가능합니다.
    """
    result = await db.execute(select(SMSTemplate).where(SMSTemplate.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    # 시스템 템플릿은 content만 수정 가능
    if template.is_system:
        if data.content is not None:
            template.content = data.content
        # 다른 필드는 무시
    else:
        # 사용자 정의 템플릿은 모두 수정 가능
        if data.title is not None:
            template.title = data.title
        if data.description is not None:
            template.description = data.description
        if data.content is not None:
            template.content = data.content
        if data.is_active is not None:
            template.is_active = data.is_active

    template.updated_by = current_admin.id

    await db.commit()
    await db.refresh(template)

    return template_to_response(template)


@router.delete("/{template_id}")
async def delete_sms_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 삭제

    시스템 템플릿은 삭제할 수 없습니다.
    """
    result = await db.execute(select(SMSTemplate).where(SMSTemplate.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    if template.is_system:
        raise HTTPException(status_code=400, detail="시스템 템플릿은 삭제할 수 없습니다")

    await db.delete(template)
    await db.commit()

    return {"message": "템플릿이 삭제되었습니다"}


@router.post("/preview", response_model=SMSTemplatePreviewResponse)
async def preview_sms_template(
    data: SMSTemplatePreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    SMS 템플릿 미리보기 (변수 치환)
    """
    result = await db.execute(
        select(SMSTemplate).where(SMSTemplate.template_key == data.template_key)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    # 변수 치환
    preview = template.format_message(**data.variables)

    # 바이트 길이 계산 (한글은 2바이트, 영문/숫자는 1바이트)
    byte_length = 0
    for char in preview:
        if ord(char) > 127:
            byte_length += 2
        else:
            byte_length += 1

    # SMS(90바이트 이하) or LMS
    message_type = "SMS" if byte_length <= 90 else "LMS"

    return SMSTemplatePreviewResponse(
        original=template.content,
        preview=preview,
        byte_length=byte_length,
        message_type=message_type,
    )
