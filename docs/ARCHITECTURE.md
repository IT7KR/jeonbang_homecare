# 시스템 아키텍처 문서

> 최종 검토: 2025-12-27

## 1. 시스템 개요

전방 홈케어 서비스 플랫폼은 고객용 Front Office와 관리자용 Back Office로 구성된 웹 애플리케이션입니다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Client                                  │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │   고객/파트너     │         │     관리자        │                  │
│  │   (브라우저)      │         │   (브라우저)      │                  │
│  └────────┬─────────┘         └────────┬─────────┘                  │
└───────────┼─────────────────────────────┼────────────────────────────┘
            │          HTTPS              │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Lightsail                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      Application Server                        │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐           │  │
│  │  │      Frontend       │    │      Backend        │           │  │
│  │  │     (Next.js)       │    │     (FastAPI)       │           │  │
│  │  │   - SSR/SSG         │───▶│   - REST API        │           │  │
│  │  │   - Static Assets   │    │   - Auth            │           │  │
│  │  └─────────────────────┘    │   - Business Logic  │           │  │
│  │                              └──────────┬──────────┘           │  │
│  └──────────────────────────────────────────┼────────────────────┘  │
│                                              │                       │
│              ┌───────────────────────────────┼───────────────────┐   │
│              ▼                               ▼                   │   │
│  ┌─────────────────────┐         ┌─────────────────────┐        │   │
│  │     PostgreSQL      │         │   Local Storage     │        │   │
│  │    (Managed DB)     │         │ (/uploads directory)│        │   │
│  └─────────────────────┘         └─────────────────────┘        │   │
└─────────────────────────────────────────────────────────────────────┘
            │
            │  External API Calls
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       External Services                              │
│  ┌─────────────────────┐         ┌─────────────────────┐            │
│  │     알리고 SMS      │         │   도로명주소 API     │            │
│  └─────────────────────┘         └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Frontend 아키텍처

### 2.1 기술 스택
| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | Next.js | 14.x | App Router 기반 SSR/SSG |
| Language | TypeScript | 5.x | 타입 안정성 |
| UI Components | shadcn/ui | 최신 | Radix UI 기반 컴포넌트 |
| Styling | Tailwind CSS | 3.x | 유틸리티 기반 스타일링 |
| State Management | Zustand / TanStack Query | 최신 | 클라이언트/서버 상태 관리 |
| Form | React Hook Form + Zod | 7.x | 폼 관리 및 유효성 검사 |
| HTTP Client | Axios | 최신 | API 통신 |

### 2.2 디렉토리 구조
```
frontend/
├── src/
│   ├── app/                      # App Router
│   │   ├── (front)/              # 고객용 페이지 그룹
│   │   │   ├── page.tsx          # 메인페이지
│   │   │   ├── apply/            # 서비스 신청
│   │   │   ├── partner/          # 파트너 등록
│   │   │   └── layout.tsx        # FrontLayout
│   │   ├── (admin)/              # 관리자 페이지 그룹
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── applications/
│   │   │   ├── partners/
│   │   │   ├── schedule/
│   │   │   ├── settings/
│   │   │   └── layout.tsx        # AdminLayout
│   │   ├── layout.tsx            # Root Layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── common/               # 공통 컴포넌트
│   │   ├── forms/                # 폼 관련 컴포넌트
│   │   ├── layouts/              # 레이아웃 컴포넌트
│   │   └── features/             # 기능별 컴포넌트
│   │
│   ├── hooks/                    # 커스텀 훅
│   ├── lib/                      # 유틸리티
│   │   ├── api/                  # API 클라이언트
│   │   ├── utils/                # 유틸 함수
│   │   ├── validations/          # Zod 스키마
│   │   └── constants/            # 상수
│   └── types/                    # TypeScript 타입
│
├── public/
├── components.json               # shadcn 설정
├── tailwind.config.ts
└── next.config.js
```

### 2.3 라우팅 구조
| 경로 | 페이지 | 접근 권한 |
|------|--------|-----------|
| `/` | 메인페이지 | 공개 |
| `/apply` | 서비스 신청 | 공개 |
| `/partner` | 파트너 등록 | 공개 |
| `/admin/login` | 관리자 로그인 | 공개 |
| `/admin/dashboard` | 대시보드 | 관리자 |
| `/admin/applications` | 신청 관리 | 관리자 |
| `/admin/applications/[id]` | 신청 상세 | 관리자 |
| `/admin/partners` | 파트너 관리 | 관리자 |
| `/admin/schedule` | 일정 관리 | 관리자 |
| `/admin/settings` | 설정 | 관리자 |

## 3. Backend 아키텍처

### 3.1 기술 스택
| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | FastAPI | 0.100+ | 비동기 REST API |
| Language | Python | 3.11+ | 백엔드 개발 |
| ORM | SQLAlchemy | 2.x | 데이터베이스 접근 |
| Migration | Alembic | 최신 | DB 스키마 마이그레이션 |
| Validation | Pydantic | 2.x | 요청/응답 데이터 검증 |
| Auth | python-jose + passlib | 최신 | JWT 인증 |

