# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

전방 홈케어 서비스 플랫폼 - 양평/가평 지역 홈케어 서비스(제초, 정원관리, 외벽청소, 간단수리 등) 신청 및 관리 시스템

### 사용자 역할

- **고객**: 비회원으로 서비스 신청 (로그인 없음, SMS로 진행 안내)
- **협력사**: 협력업체/개인사업자 등록 (별도 포털 없음, SMS로 안내)
- **관리자**: Back Office에서 신청/협력사/일정 관리, SMS 발송

## 기술 스택

### Frontend

- Next.js 14.x (App Router)
- TypeScript 5.x
- shadcn/ui + Radix UI
- Tailwind CSS 3.x
- Zustand 또는 TanStack Query (서버 상태 관리)
- React Hook Form + Zod (폼 유효성 검사)
- Axios (HTTP 클라이언트)
- date-fns (날짜 처리)

### Backend

- FastAPI 0.100+ (Python)
- SQLAlchemy 2.x (ORM)
- Alembic (DB 마이그레이션)
- Pydantic 2.x (데이터 검증)
- python-jose + passlib (JWT 인증)

### Database & Infrastructure

- **PostgreSQL 15** (확정) - AWS Lightsail Managed DB
- Docker Compose 기반 배포 (개발/운영 환경 분리)
- 파일 저장: 로컬 `/uploads` 디렉토리 (Docker Volume)
- AWS Lightsail Instance (기존 Apache 서버에 배포)

### 운영 배포 구조

- 기존 Lightsail Instance의 Apache가 리버스 프록시 역할
- 서브 경로 배포: `도메인/homecare/` (basePath 사용)
- 환경변수 `NEXT_PUBLIC_BASE_PATH=/homecare` 설정

## Docker 개발 환경

### 시작하기

```bash
# 1. 환경 설정
cp .env.example .env
./scripts/generate-secrets.sh  # 시크릿 키 생성

# 2. 개발 서버 실행
./scripts/dev.sh

# 3. 중지
./scripts/stop.sh
```

### 주요 명령어

```bash
# 로그 확인
./scripts/logs.sh [backend|frontend|db]

# 데이터베이스 백업/복원
./scripts/backup.sh
./scripts/restore.sh backups/<file>.sql.gz

# 운영 배포
./scripts/deploy.sh
```

### 서비스 포트 (개발 환경)

- Frontend: http://localhost:3500
- Backend API: http://localhost:8020
- API Docs: http://localhost:8020/docs
- PostgreSQL: localhost:5437
- Adminer: http://localhost:8080

### 외부 서비스

- 알리고 API (SMS 발송)
- 행정안전부 도로명주소 API (주소 검색)

## 아키텍처

### 페이지 구조 (Next.js App Router)

- `(front)/` - 고객용 페이지 그룹 (메인, 서비스 신청, 협력사 등록)
- `(admin)/` - 관리자 페이지 그룹 (로그인, 대시보드, 신청관리, 협력사관리, 일정관리, 설정)

### API 구조

- RESTful API: `/api/v1/...`
- 공개 API: `/api/v1/applications`, `/api/v1/services`, `/api/v1/regions`
- 관리자 API: `/api/v1/admin/...` (JWT 인증 필요)
- 협력사 API: `/api/v1/partners` (등록용)

### 주요 데이터 모델

- `Application` - 서비스 신청 (상태: new → consulting → assigned → scheduled → completed/cancelled)
- `Partner` - 협력사 (상태: pending → approved/rejected/inactive)
- `Admin` - 관리자
- `ServiceType`, `Region` - 서비스 유형 및 지역 마스터
- `SMSLog`, `SMSTemplate` - SMS 발송 관련

### 컴포넌트 구조

