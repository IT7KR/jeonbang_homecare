# 코딩 가이드라인

## 1. 일반 원칙

### 1.1 코드 품질 원칙
- **KISS** (Keep It Simple, Stupid): 단순하게 유지
- **DRY** (Don't Repeat Yourself): 중복 제거
- **YAGNI** (You Aren't Gonna Need It): 필요한 것만 구현
- **단일 책임 원칙**: 함수/클래스는 하나의 역할만 수행

### 1.2 명명 규칙
| 항목 | Frontend (TypeScript) | Backend (Python) |
|------|----------------------|------------------|
| 변수/함수 | camelCase | snake_case |
| 상수 | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE |
| 클래스/컴포넌트 | PascalCase | PascalCase |
| 파일명 | kebab-case 또는 PascalCase | snake_case |
| 타입/인터페이스 | PascalCase | PascalCase |

### 1.3 데이터베이스 규칙

#### DBMS
- **PostgreSQL** 사용 (확정)

#### PK/FK 규칙
| 규칙 | 설명 |
|------|------|
| **PK 타입** | `BIGSERIAL` 사용 (자동 증가 BIGINT) |
| **FK 제약조건** | **사용하지 않음** - 애플리케이션 레벨에서 관계 관리 |
| **관계 컬럼 명명** | `_id` 접미사 사용 (예: `partner_id`, `admin_id`) |

#### 테이블 설계 규칙
```sql
-- ✅ Good - FK 제약조건 없음
CREATE TABLE application (
    id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT,  -- FK 없이 관계 컬럼만 정의
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ❌ Bad - FK 제약조건 사용
CREATE TABLE application (
    id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES partner(id),  -- FK 사용 금지
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 애플리케이션 레벨 관계 관리
FK 제약조건을 사용하지 않으므로, 반드시 애플리케이션 코드에서 관계 무결성을 관리해야 합니다:

```python
# services/application_service.py
class ApplicationService:
    def assign_partner(self, application_id: int, partner_id: int):
        # 파트너 존재 여부 확인 (애플리케이션 레벨 검증)
        partner = self.db.query(Partner).filter(Partner.id == partner_id).first()
        if not partner:
            raise ValueError("파트너를 찾을 수 없습니다")

        application = self.db.query(Application).filter(Application.id == application_id).first()
        application.partner_id = partner_id
        self.db.commit()
```

---

## 2. Frontend (TypeScript/React) 가이드라인

### 2.1 파일 구조
```
src/
├── app/                    # App Router 페이지
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트 (수정 X)
│   ├── common/             # 공통 컴포넌트
│   ├── forms/              # 폼 컴포넌트
│   ├── layouts/            # 레이아웃
│   └── features/           # 기능별 컴포넌트
├── hooks/                  # 커스텀 훅
├── lib/
│   ├── api/                # API 클라이언트
│   ├── utils/              # 유틸리티 함수
│   ├── validations/        # Zod 스키마
│   └── constants/          # 상수
└── types/                  # 타입 정의
```

### 2.2 컴포넌트 작성

#### 함수 컴포넌트 사용
```tsx
// ✅ Good
export function ApplicationCard({ application }: ApplicationCardProps) {
  return <div>...</div>;
}

// ❌ Bad - 화살표 함수 export
export const ApplicationCard = ({ application }: ApplicationCardProps) => {
  return <div>...</div>;
};
```

#### Props 타입 정의
```tsx
// ✅ Good - interface 사용
interface ApplicationCardProps {
  application: Application;
  onSelect?: (id: number) => void;
  className?: string;
}

// ❌ Bad - 인라인 타입
function ApplicationCard({ application }: { application: Application }) {
```

#### 컴포넌트 구조
```tsx
// 1. imports
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { Application } from '@/types/application';

// 2. 타입 정의
interface ApplicationCardProps {
  application: Application;
  className?: string;
}

// 3. 컴포넌트
export function ApplicationCard({ application, className }: ApplicationCardProps) {
  // 3.1 상태
  const [isOpen, setIsOpen] = useState(false);

  // 3.2 훅 사용
  const { data, isLoading } = useApplications();

  // 3.3 이벤트 핸들러
  const handleClick = () => {
    setIsOpen(true);
  };

  // 3.4 조건부 렌더링
  if (isLoading) return <Skeleton />;

  // 3.5 JSX 반환
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      {/* ... */}
    </div>
  );
}
```

### 2.3 스타일링 (Tailwind CSS)

#### cn 유틸리티 사용
```tsx
// ✅ Good
import { cn } from '@/lib/utils/cn';

<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-primary text-white',
  className
)}>

