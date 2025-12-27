# 페이지별 구현 계획서

> 작성일: 2025-11-26
> 최종 업데이트: 2025-12-27
> 프로젝트: 전방 홈케어 서비스 플랫폼
> **상태: 구현 완료**

---

## 현재 구현 진행상황 요약

### 전체 진행률

| 구분 | 완료 | 미완료 | 진행률 |
|------|------|--------|--------|
| Front Office | 5개 | 0개 | 100% |
| Back Office | 6개 | 0개 | 100% |
| Backend API | 8개 | 0개 | 100% |

### 구현 완료 항목

**Frontend (Front Office)**
- ✅ 메인 페이지 (`/`)
- ✅ 서비스 신청 페이지 (`/apply`)
- ✅ 파트너 등록 페이지 (`/partner`)
- ✅ FAQ 페이지 (`/faq`)
- ✅ About 페이지 (`/about`)

**Frontend (Back Office)**
- ✅ 관리자 로그인 페이지 (`/admin/login`)
- ✅ 대시보드 (`/admin/dashboard`)
- ✅ 신청 관리 (`/admin/applications`)
- ✅ 파트너 관리 (`/admin/partners`)
- ✅ 일정 관리 (`/admin/schedule`)
- ✅ 설정 (`/admin/settings`)

**Backend API**
- ✅ Regions API (`/api/v1/regions`)
- ✅ Services API (`/api/v1/services`)
- ✅ Applications API (`/api/v1/applications`)
- ✅ Partners API (`/api/v1/partners`)
- ✅ Admin Auth API (`/api/v1/admin/auth`)
- ✅ Admin Dashboard API (`/api/v1/admin/dashboard`)
- ✅ Admin Applications API (`/api/v1/admin/applications`)
- ✅ Admin Partners API (`/api/v1/admin/partners`)
- ✅ Admin SMS API (`/api/v1/admin/sms`)
- ✅ Admin Schedule API (`/api/v1/admin/schedule`)
- ✅ Admin Settings API (`/api/v1/admin/settings`)

---

## 페이지별 상세 구현 현황

---

## Part 1: Front Office (고객용)

### 1.1 메인 페이지 (`/`)

**상태**: ✅ 완료

**구현 내용**:
- Hero 배너 섹션 (CTA 버튼 포함)
- 전방 소개 섹션 (회사 생태계 설명)
- 서비스 구조 섹션 (고객 → 전방 → 파트너 플로우)
- 서비스 분야 섹션 (6개 카테고리)
- 전방 핵심 역할 섹션 (5단계 프로세스)
- 견적 요청 섹션 (QR 코드, 연락처)
- 파트너 안내 섹션
- 반응형 GNB (Header)
- Footer
- FAB (전화/문자 버튼)

**관련 파일**:
- `frontend/src/app/(front)/page.tsx`
- `frontend/src/components/common/Header.tsx`
- `frontend/src/components/common/Footer.tsx`
- `frontend/src/components/common/FAB.tsx`
- `frontend/src/components/layouts/FrontLayout.tsx`
- `frontend/src/components/features/landing/ServiceGrid.tsx`
- `frontend/src/components/features/landing/CompanyIntroCards.tsx`

---

### 1.2 서비스 신청 페이지 (`/apply`)

**상태**: ✅ 완료

**구현 내용**:
- 3단계 마법사 UI 구현
- 서비스 선택 (API에서 카테고리/서비스 동적 로딩)
- 고객 정보 입력 (이름, 연락처)
- 주소 검색 (다음 주소 API 연동)
- 요청 사항 입력
- 사진 첨부 (최대 5장, 클라이언트 측 압축)
- 개인정보 동의
- 신청 완료 화면
- 유효성 검사 (Zod 스키마)
- 시니어 친화적 UI (큰 글씨, 명확한 라벨)