- `components/ui/` - shadcn/ui 컴포넌트 (button, card, input, dialog, table 등)
- `components/common/` - 공통 컴포넌트 (Header, Footer, FAB)
- `components/forms/` - 폼 관련 공통 (AddressSearch, PhoneInput, RegionSelector, ServiceSelector)
- `components/forms/senior/` - 시니어 친화적 폼 컴포넌트 (SeniorInput, SeniorLabel, AgreementCheckbox 등)
- `components/layouts/` - 레이아웃 (FrontLayout, AdminLayout)
- `components/wizard/` - 마법사 UI 시스템 (WizardContainer, StepIndicator, WizardNavigation)
- `components/services/` - 서비스 선택 컴포넌트 (ServiceSelector, ServiceCard, ServiceCategoryAccordion)
- `components/features/apply/` - 견적 신청 스텝 컴포넌트 (ApplyStep1Service, ApplyStep2Info, ApplyStep3Confirm, ApplySuccess)
- `components/features/partner/` - 협력사 등록 스텝 컴포넌트 (PartnerStep1Service~PartnerStep4Confirm, PartnerSuccess)
- `components/features/landing/` - 랜딩 페이지 컴포넌트 (ServiceGrid, CompanyIntroCards)

### 유틸리티 구조

- `lib/api/` - API 클라이언트 모듈 (client.ts, applications.ts, partners.ts, services.ts, regions.ts, admin.ts)
- `lib/utils/` - 유틸리티 함수 (utils.ts, image.ts)
- `lib/validations/` - Zod 스키마 (application.ts, partner.ts)
- `lib/constants/` - 상수 (routes.ts, services.ts, regions.ts, design-tokens.ts)
- `lib/stores/` - Zustand 상태 관리 (auth.ts)
- `hooks/` - 커스텀 훅 (useWizardForm.ts)

## 개발 규칙

**모든 작업은 작업 단위별로 커밋해야 합니다.**

#### 커밋 원칙

- **작업 단위별 커밋**: 하나의 커밋은 하나의 논리적 변경사항만 포함
- **즉시 커밋**: 작업 완료 후 즉시 커밋 (여러 작업을 모아서 커밋 금지)
- **한글 커밋 메시지**: 모든 커밋 메시지는 한글로 작성

#### 커밋 메시지 형식

```
<이모지> <타입>: <설명>
```

#### 타입별 이모지

| 타입     | 이모지 | 설명                          |
| -------- | ------ | ----------------------------- |
| feat     | ✨     | 새로운 기능 추가              |
| fix      | 🐛     | 버그 수정                     |
| docs     | 📝     | 문서 수정                     |
| style    | 💄     | 코드 포맷팅, 세미콜론 누락 등 |
| refactor | ♻️     | 코드 리팩토링                 |
| perf     | ⚡️    | 성능 개선                     |
| test     | ✅     | 테스트 추가/수정              |
| chore    | 🔧     | 빌드, 설정 파일 수정          |
| ci       | 🚀     | CI/CD 설정                    |
| db       | 🗃️     | 데이터베이스 관련 변경        |
| ui       | 💫     | UI/애니메이션 변경            |
| i18n     | 🌐     | 다국어 처리                   |
| security | 🔒️    | 보안 관련 수정                |
| init     | 🎉     | 프로젝트 초기화               |

#### 커밋 메시지 예시

```bash
# ✅ 올바른 예
🎉 init: 프로젝트 초기 설정
✨ feat: 사용자 로그인 기능 구현
🐛 fix: 이메일 유효성 검사 오류 수정
📝 docs: API 문서 업데이트
🗃️ db: 사용자 테이블 마이그레이션 추가

# ❌ 잘못된 예
feat: add login  # 영어 사용
로그인 추가      # 타입 누락
✨ feat: 로그인, 회원가입, 비밀번호 찾기 구현  # 여러 작업 혼합
```

#### 작업 단위 분리 기준

1. **기능별 분리**: 서로 다른 기능은 별도 커밋
2. **계층별 분리**: 프론트엔드/백엔드 변경은 가능하면 분리
3. **파일 유형별 분리**: 코드/문서/설정 변경은 분리 권장

