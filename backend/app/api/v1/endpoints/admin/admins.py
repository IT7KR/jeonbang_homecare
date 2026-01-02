"""
Admin Management API
관리자 관리 API (슈퍼 관리자 전용)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional

from app.core.database import get_db
from app.core.security import hash_password, get_current_super_admin
from app.models.admin import Admin
from app.schemas.admin import (
    AdminCreate,
    AdminUpdate,
    AdminResponse,
)

router = APIRouter(prefix="/admins", tags=["Admin Management"])


@router.get("", response_model=list[AdminResponse])
async def list_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = None,
    admin: Admin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    관리자 목록 조회 (슈퍼 관리자 전용)
    """
    stmt = select(Admin)

    if is_active is not None:
        stmt = stmt.where(Admin.is_active == is_active)

    stmt = stmt.order_by(desc(Admin.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    admins = result.scalars().all()

    return [AdminResponse.model_validate(a) for a in admins]


@router.post("", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    data: AdminCreate,
    admin: Admin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    관리자 생성 (슈퍼 관리자 전용)
    """
    # 이메일 중복 체크
    result = await db.execute(select(Admin).where(Admin.email == data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다",
        )

    # 관리자 생성
    new_admin = Admin(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        phone=data.phone,
        role=data.role,
        is_active=True,
    )

    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    return AdminResponse.model_validate(new_admin)


@router.get("/{admin_id}", response_model=AdminResponse)
async def get_admin(
    admin_id: int,
    admin: Admin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    관리자 상세 조회 (슈퍼 관리자 전용)
    """
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    target_admin = result.scalar_one_or_none()

    if not target_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="관리자를 찾을 수 없습니다",
        )

    return AdminResponse.model_validate(target_admin)


@router.patch("/{admin_id}", response_model=AdminResponse)
async def update_admin(
    admin_id: int,
    data: AdminUpdate,
    admin: Admin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    관리자 정보 수정 (슈퍼 관리자 전용)
    """
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    target_admin = result.scalar_one_or_none()

    if not target_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="관리자를 찾을 수 없습니다",
        )

    # 자기 자신의 role/is_active 변경 방지
    if target_admin.id == admin.id:
        if data.role is not None and data.role != admin.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="자신의 역할은 변경할 수 없습니다",
            )
        if data.is_active is not None and data.is_active != admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="자신의 계정을 비활성화할 수 없습니다",
            )

    # 업데이트
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(target_admin, field, value)

    await db.commit()
    await db.refresh(target_admin)

    return AdminResponse.model_validate(target_admin)


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(
    admin_id: int,
    admin: Admin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    관리자 삭제 (슈퍼 관리자 전용)

    실제 삭제 대신 is_active=False로 비활성화
    """
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    target_admin = result.scalar_one_or_none()

    if not target_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="관리자를 찾을 수 없습니다",
        )

    # 자기 자신 삭제 방지
    if target_admin.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자신의 계정은 삭제할 수 없습니다",
        )

    # 소프트 삭제
    target_admin.is_active = False
    await db.commit()

    return None
