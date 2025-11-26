"""
Admin Settings API endpoints
관리자용 설정 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin

router = APIRouter(prefix="/settings", tags=["Admin - Settings"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ProfileUpdate(BaseModel):
    """프로필 수정"""
    name: Optional[str] = None
    phone: Optional[str] = None


class ProfileResponse(BaseModel):
    """프로필 응답"""
    id: int
    email: str
    name: str
    phone: Optional[str]
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class PasswordChange(BaseModel):
    """비밀번호 변경"""
    current_password: str
    new_password: str


class AdminCreate(BaseModel):
    """관리자 생성"""
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None


class AdminUpdate(BaseModel):
    """관리자 수정"""
    name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class AdminListItem(BaseModel):
    """관리자 목록 아이템"""
    id: int
    email: str
    name: str
    phone: Optional[str]
    role: str
    is_active: bool
    last_login_at: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    current_admin: Admin = Depends(get_current_admin),
):
    """
    현재 관리자 프로필 조회
    """
    return ProfileResponse.model_validate(current_admin)


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    현재 관리자 프로필 수정
    """
    if data.name is not None:
        current_admin.name = data.name
    if data.phone is not None:
        current_admin.phone = data.phone

    db.commit()
    db.refresh(current_admin)

    return ProfileResponse.model_validate(current_admin)


@router.put("/password")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    비밀번호 변경
    """
    # 현재 비밀번호 확인
    if not pwd_context.verify(data.current_password, current_admin.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다")

    # 새 비밀번호 길이 검증
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다")

    # 새 비밀번호 해싱 및 저장
    current_admin.password_hash = pwd_context.hash(data.new_password)
    db.commit()

    return {"message": "비밀번호가 변경되었습니다"}


# ===== Super Admin Only =====


@router.get("/admins", response_model=list[AdminListItem])
def get_admins(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    관리자 목록 조회
    """
    admins = db.query(Admin).order_by(Admin.created_at.desc()).all()

    return [
        AdminListItem(
            id=admin.id,
            email=admin.email,
            name=admin.name,
            phone=admin.phone,
            role=admin.role,
            is_active=admin.is_active,
            last_login_at=admin.last_login_at.isoformat() if admin.last_login_at else None,
            created_at=admin.created_at.isoformat(),
        )
        for admin in admins
    ]


@router.post("/admins", response_model=AdminListItem)
def create_admin(
    data: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    관리자 생성
    """
    # 이메일 중복 확인
    existing = db.query(Admin).filter(Admin.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다")

    # 비밀번호 길이 검증
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다")

    # 관리자 생성
    admin = Admin(
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        name=data.name,
        phone=data.phone,
        role="super_admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return AdminListItem(
        id=admin.id,
        email=admin.email,
        name=admin.name,
        phone=admin.phone,
        role=admin.role,
        is_active=admin.is_active,
        last_login_at=admin.last_login_at.isoformat() if admin.last_login_at else None,
        created_at=admin.created_at.isoformat(),
    )


@router.put("/admins/{admin_id}", response_model=AdminListItem)
def update_admin(
    admin_id: int,
    data: AdminUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    관리자 수정
    """
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다")

    # 자기 자신 비활성화 방지
    if admin.id == current_admin.id and data.is_active is False:
        raise HTTPException(status_code=400, detail="자신의 계정은 비활성화할 수 없습니다")

    if data.name is not None:
        admin.name = data.name
    if data.phone is not None:
        admin.phone = data.phone
    if data.is_active is not None:
        admin.is_active = data.is_active

    db.commit()
    db.refresh(admin)

    return AdminListItem(
        id=admin.id,
        email=admin.email,
        name=admin.name,
        phone=admin.phone,
        role=admin.role,
        is_active=admin.is_active,
        last_login_at=admin.last_login_at.isoformat() if admin.last_login_at else None,
        created_at=admin.created_at.isoformat(),
    )


@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    관리자 삭제
    """
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다")

    # 자기 자신 삭제 방지
    if admin.id == current_admin.id:
        raise HTTPException(status_code=400, detail="자신의 계정은 삭제할 수 없습니다")

    db.delete(admin)
    db.commit()

    return {"message": "관리자가 삭제되었습니다"}
