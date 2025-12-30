# 전방 홈케어 플랫폼 확장성 종합 검토 보고서

## 검토 목적
**관리자 관점에서 고객/협력사 단위 관리 가능성** 분석
- 1순위: 데이터 정합성
- 2순위: 관리자 편의성

## 핵심 요구사항 (사용자 확인)

**고객 관리:**
- 고객 이력 조회 (부분 구현됨)
- **고객 목록 관리** (미구현)
- **고객 프로필 관리** (미구현)

**협력사 관리:**
- **협력사별 배정 이력** (미구현)

---

## 1. 종합 점수표 (관리자 관점 재평가)

| 질문 | DB | Backend | Frontend | UX/UI | **평균** | **판정** |
|------|:--:|:-------:|:--------:|:-----:|:--------:|:--------:|
| Q1. 회원 추가 시 관리자가 고객 단위 관리 가능? | 70 | 65 | 60 | 55 | **62.5** | **스키마 변경 필요** |
| Q2. 비회원도 관리자가 고객 단위 관리 가능? | 55 | 60 | 50 | 45 | **52.5** | **제한적** (phone_hash만) |
| Q3. 회원 추가 후 고객 관리 개선 정도? | 85 | 80 | 75 | 70 | **77.5** | **크게 개선됨** |
| Q4. 협력사별 배정 이력 관리 가능? | 75 | 70 | 65 | 60 | **67.5** | **API 추가 필요** |

---

## 2. 질문별 상세 분석 (관리자 관점)

### Q1. 회원 기능 추가 시 관리자가 고객 단위 관리 가능한가?

**결론: 스키마 변경 필요 (평균 62.5점)**

#### 현재 문제점
```
현재 구조:
├── Application (신청)
│   ├── customer_name, customer_phone (암호화) ← 신청마다 중복 저장
│   ├── phone_hash ← 유일한 고객 식별 수단
│   └── member_id ❌ 없음
└── Customer/Member 테이블 ❌ 없음 ← 고객 엔티티 부재

문제:
- "고객"이라는 독립 엔티티가 없음
- 관리자가 "고객 목록"을 조회할 방법 없음
- 고객 정보 수정 시 모든 신청을 개별 수정해야 함
```

#### 관리자 요구 vs 현재 구현

| 요구 기능 | 현재 상태 | 개선 필요 |
|-----------|----------|----------|
| 고객 이력 조회 | ⚠️ 부분 (신청 상세에서만) | API 있음, UI 확장 필요 |
| **고객 목록 관리** | ❌ 없음 | 신규 개발 필요 |
| **고객 프로필 관리** | ❌ 없음 | Customer 테이블 필요 |
| 고객별 통계 | ❌ 없음 | 추가 개발 필요 |

#### 구현 시 필요 작업

**Option A: Customer 테이블 추가 (권장)**
```sql
-- 고객 마스터 테이블
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(500),           -- 암호화
    phone VARCHAR(500) NOT NULL, -- 암호화
    phone_hash VARCHAR(64) UNIQUE INDEX,
    address VARCHAR(1000),       -- 암호화 (대표 주소)
    memo TEXT,                   -- 관리자 메모
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 신청에 고객 연결
ALTER TABLE applications ADD COLUMN customer_id BIGINT NULL;
CREATE INDEX idx_applications_customer_id ON applications(customer_id);
```

**Option B: 가상 고객 뷰 (phone_hash 기반)**
```sql
-- 기존 스키마 유지, 뷰로 고객 목록 생성
CREATE VIEW customer_summary AS
SELECT DISTINCT ON (phone_hash)
    phone_hash,
    customer_name,
    customer_phone,
    COUNT(*) as application_count,
    MAX(created_at) as last_application_at
FROM applications
GROUP BY phone_hash, customer_name, customer_phone;
```

---

### Q2. 비회원 상태에서도 관리자가 고객 단위 관리 가능한가?

**결론: 제한적 (평균 52.5점)**

#### 현재 구현된 기능

```python
# 1. 고객 이력 조회 API (구현됨)
# GET /api/v1/admin/applications/{id}/customer-history
# → 특정 신청의 고객(phone_hash)이 가진 모든 신청 반환

# 2. 신청 검색 (구현됨)
# GET /api/v1/admin/applications?search=010-1234-5678
# → 전화번호로 신청 검색 (unified_search 사용)
```

#### 관리자 관점 한계점

| 기능 | 현재 | 한계 |
|------|------|------|
| 고객 이력 조회 | ✅ 신청 상세에서 가능 | 신청을 먼저 선택해야 함 |
| 고객 목록 | ❌ 없음 | 전체 고객 파악 불가 |
| 고객 검색 | ⚠️ 신청 검색으로 우회 | 고객 직접 검색 불가 |
| 고객 정보 수정 | ❌ 불가 | 각 신청 개별 수정 필요 |
| 고객별 통계 | ❌ 없음 | 신청 건수 등 집계 불가 |

#### phone_hash 기반 관리의 근본적 한계

