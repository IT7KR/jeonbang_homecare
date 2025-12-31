# API 비동기 처리 개선 계획

> 작성일: 2025-12-31
> 상태: 검토 완료, 실행 대기

## 현재 상황 요약

### 프론트엔드 (6.1/10점)
- TanStack Query **설치됨** but **미사용** (useState/useEffect 수동 관리)
- 캐싱 없음 → 동일 데이터 매번 재요청
- Optimistic Update 없음 → 저장 후 전체 새로고침
- AbortController 미사용 → 메모리 누수 위험

### 백엔드 (심각한 병목)
- **동기 SQLAlchemy 엔진** 사용 → 모든 DB 쿼리 블로킹
- 복호화 작업 동기 블로킹 → 목록 조회 시 N×M회 CPU 집약 연산
- 외부 API(SMS)만 httpx async로 비동기 ✅

---

## 작업량 분석

### 프론트엔드 (총 약 15-20개 파일)

| 단계 | 파일 수 | 작업 내용 | 난이도 |
|------|---------|----------|--------|
| 1. QueryProvider 강화 | 1 | devtools, 캐시 설정 | 🟢 쉬움 |
| 2. useSMS 마이그레이션 | 1 | useQuery/useMutation 적용 | 🟢 쉬움 |
| 3. useApplications 마이그레이션 | 1 | 필터/페이징 쿼리키 설계 | 🟡 보통 |
| 4. useApplicationDetail 마이그레이션 | 1 | 복잡한 상태 → React Query | 🔴 어려움 |
| 5. usePartners, useSchedule 등 | 3-4 | 패턴 적용 | 🟡 보통 |
| 6. API 클라이언트 개선 | 1 | AbortController, 재시도 | 🟡 보통 |
| 7. Optimistic Update 적용 | 2-3 | 배정, SMS 재발송 등 | 🟡 보통 |

**예상 총 작업량**: 파일 10-15개 수정, 작은 규모의 점진적 변경

### 백엔드 (총 약 25-30개 파일)

| 단계 | 파일 수 | 작업 내용 | 난이도 | 위험도 |
|------|---------|----------|--------|--------|
| 1. AsyncSession 설정 | 2 | database.py, deps.py | 🟢 쉬움 | 🔴 높음 |
| 2. CRUD 함수 async 전환 | 8-10 | 모든 db.query() → await | 🔴 어려움 | 🔴 높음 |
| 3. 엔드포인트 async 전환 | 15-20 | 모든 라우터 함수 | 🟡 보통 | 🟠 중간 |
| 4. 복호화 최적화 | 3-4 | run_in_executor 적용 | 🟡 보통 | 🟢 낮음 |
| 5. 배경 작업 개선 | 2 | background.py 재설계 | 🟡 보통 | 🟢 낮음 |

**예상 총 작업량**: 파일 25-30개 수정, 대규모 구조 변경 필요

---

## 권장 우선순위

### 즉시 효과 (프론트엔드 우선) - 권장
프론트엔드는 **위험도 낮음 + 효과 즉시 체감**

```
프론트엔드 TanStack Query 마이그레이션
  - 사용자 체감 개선: 로딩 속도, 캐싱, 재시도
  - 코드 복잡도 감소: useState 30개 → useQuery 3개
```

### 근본 해결 (백엔드 후순위)
백엔드는 **위험도 높음 + 테스트 필요**

```
백엔드 비동기 전환
  - 모든 CRUD 함수 수정 필요
  - 기존 코드 대부분 영향받음
  - 충분한 테스트 기간 필요
```

---

## 단계별 실행 계획

### Phase 1: 프론트엔드 즉시 개선 (권장)

#### Step 1.1: QueryProvider 강화
```
파일: frontend/src/components/providers/QueryProvider.tsx
작업: devtools 추가, 캐시 설정 최적화
```

#### Step 1.2: useSMS 마이그레이션 (시범 적용)
```
파일: frontend/src/hooks/useSMS.tsx
작업:
  - useState → useQuery (로그, 통계)
  - 액션 함수 → useMutation (발송, 재발송)
  - 캐시 무효화 전략 설계
```

#### Step 1.3: useApplications 마이그레이션
```
파일: frontend/src/hooks/useApplications.tsx
작업:
  - 필터/페이징 쿼리키 설계
  - 의존성 배열 11개 → queryKey로 통합
```

#### Step 1.4: useApplicationDetail 마이그레이션
```
파일: frontend/src/hooks/useApplicationDetail.tsx
작업:
  - 상태 35개 → useQuery 분리
  - 배정 저장 시 Optimistic Update
```

### Phase 2: 백엔드 비동기 전환 (신중히)

#### Step 2.1: 비동기 DB 설정
```
파일: backend/app/db/database.py, backend/app/api/deps.py
작업:
  - create_async_engine 도입
  - async_sessionmaker 설정
  - get_async_db 의존성 추가
```

#### Step 2.2: CRUD 함수 async 전환
```
파일: backend/app/crud/*.py (8-10개)
작업:
  - db.query() → select() + await db.execute()
  - db.add() → db.add() + await db.commit()
  - 모든 함수에 async 키워드 추가
```

#### Step 2.3: 엔드포인트 async 전환
```
파일: backend/app/api/v1/endpoints/**/*.py (15-20개)
작업:
  - def → async def
  - CRUD 호출에 await 추가
```

#### Step 2.4: 복호화 최적화
```
파일: backend/app/utils/encryption.py, 관련 엔드포인트
작업:
  - run_in_executor로 CPU 작업 오프로드
  - 또는 목록 조회 시 필요한 필드만 복호화
```

---

## 수정 대상 파일 목록

### 프론트엔드
- `frontend/src/components/providers/QueryProvider.tsx`
- `frontend/src/hooks/useSMS.tsx`
- `frontend/src/hooks/useApplications.tsx`
- `frontend/src/hooks/useApplicationDetail.tsx`
- `frontend/src/hooks/usePartners.tsx`
- `frontend/src/hooks/usePartnerDetail.tsx`
- `frontend/src/hooks/useSchedule.tsx`
- `frontend/src/lib/api/client.ts`

### 백엔드
- `backend/app/db/database.py`
- `backend/app/api/deps.py`
- `backend/app/crud/*.py` (8-10개)
- `backend/app/api/v1/endpoints/**/*.py` (15-20개)