**관련 파일**:
- `frontend/src/app/(front)/apply/page.tsx`
- `frontend/src/components/features/apply/ApplyStep1Service.tsx`
- `frontend/src/components/features/apply/ApplyStep2Info.tsx`
- `frontend/src/components/features/apply/ApplyStep3Confirm.tsx`
- `frontend/src/components/features/apply/ApplySuccess.tsx`
- `frontend/src/components/wizard/WizardContainer.tsx`
- `frontend/src/components/wizard/StepIndicator.tsx`
- `frontend/src/components/wizard/WizardNavigation.tsx`
- `frontend/src/components/forms/PhoneInput.tsx`
- `frontend/src/components/forms/DaumPostcode.tsx`
- `frontend/src/lib/validations/application.ts`
- `frontend/src/lib/api/applications.ts`
- `frontend/src/lib/utils/image.ts`

**Backend 연동**:
- `POST /api/v1/applications` - 신청 생성
- `GET /api/v1/services` - 서비스 목록 조회

---

### 1.3 파트너 등록 페이지 (`/partner`)

**상태**: ✅ 완료

**구현 내용**:
- 4단계 마법사 UI 구현
- 기본 정보 (회사명, 대표자명, 사업자등록번호)
- 연락처 정보 (전화번호, 이메일)
- 주소 정보 (다음 주소 API 연동)
- 서비스 분야 선택 (복수 선택)
- 활동 지역 선택 (시/도 → 시/군/구 계층 선택)
- 소개 및 경력
- 약관 동의
- 등록 완료 화면

**관련 파일**:
- `frontend/src/app/(front)/partner/page.tsx`
- `frontend/src/components/features/partner/PartnerStep1Service.tsx`
- `frontend/src/components/features/partner/PartnerStep2Info.tsx`
- `frontend/src/components/features/partner/PartnerStep3Detail.tsx`
- `frontend/src/components/features/partner/PartnerStep4Confirm.tsx`
- `frontend/src/components/features/partner/PartnerSuccess.tsx`
- `frontend/src/components/forms/RegionSelector.tsx`
- `frontend/src/lib/validations/partner.ts`
- `frontend/src/lib/api/partners.ts`
- `frontend/src/lib/constants/regions.ts`

**Backend 연동**:
- `POST /api/v1/partners` - 파트너 등록

---

### 1.4 FAQ 페이지 (`/faq`)

**상태**: ✅ 완료

**구현 내용**:
- 자주 묻는 질문 목록
- 아코디언 UI
- 카테고리별 분류

**관련 파일**:
- `frontend/src/app/(front)/faq/page.tsx`

---

### 1.5 About 페이지 (`/about`)

**상태**: ✅ 완료

**구현 내용**:
- 회사 소개
- 서비스 소개
- 비전 및 미션

**관련 파일**:
- `frontend/src/app/(front)/about/page.tsx`

---

## Part 2: Back Office (관리자용)

### 2.1 관리자 로그인 페이지 (`/admin/login`)

**상태**: ✅ 완료

**구현 내용**:
- 로그인 폼 (아이디, 비밀번호)
- JWT 토큰 저장 (localStorage)
- 로그인 상태 관리 (Zustand)
- 인증 미들웨어/가드 구현
- 로그인 실패 처리

**관련 파일**:
- `frontend/src/app/(admin)/admin/login/page.tsx`
- `frontend/src/lib/api/admin/auth.ts`
- `frontend/src/lib/stores/auth.ts`

**Backend 연동**:
- `POST /api/v1/admin/auth/login` - 로그인
- `POST /api/v1/admin/auth/logout` - 로그아웃
- `GET /api/v1/admin/auth/me` - 현재 사용자 정보

---

### 2.2 관리자 대시보드 (`/admin/dashboard`)

**상태**: ✅ 완료

**구현 내용**:
- 대시보드 레이아웃 (AdminLayout 적용)
- 통계 카드 (오늘 신규 신청, 미처리 신청, 금주 방문 예정, 대기 중 파트너)
- 최근 신청 리스트 테이블
- 데이터 페칭