### 데이터베이스 규칙

- **PK**: `BIGSERIAL` 타입 사용 (자동 증가 BIGINT)
- **FK 제약조건**: 사용하지 않음 (애플리케이션 레벨에서 관계 관리)
- **관계 컬럼**: `_id` 접미사로 명명 (예: `partner_id`, `admin_id`)
- FK 미사용으로 인해 관계 무결성은 서비스 레이어에서 반드시 검증해야 함

### 민감 정보 암호화

고객 정보(customer_name, customer_phone, customer_address 등)와 협력사 연락처는 DB에 암호화하여 저장

### 반응형 대응

- 브레이크포인트: 모바일(~639px), 태블릿(640~1023px), 데스크톱(1024px~)
- 모바일에서 테이블은 카드 뷰 또는 가로 스크롤로 대응
- 버튼/링크 최소 44px 터치 영역

### 상태 관리

- 신청 상태: `new` → `consulting` → `assigned` → `scheduled` → `completed` / `cancelled`
- 협력사 상태: `pending` → `approved` / `rejected` / `inactive`
- SMS 상태: `pending` → `sent` / `failed`

### 신청번호 형식

`YYYYMMDD-XXX` (예: 20251125-001)

## 구현 현황 (2025-11-27 기준)

### Frontend - 완료 ✅

| 영역   | 페이지/기능                     | 상태 |
| ------ | ------------------------------- | ---- |
| 고객용 | 메인 페이지 (랜딩)              | ✅   |
| 고객용 | 견적 요청 마법사 (3단계)        | ✅   |
| 고객용 | 협력사 등록 마법사 (4단계)      | ✅   |
| 고객용 | FAQ 페이지                      | ✅   |
| 고객용 | About 페이지                    | ✅   |
| 관리자 | 로그인                          | ✅   |
| 관리자 | 대시보드                        | ✅   |
| 관리자 | 신청 목록/상세                  | ✅   |
| 관리자 | 협력사 목록/상세                | ✅   |
| 관리자 | 문자 관리 (발송/내역/재발송)    | ✅   |
| 관리자 | 일정 관리 (캘린더 뷰)           | ✅   |
| 관리자 | 설정 (프로필/비밀번호/계정관리) | ✅   |

### Backend - 완료 ✅

| API             | 엔드포인트                                    | 상태 |
| --------------- | --------------------------------------------- | ---- |
| 지역            | `/api/v1/regions`                             | ✅   |
| 서비스          | `/api/v1/services`                            | ✅   |
| 신청 (공개)     | `/api/v1/applications`                        | ✅   |
| 협력사 (공개)   | `/api/v1/partners`                            | ✅   |
| 관리자 인증     | `/api/v1/admin/auth`, `/api/v1/admin/profile` | ✅   |
| 관리자 대시보드 | `/api/v1/admin/dashboard`                     | ✅   |
| 관리자 신청     | `/api/v1/admin/applications`                  | ✅   |
| 관리자 협력사   | `/api/v1/admin/partners`                      | ✅   |
| 관리자 SMS      | `/api/v1/admin/sms`                           | ✅   |
| 관리자 일정     | `/api/v1/admin/schedule`                      | ✅   |
| 관리자 설정     | `/api/v1/admin/settings`                      | ✅   |

### 미완성/개선 필요 🔧

- 신청 상세에서 협력사 배정 및 일정 확정 UI
- SMS 자동 발송 (신규 신청/협력사 등록 시)
- 실제 알리고 API 연동 테스트
- 이미지 업로드/압축 처리 최적화
- E2E 테스트
- 운영 환경 배포 검증

## 범위 외 (Out of Scope)

- 실시간 채팅
- 온라인 결제 (현장 결제)
- 전자계약
- 고객 로그인/회원가입
- 이메일 알림 (SMS만 사용)
