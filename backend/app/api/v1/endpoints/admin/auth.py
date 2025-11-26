"""
Admin Authentication API
관리자 인증 API
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_admin,
)
from app.models.admin import Admin
from app.schemas.admin import (
    AdminLogin,
    AdminResponse,
    LoginResponse,
    AdminPasswordChange,
    RefreshRequest,
    RefreshResponse,
)

router = APIRouter(prefix="/auth", tags=["Admin Auth"])


@router.post("/login", response_model=LoginResponse)
def login(
    data: AdminLogin,
    db: Session = Depends(get_db),
):
    """
    관리자 로그인

    - 이메일과 비밀번호로 인증
    - JWT 액세스 토큰 + 리프레시 토큰 발급
    - 액세스 토큰: 1시간, 리프레시 토큰: 14일
    """
    # 관리자 조회
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다",
        )

    # 비밀번호 검증
    if not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다",
        )

    # 비활성 계정 체크
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다. 관리자에게 문의하세요.",
        )

    # 마지막 로그인 시간 업데이트
    admin.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(admin)

    # JWT 토큰 생성
    access_token = create_access_token(
        subject=admin.id,
        additional_claims={
            "email": admin.email,
            "role": admin.role,
        },
    )

    refresh_token = create_refresh_token(subject=admin.id)

    expires_in = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        admin=AdminResponse.model_validate(admin),
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    토큰 갱신

    - 리프레시 토큰으로 새 액세스 토큰 발급
    - 리프레시 토큰은 재사용 (만료 시까지)
    """
    try:
        payload = verify_refresh_token(data.refresh_token)
        admin_id = payload.get("sub")

        if admin_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다",
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 만료되었거나 유효하지 않습니다",
        )

    # 관리자 조회 및 활성 상태 확인
    admin = db.query(Admin).filter(Admin.id == int(admin_id)).first()

    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="계정이 비활성화되었습니다",
        )

    # 새 액세스 토큰 발급
    access_token = create_access_token(
        subject=admin.id,
        additional_claims={
            "email": admin.email,
            "role": admin.role,
        },
    )

    expires_in = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return RefreshResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
    )


@router.get("/me", response_model=AdminResponse)
def get_me(
    admin: Admin = Depends(get_current_admin),
):
    """
    현재 로그인한 관리자 정보 조회
    """
    return AdminResponse.model_validate(admin)


@router.put("/password")
def change_password(
    data: AdminPasswordChange,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    비밀번호 변경
    """
    # 현재 비밀번호 검증
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다",
        )

    # 새 비밀번호 해싱 및 저장
    admin.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "비밀번호가 변경되었습니다"}