**관련 파일**:
- `frontend/src/app/(admin)/admin/dashboard/page.tsx`
- `frontend/src/app/(admin)/admin/layout.tsx`
- `frontend/src/components/layouts/AdminLayout.tsx`

**Backend 연동**:
- `GET /api/v1/admin/dashboard/stats` - 대시보드 통계

---

### 2.3 신청 관리 페이지 (`/admin/applications`)

**상태**: ✅ 완료

**구현 내용**:
- 신청 리스트 (정렬, 필터, 페이지네이션)
- 신청 상세 정보 표시
- 상태 변경 기능
- 파트너 배정 기능
- SMS 발송 기능
- 메모 추가 기능
- 첨부 이미지 표시

**관련 파일**:
- `frontend/src/app/(admin)/admin/applications/page.tsx`
- `frontend/src/app/(admin)/admin/applications/[id]/page.tsx`
- `frontend/src/lib/api/admin/applications.ts`
- `frontend/src/lib/api/admin/types.ts`

**Backend 연동**:
- `GET /api/v1/admin/applications` - 신청 목록 조회
- `GET /api/v1/admin/applications/:id` - 신청 상세 조회
- `PATCH /api/v1/admin/applications/:id/status` - 상태 변경
- `POST /api/v1/admin/applications/:id/assign` - 파트너 배정
- `POST /api/v1/admin/applications/:id/sms` - SMS 발송
- `POST /api/v1/admin/applications/:id/notes` - 메모 추가

---

### 2.4 파트너 관리 페이지 (`/admin/partners`)

**상태**: ✅ 완료

**구현 내용**:
- 파트너 리스트 (정렬, 필터, 페이지네이션)
- 파트너 상세 정보 표시
- 승인/반려 기능
- 비활성화 기능

**관련 파일**:
- `frontend/src/app/(admin)/admin/partners/page.tsx`
- `frontend/src/app/(admin)/admin/partners/[id]/page.tsx`
- `frontend/src/lib/api/admin/partners.ts`

**Backend 연동**:
- `GET /api/v1/admin/partners` - 파트너 목록 조회
- `GET /api/v1/admin/partners/:id` - 파트너 상세 조회
- `PATCH /api/v1/admin/partners/:id/approve` - 승인
- `PATCH /api/v1/admin/partners/:id/reject` - 반려
- `PATCH /api/v1/admin/partners/:id/deactivate` - 비활성화

---

### 2.5 일정 관리 페이지 (`/admin/schedule`)

**상태**: ✅ 완료

**구현 내용**:
- 캘린더 뷰 (월별/주별)
- 날짜별 방문 건수 및 카드
- 리스트 뷰
- 필터 (기간, 파트너, 상태)
- 연결된 신청 정보 표시

**관련 파일**:
- `frontend/src/app/(admin)/admin/schedule/page.tsx`
- `frontend/src/lib/api/admin/schedule.ts`

**Backend 연동**:
- `GET /api/v1/admin/schedule` - 일정 목록 조회
- `GET /api/v1/admin/schedule/:date` - 특정 날짜 일정

---

### 2.6 설정 페이지 (`/admin/settings`)

**상태**: ✅ 완료

**구현 내용**:
- 프로필 관리
- 비밀번호 변경
- 계정 관리 (다중 관리자)

**관련 파일**:
- `frontend/src/app/(admin)/admin/settings/page.tsx`
- `frontend/src/lib/api/admin/settings.ts`

**Backend 연동**:
- `GET /api/v1/admin/profile` - 프로필 조회
- `PUT /api/v1/admin/profile` - 프로필 수정
- `PUT /api/v1/admin/profile/password` - 비밀번호 변경

---

## Part 3: 공통 컴포넌트

