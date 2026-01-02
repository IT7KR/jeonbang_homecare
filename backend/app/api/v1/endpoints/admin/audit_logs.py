"""
Admin Audit Log API endpoints
관리자용 변경 이력 조회 API
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import Optional
import math

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse, AuditLogListResponse

router = APIRouter(prefix="/audit-logs", tags=["Admin - Audit Logs"])


@router.get("", response_model=AuditLogListResponse)
async def get_audit_logs(
    entity_type: Optional[str] = Query(None, description="엔티티 타입 필터 (application, partner)"),
    entity_id: Optional[int] = Query(None, description="엔티티 ID 필터"),
    action: Optional[str] = Query(None, description="액션 타입 필터"),
    admin_id: Optional[int] = Query(None, description="관리자 ID 필터"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    변경 이력 목록 조회
    """
    # 기본 쿼리
    stmt = select(AuditLog)

    # 필터 적용
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(AuditLog.entity_id == entity_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if admin_id:
        stmt = stmt.where(AuditLog.admin_id == admin_id)

    # 전체 개수 조회
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # 페이지네이션
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    stmt = stmt.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return AuditLogListResponse(
        items=[
            AuditLogResponse(
                id=log.id,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                action=log.action,
                old_value=log.old_value,
                new_value=log.new_value,
                summary=log.summary,
                admin_id=log.admin_id,
                admin_name=log.admin_name,
                created_at=log.created_at,
            )
            for log in logs
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/entity/{entity_type}/{entity_id}", response_model=AuditLogListResponse)
async def get_entity_audit_logs(
    entity_type: str,
    entity_id: int,
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(50, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    특정 엔티티의 변경 이력 조회
    """
    # 기본 쿼리
    stmt = select(AuditLog).where(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id,
    )

    # 전체 개수 조회
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # 페이지네이션
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    stmt = stmt.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return AuditLogListResponse(
        items=[
            AuditLogResponse(
                id=log.id,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                action=log.action,
                old_value=log.old_value,
                new_value=log.new_value,
                summary=log.summary,
                admin_id=log.admin_id,
                admin_name=log.admin_name,
                created_at=log.created_at,
            )
            for log in logs
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