1. **고객 "엔티티"가 없음**: 신청의 속성으로만 존재
2. **정보 중복**: 같은 고객이 3번 신청하면 이름/주소가 3번 저장
3. **불일치 가능**: 신청별로 이름/주소가 다를 수 있음
4. **통합 관리 불가**: 고객 메모, 등급, 선호도 등 관리 불가

---

### Q3. 회원(Customer 테이블) 추가 후 고객 관리 개선 정도?

**결론: 크게 개선됨 (평균 77.5점)**

#### Customer 테이블 추가 시 가능해지는 기능

| 기능 | 현재 | 추가 후 |
|------|:----:|:-------:|
| 고객 목록 조회 | ❌ | ✅ |
| 고객 프로필 관리 | ❌ | ✅ |
| 고객 정보 통합 수정 | ❌ | ✅ |
| 고객별 신청 이력 | ⚠️ | ✅ |
| 고객 메모/태그 | ❌ | ✅ |
| 고객 통계 | ❌ | ✅ |
| VIP/등급 관리 | ❌ | ✅ |

#### 데이터 모델 개선안

```
개선된 구조:
├── Customer (고객) ← 신규 마스터 테이블
│   ├── id (PK)
│   ├── name, phone, address (암호화)
│   ├── phone_hash (UNIQUE INDEX)
│   ├── memo, tags, grade
│   └── created_at, updated_at
│
├── Application (신청)
│   ├── customer_id → Customer.id ← 신규 FK
│   ├── customer_name, customer_phone ← 레거시 (하위호환)
│   └── phone_hash ← 레거시 (기존 데이터용)
│
└── 관계: Customer 1:N Application
```

#### 마이그레이션 전략

1. **Phase 1**: customers 테이블 생성
2. **Phase 2**: phone_hash 기준 중복 제거 → customers INSERT
3. **Phase 3**: applications.customer_id 백필
4. **Phase 4**: 관리자 UI 추가 (고객 목록/상세)
5. **Phase 5**: 신규 신청 시 customer_id 자동 연결

---

### Q4. 협력사별 배정 이력 관리 가능한가?

**결론: API 추가 필요 (평균 67.5점)**

#### 현재 상태

```python
# Partner 모델 - 배정 이력 조회 없음
class Partner(Base):
    id = Column(BigInteger, primary_key=True)
    company_name = Column(String(200))
    # ... 기타 필드

# ApplicationPartnerAssignment - 배정 데이터 존재
class ApplicationPartnerAssignment(Base):
    application_id = Column(BigInteger)  # 신청 ID
    partner_id = Column(BigInteger)      # 협력사 ID ← 이미 연결됨!
    status = Column(String(20))
    # ... 기타 필드
```

#### 관리자 요구 vs 현재 구현

| 요구 기능 | 현재 상태 | 필요 작업 |
|-----------|----------|----------|
| 협력사별 배정 조회 | ❌ API 없음 | API 추가 |
| 협력사 실적 통계 | ❌ 없음 | 집계 쿼리 추가 |
| 협력사 일정 관리 | ⚠️ 신청 캘린더만 | 협력사 필터 추가 |

#### 필요한 API 추가

```python
# 1. 협력사별 배정 목록 조회
GET /api/v1/admin/partners/{partner_id}/assignments
→ ApplicationPartnerAssignment.partner_id로 조회

# 2. 협력사 실적 통계
GET /api/v1/admin/partners/{partner_id}/stats
→ 완료 건수, 평균 비용, 기간별 통계

# 3. 협력사별 일정 조회
GET /api/v1/admin/partners/{partner_id}/schedule
→ 배정된 일정 캘린더 뷰 데이터
```

#### 구현 난이도: 낮음

- **데이터는 이미 있음**: ApplicationPartnerAssignment.partner_id
- **쿼리만 추가**: 기존 테이블 조인
- **UI 추가**: 협력사 상세에 "배정 이력" 탭

---

## 3. 교차 검증 결과 (관리자 관점)

### 데이터 정합성 관점 (1순위)

| 항목 | 현재 점수 | 리스크 | 대응 방안 |
|------|:--------:|:------:|-----------|
| 고객 데이터 중복 | 40 | **높음** | Customer 테이블 분리 필요 |
| 고객-신청 연결 | 55 | 중간 | customer_id FK 추가 |
| 협력사-배정 연결 | 85 | 낮음 | 이미 partner_id로 연결됨 |
| FK 미사용 리스크 | 70 | 중간 | 서비스 레이어 검증 유지 |

### 관리자 편의성 관점 (2순위)

| 항목 | 현재 점수 | 개선 가능성 | 우선순위 |
|------|:--------:|:----------:|:--------:|
| **고객 목록 관리** | 0 | 높음 | **P0** |
| **고객 프로필 관리** | 0 | 높음 | **P0** |
| 고객 이력 조회 | 60 | 중간 | P1 |
| **협력사 배정 이력** | 0 | 높음 | **P1** |
| 협력사 통계 | 0 | 중간 | P2 |

---

## 4. 권장 선택지

### Option A: 협력사 배정 이력만 추가 (1주)

**목표**: 관리자가 협력사별 배정 현황 조회

