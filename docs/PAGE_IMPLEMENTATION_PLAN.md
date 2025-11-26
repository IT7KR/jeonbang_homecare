# 페이지별 구현 계획서

> 작성일: 2025-11-26
> 프로젝트: 전방 홈케어 서비스 플랫폼

---

## 현재 구현 진행상황 요약

### 전체 진행률

| 구분 | 완료 | 미완료 | 진행률 |
|------|------|--------|--------|
| Front Office | 3개 | 0개 | 100% |
| Back Office | 0개 | 6개 | 0% |
| Backend API | 6개 | 2개 | 75% |

### 구현 완료 항목

**Frontend (Front Office)**
- ✅ 메인 페이지 (`/`)
- ✅ 서비스 신청 페이지 (`/apply`)
- ✅ 파트너 등록 페이지 (`/partner`)

**Backend API**
- ✅ Regions API (`/api/v1/regions`)
- ✅ Services API (`/api/v1/services`)
- ✅ Applications API (`/api/v1/applications`)
- ✅ Partners API (`/api/v1/partners`)
- ✅ Admin Auth API (`/api/v1/admin/auth`)
- ✅ Admin Dashboard API (`/api/v1/admin/dashboard`)

### 미구현 항목

**Frontend (Back Office)** - 전체 미구현
- ❌ 관리자 로그인 페이지
- ❌ 대시보드
- ❌ 신청 관리
- ❌ 파트너 관리
- ❌ 일정 관리
- ❌ 설정

---

## 페이지별 상세 구현 계획

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

---

### 1.2 서비스 신청 페이지 (`/apply`)

**상태**: ✅ 완료

**구현 내용**:
- 서비스 선택 (API에서 카테고리/서비스 동적 로딩)
- 고객 정보 입력 (이름, 연락처)
- 주소 검색 (다음 주소 API 연동)
- 요청 사항 입력
- 사진 첨부 (최대 5장, 클라이언트 측 압축)
- 개인정보 동의
- 신청 완료 화면
- 유효성 검사 (Zod 스키마)

**관련 파일**:
- `frontend/src/app/(front)/apply/page.tsx`
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
- `frontend/src/components/forms/RegionSelector.tsx`
- `frontend/src/lib/validations/partner.ts`
- `frontend/src/lib/api/partners.ts`
- `frontend/src/lib/constants/regions.ts`

**Backend 연동**:
- `POST /api/v1/partners` - 파트너 등록

---

## Part 2: Back Office (관리자용)

### 2.1 관리자 로그인 페이지 (`/admin/login`)

**상태**: ❌ 미구현

**우선순위**: P0 (필수)

**요구사항**:
| 항목 | 상세 |
|------|------|
| 입력 필드 | 아이디, 비밀번호 |
| 보안 | 로그인 실패 횟수 제한 (5회), 세션 타임아웃 (2시간) |
| 확장성 | 다중 관리자 계정 지원 가능한 구조 |

**구현 계획**:
1. 로그인 폼 컴포넌트 생성
2. JWT 토큰 저장 (localStorage 또는 httpOnly cookie)
3. 로그인 상태 관리 (Zustand 또는 Context)
4. 인증 미들웨어/가드 구현
5. 로그인 실패 횟수 카운트 및 제한

**생성할 파일**:
```
frontend/src/app/(admin)/login/page.tsx
frontend/src/lib/api/auth.ts
frontend/src/stores/authStore.ts (또는 context)
frontend/src/components/providers/AuthProvider.tsx
```

**Backend 연동**:
- `POST /api/v1/admin/auth/login` - 로그인 (구현 완료)
- `POST /api/v1/admin/auth/logout` - 로그아웃
- `GET /api/v1/admin/auth/me` - 현재 사용자 정보

---

### 2.2 관리자 대시보드 (`/admin/dashboard`)

**상태**: ❌ 미구현

**우선순위**: P1

**요구사항**:
| 항목 | 상세 |
|------|------|
| 오늘 신규 신청 | 건수, 클릭 시 신청 리스트로 이동 |
| 미처리 신청 | 건수 |
| 금주 방문 예정 | 건수 |
| 대기 중 파트너 신청 | 건수 |
| 최근 활동 | 최근 신청 5건 리스트 |