// ❌ Bad - 문자열 연결
<div className={`flex items-center gap-2 ${isActive ? 'bg-primary' : ''}`}>
```

#### 반응형 디자인
```tsx
// Mobile First 접근
<div className="
  grid grid-cols-1      /* 기본: 1열 */
  md:grid-cols-2        /* 태블릿: 2열 */
  lg:grid-cols-3        /* 데스크톱: 3열 */
  gap-4
">
```

### 2.4 상태 관리

#### 서버 상태 (TanStack Query)
```tsx
// hooks/useApplications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/lib/api/applications';

export function useApplications(params?: ApplicationListParams) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationApi.getList(params),
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

#### 클라이언트 상태 (Zustand)
```tsx
// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### 2.5 폼 처리 (React Hook Form + Zod)

```tsx
// lib/validations/application.ts
import { z } from 'zod';

export const applicationSchema = z.object({
  customer: z.object({
    name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
    phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
    address: z.string().min(1, '주소를 입력해주세요'),
  }),
  services: z.array(z.string()).min(1, '서비스를 선택해주세요'),
  preferredDate: z.date(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

// components/features/application/ApplicationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function ApplicationForm() {
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      customer: { name: '', phone: '', address: '' },
      services: [],
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    // 제출 처리
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 폼 필드 */}
      </form>
    </Form>
  );
}
```

### 2.6 API 클라이언트

```tsx
// lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// 인터셉터 설정
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
      localStorage.removeItem('accessToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// lib/api/applications.ts
import { apiClient } from './client';
import type { Application, ApplicationListParams } from '@/types/application';

export const applicationApi = {
  getList: async (params?: ApplicationListParams) => {
    const { data } = await apiClient.get('/admin/applications', { params });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get(`/admin/applications/${id}`);
    return data;
  },

  updateStatus: async ({ id, status }: { id: number; status: string }) => {
    const { data } = await apiClient.patch(`/admin/applications/${id}/status`, { status });
    return data;
  },
};
```

### 2.7 타입 정의

```tsx
// types/application.ts
export interface Application {
  id: number;
  applicationNo: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    addressDetail?: string;
  };
  services: ServiceSelection[];
  schedule: {
    preferredDate: string;
    preferredTime?: 'morning' | 'afternoon' | 'anytime';
    alternativeDate?: string;
  };
  status: ApplicationStatus;
  partner?: Partner;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'new'
  | 'consulting'
  | 'assigned'
  | 'scheduled'
  | 'completed'
  | 'cancelled';

// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 3. Backend (Python/FastAPI) 가이드라인

### 3.1 파일 구조
```
app/
├── api/
│   ├── v1/
│   │   ├── endpoints/      # 엔드포인트
│   │   └── router.py       # 라우터 통합
│   └── deps.py             # 의존성
├── core/
│   ├── config.py           # 설정
│   ├── security.py         # 보안
│   └── database.py         # DB 연결
├── models/                 # SQLAlchemy 모델
├── schemas/                # Pydantic 스키마
├── services/               # 비즈니스 로직
├── utils/                  # 유틸리티
└── main.py
```

### 3.2 Pydantic 스키마

```python
# schemas/application.py
from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional, List
from enum import Enum

class PreferredTime(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    ANYTIME = "anytime"

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    phone: str = Field(..., pattern=r'^010-\d{4}-\d{4}$')
    address: str = Field(..., min_length=1)
    address_detail: Optional[str] = None

class ApplicationCreate(BaseModel):
    customer: CustomerCreate
    services: List[dict] = Field(..., min_items=1)
    preferred_date: date
    preferred_time: Optional[PreferredTime] = None
    alternative_date: Optional[date] = None
    request_details: Optional[str] = Field(None, max_length=1000)
    attachments: Optional[List[str]] = None
    terms_agreed: bool
    privacy_agreed: bool
    marketing_agreed: bool = False

    @validator('preferred_date')
    def validate_preferred_date(cls, v):
        if v < date.today():
            raise ValueError('희망일자는 오늘 이후여야 합니다')
        return v

class ApplicationResponse(BaseModel):
    id: int
    application_no: str
    customer_name: str
    customer_phone: str  # 마스킹된 값
    services: List[str]
    preferred_date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
```

### 3.3 SQLAlchemy 모델

```python
# models/application.py
from sqlalchemy import Column, BigInteger, String, Date, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.utils.encryption import encrypt_field, decrypt_field

class Application(Base):
    __tablename__ = "application"

    id = Column(BigInteger, primary_key=True, index=True)
    application_no = Column(String(20), unique=True, nullable=False)

    # 암호화 필드
    _customer_name = Column("customer_name", String(255), nullable=False)
    _customer_phone = Column("customer_phone", String(255), nullable=False)
    _customer_address = Column("customer_address", String(500), nullable=False)
    _customer_address_detail = Column("customer_address_detail", String(255))

    services = Column(JSON, nullable=False)
    preferred_date = Column(Date, nullable=False)
    preferred_time = Column(String(20))
    alternative_date = Column(Date)
    request_details = Column(Text)
    attachments = Column(JSON)
    status = Column(String(20), default="new")
    partner_id = Column(BigInteger, ForeignKey("partner.id"))
    assigned_at = Column(DateTime)
    terms_agreed = Column(Boolean, nullable=False)
    privacy_agreed = Column(Boolean, nullable=False)
    marketing_agreed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # 관계
    partner = relationship("Partner", back_populates="applications")
    notes = relationship("ApplicationNote", back_populates="application")
    status_logs = relationship("ApplicationStatusLog", back_populates="application")

    # 암호화된 필드 프로퍼티
    @property
    def customer_name(self):
        return decrypt_field(self._customer_name)

    @customer_name.setter
    def customer_name(self, value):
        self._customer_name = encrypt_field(value)
```

### 3.4 API 엔드포인트

```python
# api/v1/endpoints/applications.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db, get_current_admin
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationListResponse,
)
from app.services.application_service import ApplicationService
from app.models.admin import Admin

router = APIRouter()

@router.post("", response_model=dict, status_code=201)
async def create_application(
    application_in: ApplicationCreate,
    db: Session = Depends(get_db),
):
    """서비스 신청 (공개 API)"""
    service = ApplicationService(db)
    result = service.create(application_in)
    return {
        "success": True,
        "data": {
            "applicationNo": result.application_no,
            "message": "서비스 신청이 완료되었습니다.",
        },
    }

@router.get("/admin/applications", response_model=ApplicationListResponse)
async def get_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    service: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """신청 목록 조회 (관리자 전용)"""
    service = ApplicationService(db)
    result = service.get_list(
        page=page,
        limit=limit,
        status=status,
        service=service,
        start_date=start_date,
        end_date=end_date,
        search=search,
    )
    return {"success": True, "data": result}

@router.patch("/admin/applications/{id}/status")
async def update_application_status(
    id: int,
    status_in: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """신청 상태 변경"""
    service = ApplicationService(db)
    service.update_status(id, status_in.status, current_admin.id)
    return {"success": True, "message": "상태가 변경되었습니다."}
```

### 3.5 서비스 레이어

```python
# services/application_service.py
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List

from app.models.application import Application, ApplicationStatusLog
from app.schemas.application import ApplicationCreate
from app.utils.generators import generate_application_no

class ApplicationService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: ApplicationCreate) -> Application:
        """신청 생성"""
        application = Application(
            application_no=generate_application_no(self.db),
            customer_name=data.customer.name,
            customer_phone=data.customer.phone,
            customer_address=data.customer.address,
            customer_address_detail=data.customer.address_detail,
            services=data.services,
            preferred_date=data.preferred_date,
            preferred_time=data.preferred_time,
            alternative_date=data.alternative_date,
            request_details=data.request_details,
            attachments=data.attachments,
            terms_agreed=data.terms_agreed,
            privacy_agreed=data.privacy_agreed,
            marketing_agreed=data.marketing_agreed,
        )

        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)

        # 상태 로그 기록
        self._log_status_change(application.id, None, "new", None)

        return application

    def update_status(self, id: int, new_status: str, admin_id: int) -> Application:
        """상태 변경"""
        application = self.db.query(Application).filter(Application.id == id).first()
        if not application:
            raise ValueError("신청을 찾을 수 없습니다")

        old_status = application.status
        application.status = new_status

        self._log_status_change(id, old_status, new_status, admin_id)

        self.db.commit()
        return application

    def _log_status_change(
        self,
        application_id: int,
        from_status: Optional[str],
        to_status: str,
        admin_id: Optional[int],
    ):
        log = ApplicationStatusLog(
            application_id=application_id,
            from_status=from_status,
            to_status=to_status,
            admin_id=admin_id,
        )
        self.db.add(log)
```

### 3.6 의존성 주입

```python
# api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.admin import Admin

security = HTTPBearer()

def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Admin:
    """현재 인증된 관리자"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        admin_id: int = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if admin is None or not admin.is_active:
        raise credentials_exception

    return admin
```

### 3.7 에러 처리

```python
# utils/exceptions.py
from fastapi import HTTPException

class ApplicationException(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message},
        )

class NotFoundError(ApplicationException):
    def __init__(self, resource: str):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource}을(를) 찾을 수 없습니다",
            status_code=404,
        )

class ValidationError(ApplicationException):
    def __init__(self, message: str):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
        )
```

---

## 4. Git 커밋 규칙

### 4.1 커밋 메시지 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.2 Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 X)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

### 4.3 예시
```
feat(application): 서비스 신청 폼 Step 2 구현

- 서비스 유형 선택 체크박스 추가
- 세부 옵션 동적 표시 기능
- Zod 유효성 검사 스키마 추가

Closes #15
```

---

## 5. 테스트 가이드라인

### 5.1 Frontend 테스트
```tsx
// __tests__/components/ApplicationCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ApplicationCard } from '@/components/features/application/ApplicationCard';

describe('ApplicationCard', () => {
  const mockApplication = {
    id: 1,
    applicationNo: '20251125-001',
    customerName: '홍길동',
    services: ['제초'],
    status: 'new',
  };

  it('renders application info correctly', () => {
    render(<ApplicationCard application={mockApplication} />);

    expect(screen.getByText('20251125-001')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });
});
```

### 5.2 Backend 테스트
```python
# tests/test_applications.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_application():
    response = client.post(
        "/api/v1/applications",
        json={
            "customer": {
                "name": "홍길동",
                "phone": "010-1234-5678",
                "address": "경기도 양평군",
            },
            "services": [{"code": "weeding"}],
            "preferredDate": "2025-12-01",
            "termsAgreed": True,
            "privacyAgreed": True,
        },
    )

    assert response.status_code == 201
    assert response.json()["success"] is True
    assert "applicationNo" in response.json()["data"]
```