### 3.2 디렉토리 구조
```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── applications.py
│   │   │   │   ├── partners.py
│   │   │   │   ├── schedules.py
│   │   │   │   ├── settings.py
│   │   │   │   └── sms.py
│   │   │   └── router.py
│   │   └── deps.py               # 의존성 주입
│   ├── core/
│   │   ├── config.py             # 환경 설정
│   │   ├── security.py           # 암호화, JWT
│   │   └── database.py           # DB 연결
│   ├── models/                   # SQLAlchemy 모델
│   ├── schemas/                  # Pydantic 스키마
│   ├── services/                 # 비즈니스 로직
│   ├── utils/                    # 유틸리티
│   └── main.py
├── alembic/                      # DB 마이그레이션
├── tests/
└── requirements.txt
```

### 3.3 레이어드 아키텍처
```
┌─────────────────────────────────────┐
│           API Layer                  │
│    (endpoints/*.py)                  │
│    - HTTP 요청/응답 처리             │
│    - 입력 검증                       │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│         Service Layer                │
│    (services/*.py)                   │
│    - 비즈니스 로직                   │
│    - 트랜잭션 관리                   │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│       Repository Layer               │
│    (models/*.py + SQLAlchemy)        │
│    - 데이터 접근                     │
│    - 쿼리 실행                       │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│         Database                     │
│    (PostgreSQL / MySQL)              │
└─────────────────────────────────────┘
```

## 4. 데이터 흐름

### 4.1 서비스 신청 흐름
```
고객 브라우저
     │
     │ 1. 신청 폼 제출
     ▼
┌─────────────┐
│  Next.js    │
│  (CSR)      │
└──────┬──────┘
       │ 2. POST /api/v1/applications
       ▼
┌─────────────┐
│  FastAPI    │
│  Backend    │
└──────┬──────┘
       │ 3. 데이터 검증 & 저장
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │ 4. 신청번호 생성
       ▼
   응답 반환
```

### 4.2 관리자 신청 처리 흐름
```
관리자 브라우저
     │
     │ 1. 신청 목록 조회
     ▼
┌─────────────┐     2. JWT 검증
│  Next.js    │────────────────┐
│  (CSR)      │                │
└──────┬──────┘                │
       │                       ▼
       │              ┌─────────────┐
       │              │   FastAPI   │
       │              │   Backend   │
       │              └──────┬──────┘
       │                     │
       │                     ▼
       │              ┌─────────────┐
       │              │ PostgreSQL  │
       │              └──────┬──────┘
       │                     │
       ▼                     ▼
  UI 렌더링 ◄───────── 데이터 반환
```

## 5. 인증 아키텍처

### 5.1 JWT 기반 인증
```
┌─────────────────────────────────────────────────────────┐
│                    인증 흐름                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 로그인 요청                                          │
│     POST /api/v1/auth/login                              │
│     { username, password }                               │
│                       │                                  │
│                       ▼                                  │
│  2. 비밀번호 검증 (bcrypt)                               │
│                       │                                  │
│                       ▼                                  │
│  3. JWT 토큰 발급                                        │
│     - Access Token (2시간)                               │
│     - Refresh Token (7일) [선택]                         │
│                       │                                  │
│                       ▼                                  │
│  4. 클라이언트 저장 (httpOnly Cookie 또는 localStorage)  │
│                       │                                  │
│                       ▼                                  │
│  5. 인증 필요 API 호출 시 Authorization 헤더 포함        │
│     Authorization: Bearer <token>                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 보안 고려사항
- 비밀번호: bcrypt 해싱 (cost factor: 12)
- JWT: HS256 알고리즘
- 세션 타임아웃: 2시간
- 로그인 실패 제한: 5회 후 15분 잠금
- CSRF 보호: SameSite Cookie 설정

## 6. 외부 서비스 연동

### 6.1 알리고 SMS API
```
Backend                          알리고 서버
   │                                  │
   │  1. SMS 발송 요청                │
   │  POST /send                      │
   │  { key, user_id, sender,         │
   │    receiver, msg }               │
   ├─────────────────────────────────▶│
   │                                  │
   │  2. 발송 결과                    │
   │  { result_code, message,         │
   │    msg_id, ... }                 │
   │◀─────────────────────────────────┤
   │                                  │
   │  3. 발송 이력 저장 (SMSLog)      │
   │                                  │
```

### 6.2 도로명주소 API
```
Frontend (브라우저)              도로명주소 서버
   │                                  │
   │  1. 주소 검색 요청               │
   │  GET /addrlink/addrLinkApi.do    │
   │  ?keyword=...&confmKey=...       │
   ├─────────────────────────────────▶│
   │                                  │
   │  2. 검색 결과                    │
   │  { results: [...] }              │
   │◀─────────────────────────────────┤
   │                                  │
```

## 7. 확장성 고려사항

### 7.1 수평 확장
- 컨테이너 기반 배포 (Docker)
- 로드 밸런서를 통한 트래픽 분산
- 세션 외부화 (Redis) - 향후

### 7.2 데이터베이스 확장
- 읽기 복제본 추가 가능한 구조
- 인덱스 최적화
- 쿼리 캐싱 (향후)

### 7.3 파일 스토리지 확장
- 현재: 로컬 `/uploads` 디렉토리
- 향후: AWS S3 또는 CloudFront CDN 연동 가능