**작업 범위**:
1. `GET /admin/partners/{id}/assignments` API 추가
2. 협력사 상세 페이지에 "배정 이력" 탭 추가
3. 스키마 변경 없음 (기존 데이터 활용)

**장점**: 빠른 구현, 리스크 없음
**단점**: 고객 관리 개선 없음

---

### Option B: Customer 테이블 추가 (권장 - 3-4주)

**목표**: 관리자가 고객 단위로 신청 관리

**작업 범위**:

**Backend:**
1. `customers` 테이블 생성 (마이그레이션)
2. `applications.customer_id` 컬럼 추가
3. 기존 데이터 → customers 테이블 마이그레이션
4. 고객 CRUD API (`/admin/customers`)
5. 협력사 배정 이력 API (Option A 포함)

**Frontend:**
1. 관리자 고객 목록 페이지
2. 관리자 고객 상세 페이지 (프로필 + 신청 이력)
3. 신청 상세에서 고객 정보 연결 UI
4. 협력사 상세에 배정 이력 탭

**점수 변화**:
- Q1: 62.5 → **85**
- Q2: 52.5 → **75**
- Q3: 77.5 → **90**
- Q4: 67.5 → **85**

---

### Option C: 전체 확장 (6-8주)

**목표**: 고객 관리 + 협력사 포털 + 고객 셀프서비스

**추가 작업** (Option B 포함):
- 고객 로그인/회원가입 (셀프서비스)
- 협력사 로그인/포털
- JWT 멀티테넌트화

**참고**: 고객 셀프서비스는 현재 요구사항에 없으므로 나중에 진행

---

## 5. 결론

### 현재 구조의 관리자 관점 평가: **55/100 (미흡)**

| 평가 항목 | 점수 | 설명 |
|-----------|:----:|------|
| 고객 단위 관리 | **30** | Customer 엔티티 부재로 불가 |
| 고객 이력 조회 | 60 | 신청 상세에서만 가능 |
| 협력사 배정 조회 | **40** | API 부재, 데이터는 존재 |
| 스키마 확장성 | 80 | Customer 추가 용이 |
| 데이터 정합성 | 50 | 고객 정보 중복 저장 문제 |

### 핵심 권장사항

1. **즉시 필요**: Customer 테이블 추가 (고객 단위 관리의 기반)
2. **즉시 필요**: 협력사 배정 이력 API (데이터 있음, API만 추가)
3. **선택적**: 고객 로그인/회원가입 (셀프서비스는 별도 요구 시)
4. **유지 필수**: 비회원 신청 플로우 (하위호환)

---

## 6. 핵심 파일 목록

### 스키마 변경 (Backend)
| 파일 | 역할 | 변경 유형 |
|------|------|----------|
| `backend/app/models/customer.py` | Customer 모델 | **신규** |
| `backend/app/models/application.py` | customer_id 추가 | 수정 |
| `backend/alembic/versions/` | 마이그레이션 | **신규** |

### API 추가 (Backend)
| 파일 | 역할 | 변경 유형 |
|------|------|----------|
| `backend/app/api/v1/endpoints/admin/customers.py` | 고객 CRUD | **신규** |
| `backend/app/api/v1/endpoints/admin/partners.py` | 배정 이력 API | 수정 |
| `backend/app/schemas/customer.py` | 고객 스키마 | **신규** |

### 관리자 UI (Frontend)
| 파일 | 역할 | 변경 유형 |
|------|------|----------|
| `frontend/src/app/(admin)/admin/customers/` | 고객 목록 | **신규** |
| `frontend/src/app/(admin)/admin/customers/[id]/` | 고객 상세 | **신규** |
| `frontend/src/components/features/admin/partner-detail/` | 배정 이력 탭 | 수정 |
| `frontend/src/lib/api/admin/customers.ts` | 고객 API | **신규** |

---

## 7. 구현 로드맵 (Option B 기준)

### Week 1: 스키마 및 마이그레이션
- [ ] Customer 모델 정의
- [ ] 마이그레이션 파일 작성
- [ ] 기존 데이터 → customers 이관 스크립트
- [ ] applications.customer_id 백필

### Week 2: Backend API
- [ ] 고객 CRUD API (/admin/customers)
- [ ] 고객 검색/필터 API
- [ ] 협력사 배정 이력 API (/admin/partners/{id}/assignments)
- [ ] 기존 고객 이력 API 수정 (customer_id 기반)

### Week 3: Frontend UI
- [ ] 고객 목록 페이지
- [ ] 고객 상세 페이지 (프로필 + 신청 이력)
- [ ] 협력사 상세 - 배정 이력 탭
- [ ] 신청 상세 - 고객 연결 UI 개선

### Week 4: 테스트 및 안정화
- [ ] 마이그레이션 검증
- [ ] API 테스트
- [ ] UI/UX 테스트
- [ ] 기존 기능 회귀 테스트

---

*분석일: 2025-12-30*
*관점: 관리자 중심 고객/협력사 단위 관리*
*분석자: DB 엔지니어, 백엔드 개발자, 프론트엔드 개발자, UX/UI 전문가 종합*