**구현 계획**:
1. 대시보드 레이아웃 (AdminLayout 적용)
2. 통계 카드 컴포넌트 (4개)
3. 최근 신청 리스트 테이블
4. 데이터 페칭 (TanStack Query)

**생성할 파일**:
```
frontend/src/app/(admin)/dashboard/page.tsx
frontend/src/app/(admin)/layout.tsx
frontend/src/components/layouts/AdminLayout.tsx
frontend/src/components/admin/Sidebar.tsx
frontend/src/components/admin/StatCard.tsx
```

**Backend 연동**:
- `GET /api/v1/admin/dashboard/stats` - 대시보드 통계 (구현 완료)

---

### 2.3 신청 관리 페이지 (`/admin/applications`)

**상태**: ❌ 미구현

**우선순위**: P0 (필수)

#### 2.3.1 신청 리스트 (`/admin/applications`)

**요구사항**:
| 항목 | 상세 |
|------|------|
| 표시 컬럼 | 신청번호, 고객명, 연락처, 서비스 유형, 희망일자, 상태, 배정 파트너, 신청일시 |
| 정렬 | 기본: 신청일시 내림차순, 컬럼별 정렬 가능 |
| 페이지네이션 | 페이지당 20건 |
| 검색 | 고객명, 연락처, 신청번호 |
| 필터 | 상태, 서비스 유형, 기간, 배정 여부 |

**구현 계획**:
1. DataTable 공통 컴포넌트 생성
2. 신청 리스트 페이지 구현
3. 검색/필터 컴포넌트
4. 페이지네이션 컴포넌트
5. 행 클릭 시 상세 패널 표시

#### 2.3.2 신청 상세 패널

**요구사항**:
| 항목 | 상세 |
|------|------|
| 고객 정보 | 이름, 연락처, 주소 |
| 서비스 정보 | 선택한 서비스, 세부 옵션 |
| 일정 정보 | 희망일자, 희망시간대, 대체일자 |
| 요청사항 | 텍스트, 첨부 이미지 |
| 처리 이력 | 상태 변경 이력, 담당자, 일시 |
| 액션 | 상태 변경, 파트너 배정, SMS 발송, 메모 추가 |

**생성할 파일**:
```
frontend/src/app/(admin)/applications/page.tsx
frontend/src/app/(admin)/applications/[id]/page.tsx
frontend/src/components/admin/applications/ApplicationList.tsx
frontend/src/components/admin/applications/ApplicationDetail.tsx
frontend/src/components/admin/applications/ApplicationFilters.tsx
frontend/src/components/admin/applications/StatusBadge.tsx
frontend/src/components/admin/applications/PartnerAssignModal.tsx
frontend/src/components/admin/applications/SMSModal.tsx
frontend/src/components/common/DataTable.tsx
frontend/src/components/common/Pagination.tsx
frontend/src/lib/api/admin/applications.ts
```

**Backend 연동**:
- `GET /api/v1/admin/applications` - 신청 목록 조회
- `GET /api/v1/admin/applications/:id` - 신청 상세 조회
- `PATCH /api/v1/admin/applications/:id/status` - 상태 변경
- `POST /api/v1/admin/applications/:id/assign` - 파트너 배정
- `POST /api/v1/admin/applications/:id/sms` - SMS 발송
- `POST /api/v1/admin/applications/:id/notes` - 메모 추가

---

### 2.4 파트너 관리 페이지 (`/admin/partners`)

**상태**: ❌ 미구현

**우선순위**: P1

#### 2.4.1 파트너 리스트 (`/admin/partners`)

**요구사항**:
| 항목 | 상세 |
|------|------|
| 표시 컬럼 | 업체명, 대표자, 담당자, 연락처, 서비스 항목, 지역, 상태, 등록일 |
| 필터 | 상태 (전체/대기/승인/반려/비활성), 서비스 항목, 지역 |

#### 2.4.2 파트너 상세 패널

**요구사항**:
| 항목 | 상세 |
|------|------|
| 기본 정보 | 업체명, 대표자, 담당자, 연락처, 이메일, 주소 |
| 서비스 정보 | 가능 서비스, 가능 지역 |
| 제출 서류 | 사업자등록증 (다운로드/미리보기) |
| 소개 | 자기소개/업체소개 내용 |
| 처리 이력 | 상태 변경 이력 |
| 액션 | 승인, 반려 (사유 입력), 비활성화 |

