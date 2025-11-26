"""
Admin Schemas
관리자 API 스키마
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ===== Request Schemas =====

class AdminLogin(BaseModel):
    """관리자 로그인 요청"""

    email: EmailStr
    password: str = Field(..., min_length=4)


class AdminCreate(BaseModel):
    """관리자 생성 요청"""

    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$")
    role: str = Field(default="admin", pattern=r"^(super_admin|admin)$")


class AdminUpdate(BaseModel):
    """관리자 수정 요청"""

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$")
    role: Optional[str] = Field(None, pattern=r"^(super_admin|admin)$")
    is_active: Optional[bool] = None


class AdminPasswordChange(BaseModel):
    """비밀번호 변경 요청"""

    current_password: str
    new_password: str = Field(..., min_length=8)


# ===== Response Schemas =====

class AdminResponse(BaseModel):
    """관리자 정보 응답"""

    id: int
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT 토큰 응답"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class LoginResponse(BaseModel):
    """로그인 응답"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: AdminResponse


class RefreshRequest(BaseModel):
    """토큰 갱신 요청"""

    refresh_token: str


class RefreshResponse(BaseModel):
    """토큰 갱신 응답"""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