### 3.1 구현 완료

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| Header | `components/common/Header.tsx` | 반응형 GNB (모바일 햄버거 메뉴) |
| Footer | `components/common/Footer.tsx` | 회사 정보, 링크 |
| FAB | `components/common/FAB.tsx` | 전화/문자 플로팅 버튼 |
| FrontLayout | `components/layouts/FrontLayout.tsx` | Front Office 레이아웃 |
| AdminLayout | `components/layouts/AdminLayout.tsx` | Back Office 레이아웃 |
| PhoneInput | `components/forms/PhoneInput.tsx` | 전화번호 자동 포맷팅 |
| DaumPostcode | `components/forms/DaumPostcode.tsx` | 주소 검색 컴포넌트 |
| RegionSelector | `components/forms/RegionSelector.tsx` | 지역 선택 컴포넌트 |
| WizardContainer | `components/wizard/WizardContainer.tsx` | 마법사 컨테이너 |
| StepIndicator | `components/wizard/StepIndicator.tsx` | 단계 표시기 |
| WizardNavigation | `components/wizard/WizardNavigation.tsx` | 마법사 네비게이션 |
| ServiceSelector | `components/services/ServiceSelector.tsx` | 서비스 선택 컴포넌트 |
| SeniorInput | `components/forms/senior/SeniorInput.tsx` | 시니어 친화적 입력 |
| SeniorLabel | `components/forms/senior/SeniorLabel.tsx` | 시니어 친화적 라벨 |

---

## Part 4: Backend API 구현 현황

### 4.1 공개 API (구현 완료)

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/v1/regions` | GET | 지역 목록 조회 |
| `/api/v1/services` | GET | 서비스 목록 조회 |
| `/api/v1/applications` | POST | 서비스 신청 |
| `/api/v1/partners` | POST | 협력사 등록 |

### 4.2 관리자 API (구현 완료)

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/v1/admin/auth/login` | POST | 로그인 |
| `/api/v1/admin/auth/logout` | POST | 로그아웃 |
| `/api/v1/admin/auth/me` | GET | 현재 사용자 정보 |
| `/api/v1/admin/dashboard/stats` | GET | 대시보드 통계 |
| `/api/v1/admin/applications` | GET | 신청 목록 |
| `/api/v1/admin/applications/:id` | GET | 신청 상세 |
| `/api/v1/admin/applications/:id/status` | PATCH | 상태 변경 |
| `/api/v1/admin/applications/:id/assign` | POST | 파트너 배정 |
| `/api/v1/admin/applications/:id/sms` | POST | SMS 발송 |
| `/api/v1/admin/partners` | GET | 파트너 목록 |
| `/api/v1/admin/partners/:id` | GET | 파트너 상세 |
| `/api/v1/admin/partners/:id/approve` | PATCH | 승인 |
| `/api/v1/admin/partners/:id/reject` | PATCH | 반려 |
| `/api/v1/admin/schedule` | GET | 일정 목록 |
| `/api/v1/admin/sms/send` | POST | SMS 발송 |
| `/api/v1/admin/sms/logs` | GET | SMS 발송 이력 |
| `/api/v1/admin/profile` | GET/PUT | 프로필 관리 |

---

## 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **상태관리**: Zustand (인증), TanStack Query (서버 상태)
- **폼**: React Hook Form + Zod
- **HTTP**: Axios

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.x
- **인증**: JWT (python-jose + passlib)
- **SMS**: 알리고 API

---

## 향후 개선 사항

- [ ] 신청 상세에서 협력사 배정 및 일정 확정 UI 개선
- [ ] SMS 자동 발송 (신규 신청/협력사 등록 시)
- [ ] 실제 알리고 API 연동 테스트
- [ ] 이미지 업로드/압축 처리 최적화
- [ ] E2E 테스트
- [ ] 운영 환경 배포 검증

---

## 참고 문서

- [PRD.md](./PRD.md) - 전체 요구사항 정의서
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 개발 가이드
- [API_SPEC.md](./API_SPEC.md) - API 명세서