**생성할 파일**:
```
frontend/src/app/(admin)/partners/page.tsx
frontend/src/app/(admin)/partners/[id]/page.tsx
frontend/src/components/admin/partners/PartnerList.tsx
frontend/src/components/admin/partners/PartnerDetail.tsx
frontend/src/components/admin/partners/PartnerFilters.tsx
frontend/src/components/admin/partners/ApprovalModal.tsx
frontend/src/lib/api/admin/partners.ts
```

**Backend 연동**:
- `GET /api/v1/admin/partners` - 파트너 목록 조회
- `GET /api/v1/admin/partners/:id` - 파트너 상세 조회
- `PATCH /api/v1/admin/partners/:id/approve` - 승인
- `PATCH /api/v1/admin/partners/:id/reject` - 반려
- `PATCH /api/v1/admin/partners/:id/deactivate` - 비활성화

---

### 2.5 일정 관리 페이지 (`/admin/schedule`)

**상태**: ❌ 미구현

**우선순위**: P1

**요구사항**:
| 항목 | 상세 |
|------|------|
| 캘린더 뷰 | 월별/주별 캘린더, 날짜별 방문 건수 및 카드 |
| 리스트 뷰 | 방문일, 시간대, 고객명, 서비스, 주소, 파트너, 상태 |
| 필터 | 기간, 파트너, 상태 |
| 상세 패널 | 연결된 신청 정보, 파트너 정보, 메모 |

**생성할 파일**:
```
frontend/src/app/(admin)/schedule/page.tsx
frontend/src/components/admin/schedule/CalendarView.tsx
frontend/src/components/admin/schedule/ListView.tsx
frontend/src/components/admin/schedule/ScheduleCard.tsx
frontend/src/components/admin/schedule/ScheduleDetail.tsx
frontend/src/lib/api/admin/schedule.ts
```

**Backend 연동 (추가 구현 필요)**:
- `GET /api/v1/admin/schedule` - 일정 목록 조회
- `GET /api/v1/admin/schedule/:date` - 특정 날짜 일정

---

### 2.6 설정 페이지 (`/admin/settings`)

**상태**: ❌ 미구현

**우선순위**: P2

#### 2.6.1 기본 정보 설정

**요구사항**:
- 회사명, 대표자, 주소, 연락처, 사업자번호 관리
- Footer에 자동 반영

#### 2.6.2 서비스/지역 관리

**요구사항**:
- 서비스 유형 추가/수정/삭제/순서변경
- 지역 추가/수정/삭제

#### 2.6.3 SMS 템플릿 관리

**요구사항**:
- 템플릿 추가/수정/삭제
- 변수 치환 지원 ({고객명}, {신청번호} 등)

#### 2.6.4 QR 코드 생성

**요구사항**:
- 텍스트 입력 → QR 코드 이미지 생성
- 다운로드 기능

**생성할 파일**:
```
frontend/src/app/(admin)/settings/page.tsx
frontend/src/app/(admin)/settings/company/page.tsx
frontend/src/app/(admin)/settings/services/page.tsx
frontend/src/app/(admin)/settings/regions/page.tsx
frontend/src/app/(admin)/settings/sms-templates/page.tsx
frontend/src/app/(admin)/settings/qr/page.tsx
frontend/src/components/admin/settings/CompanyForm.tsx
frontend/src/components/admin/settings/ServiceManager.tsx
frontend/src/components/admin/settings/RegionManager.tsx
frontend/src/components/admin/settings/SMSTemplateManager.tsx
frontend/src/components/admin/settings/QRGenerator.tsx
frontend/src/lib/api/admin/settings.ts
```

---

## Part 3: 공통 컴포넌트

### 3.1 구현 완료

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| Header | `components/common/Header.tsx` | 반응형 GNB (모바일 햄버거 메뉴) |
| Footer | `components/common/Footer.tsx` | 회사 정보, 링크 |
| FAB | `components/common/FAB.tsx` | 전화/문자 플로팅 버튼 |
| FrontLayout | `components/layouts/FrontLayout.tsx` | Front Office 레이아웃 |
| PhoneInput | `components/forms/PhoneInput.tsx` | 전화번호 자동 포맷팅 |
| DaumPostcode | `components/forms/DaumPostcode.tsx` | 주소 검색 컴포넌트 |
| RegionSelector | `components/forms/RegionSelector.tsx` | 지역 선택 컴포넌트 |

### 3.2 추가 구현 필요

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| AdminLayout | `components/layouts/AdminLayout.tsx` | Back Office 레이아웃 |
| Sidebar | `components/admin/Sidebar.tsx` | 관리자 사이드바 네비게이션 |
| DataTable | `components/common/DataTable.tsx` | 정렬/필터 가능한 테이블 |
| Pagination | `components/common/Pagination.tsx` | 페이지네이션 |
| StatCard | `components/admin/StatCard.tsx` | 대시보드 통계 카드 |
| PageTitle | `components/common/PageTitle.tsx` | 페이지 제목 |
| ConfirmDialog | `components/common/ConfirmDialog.tsx` | 확인 다이얼로그 |
| Toast | `components/common/Toast.tsx` | 알림 토스트 |

---

## Part 4: Backend API 추가 구현 필요

### 4.1 관리자 신청 관리 API

```
GET    /api/v1/admin/applications         - 신청 목록 (필터, 페이지네이션)
GET    /api/v1/admin/applications/:id     - 신청 상세
PATCH  /api/v1/admin/applications/:id/status  - 상태 변경
POST   /api/v1/admin/applications/:id/assign  - 파트너 배정
POST   /api/v1/admin/applications/:id/sms     - SMS 발송
POST   /api/v1/admin/applications/:id/notes   - 메모 추가
```

### 4.2 관리자 파트너 관리 API

```
GET    /api/v1/admin/partners             - 파트너 목록 (필터, 페이지네이션)
GET    /api/v1/admin/partners/:id         - 파트너 상세
PATCH  /api/v1/admin/partners/:id/approve - 승인
PATCH  /api/v1/admin/partners/:id/reject  - 반려
PATCH  /api/v1/admin/partners/:id/deactivate - 비활성화
```

### 4.3 일정 관리 API

```
GET    /api/v1/admin/schedule             - 일정 목록
GET    /api/v1/admin/schedule/:date       - 특정 날짜 일정
```

### 4.4 설정 API

```
GET    /api/v1/admin/settings/company     - 회사 정보 조회
PUT    /api/v1/admin/settings/company     - 회사 정보 수정
GET    /api/v1/admin/settings/sms-templates   - SMS 템플릿 목록
POST   /api/v1/admin/settings/sms-templates   - SMS 템플릿 생성
PUT    /api/v1/admin/settings/sms-templates/:id - SMS 템플릿 수정
DELETE /api/v1/admin/settings/sms-templates/:id - SMS 템플릿 삭제
```

---

## 구현 우선순위 및 일정

### Phase 1: 핵심 기능 (11/29 ~ 12/12)

| 순서 | 페이지 | 우선순위 | 예상 소요 |
|------|--------|----------|----------|
| 1 | 관리자 로그인 | P0 | 1일 |
| 2 | AdminLayout + Sidebar | P0 | 0.5일 |
| 3 | 대시보드 | P1 | 0.5일 |
| 4 | 신청 리스트 | P0 | 1일 |
| 5 | 신청 상세 + 상태변경 | P0 | 1일 |
| 6 | 파트너 배정 | P0 | 0.5일 |
| 7 | SMS 발송 | P0 | 0.5일 |

### Phase 2: 추가 기능 (12/13 ~ 12/19)

| 순서 | 페이지 | 우선순위 | 예상 소요 |
|------|--------|----------|----------|
| 8 | 파트너 리스트 | P1 | 1일 |
| 9 | 파트너 상세 + 승인/반려 | P1 | 1일 |
| 10 | 일정 캘린더 뷰 | P1 | 1일 |
| 11 | 일정 리스트 뷰 | P1 | 0.5일 |
| 12 | 설정 - 기본정보 | P2 | 0.5일 |
| 13 | 설정 - SMS 템플릿 | P2 | 0.5일 |
| 14 | 설정 - QR 코드 | P2 | 0.5일 |

---

## 기술 스택 참고

### Frontend
- **Framework**: Next.js 15 (App Router)
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

## 참고 문서

- [PRD.md](./PRD.md) - 전체 요구사항 정의서
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 개발 가이드
