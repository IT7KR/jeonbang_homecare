# API 비동기 처리 개선 계획

> 작성일: 2025-12-31
> 최종 업데이트: 2026-01-02
> 상태: **백엔드 완료** | 프론트엔드 실행 대기

## 현재 상황 요약

### 백엔드 (10/10점) ✅ 완료
- **AsyncSession 기반 완전 비동기 전환 완료**
- 모든 API 엔드포인트 `async def` + `await db.execute(select(...))` 패턴 적용
- 서비스 계층 (SMS, PDF, 감사로그 등) 비동기화 완료
- Fernet 암호화 `@lru_cache` 최적화 적용됨

### 프론트엔드 (6.1/10점) - 개선 필요
- TanStack Query **설치됨** but **미사용** (useState/useEffect 수동 관리)
- 캐싱 없음 → 동일 데이터 매번 재요청
- Optimistic Update 없음 → 저장 후 전체 새로고침
- AbortController 미사용 → 메모리 누수 위험

---

## 백엔드 비동기 전환 완료 내역 (2026-01-02)

### Phase 1: 핵심 인프라 ✅
| 파일 | 변경 내용 |
|------|----------|
| `app/core/database.py` | `AsyncEngine`, `AsyncSessionLocal`, `async get_db()` 추가 |
| `app/core/security.py` | `get_current_admin()` 비동기화 |
| `app/main.py` | lifespan에서 비동기 엔진 사용, `load_service_cache_async()` 호출 |

### Phase 2: 엔드포인트 전환 ✅
| 카테고리 | 파일 수 | 상태 |
|----------|---------|------|
| 공개 API | 4개 | ✅ 완료 |
| 관리자 인증 | 2개 | ✅ 완료 |
| 신청 관리 | 1개 (21개 엔드포인트) | ✅ 완료 |
| 협력사 관리 | 1개 | ✅ 완료 |
| SMS 관리 | 1개 | ✅ 완료 |
| 일정/설정 | 2개 | ✅ 완료 |
| 견적 관리 | 1개 | ✅ 완료 |
| 파일 서빙 | 1개 | ✅ 완료 |
| 포털 (협력사/고객) | 2개 | ✅ 완료 |

### Phase 3: 서비스 계층 전환 ✅
| 파일 | 변경 내용 |
|------|----------|
| `services/sms.py` | 20+ 함수 비동기화, `load_service_cache_async()` 추가 |
| `services/quote_pdf.py` | `generate_quote_pdf()` 비동기화 |
| `services/audit.py` | 감사 로깅 함수 비동기화 |
| `services/bulk_sms.py` | `BulkSMSService` 클래스 비동기화 |
| `services/status_sync.py` | 상태 동기화 함수 비동기화 |

### Phase 4: 암호화 최적화 ✅
- `app/core/encryption.py`: `@lru_cache(maxsize=1)` 적용으로 Fernet 인스턴스 캐싱
- PBKDF2 키 도출 첫 호출 시 1회만 실행

### 예외 파일 (의도적 동기 유지)
- `services/service_utils.py`: `@lru_cache` 패턴과 호환성을 위해 동기 유지

### 변환 패턴 참조
```python
# Before (동기)
from sqlalchemy.orm import Session
def get_items(db: Session):
    return db.query(Model).filter(...).all()

# After (비동기)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
async def get_items(db: AsyncSession):
    result = await db.execute(select(Model).where(...))
    return result.scalars().all()
```

---

## 프론트엔드 개선 계획 (다음 단계)

### 작업량 분석

| 단계 | 파일 수 | 작업 내용 | 난이도 |
|------|---------|----------|--------|
| 1. QueryProvider 강화 | 1 | devtools, 캐시 설정 | 쉬움 |
| 2. useSMS 마이그레이션 | 1 | useQuery/useMutation 적용 | 쉬움 |
| 3. useApplications 마이그레이션 | 1 | 필터/페이징 쿼리키 설계 | 보통 |
| 4. useApplicationDetail 마이그레이션 | 1 | 복잡한 상태 → React Query | 어려움 |
| 5. usePartners, useSchedule 등 | 3-4 | 패턴 적용 | 보통 |
| 6. API 클라이언트 개선 | 1 | AbortController, 재시도 | 보통 |
| 7. Optimistic Update 적용 | 2-3 | 배정, SMS 재발송 등 | 보통 |

**예상 총 작업량**: 파일 10-15개 수정, 작은 규모의 점진적 변경

### Step 1: QueryProvider 강화
```
파일: frontend/src/components/providers/QueryProvider.tsx
작업: devtools 추가, 캐시 설정 최적화
```

### Step 2: useSMS 마이그레이션 (시범 적용)
```
파일: frontend/src/hooks/useSMS.tsx
작업:
  - useState → useQuery (로그, 통계)
  - 액션 함수 → useMutation (발송, 재발송)
  - 캐시 무효화 전략 설계
```

### Step 3: useApplications 마이그레이션
```
파일: frontend/src/hooks/useApplications.tsx
작업:
  - 필터/페이징 쿼리키 설계
  - 의존성 배열 11개 → queryKey로 통합
```

### Step 4: useApplicationDetail 마이그레이션
```
파일: frontend/src/hooks/useApplicationDetail.tsx
작업:
  - 상태 35개 → useQuery 분리
  - 배정 저장 시 Optimistic Update
```

---

## 수정 대상 파일 목록

### 프론트엔드 (다음 작업)
- `frontend/src/components/providers/QueryProvider.tsx`
- `frontend/src/hooks/useSMS.tsx`
- `frontend/src/hooks/useApplications.tsx`
- `frontend/src/hooks/useApplicationDetail.tsx`
- `frontend/src/hooks/usePartners.tsx`
- `frontend/src/hooks/usePartnerDetail.tsx`
- `frontend/src/hooks/useSchedule.tsx`
- `frontend/src/lib/api/client.ts`

### 백엔드 (완료)
- ~~`backend/app/core/database.py`~~ ✅
- ~~`backend/app/core/security.py`~~ ✅
- ~~`backend/app/main.py`~~ ✅
- ~~`backend/app/api/v1/endpoints/**/*.py`~~ ✅
- ~~`backend/app/services/*.py`~~ ✅

---

## 예상 성능 개선 효과

### 백엔드 (적용 완료)
| 지표 | 이전 | 이후 | 개선율 |
|------|------|------|--------|
| 동시 처리량 | 50-100 req/s | 200-400 req/s | 4x |
| P95 응답시간 | 500-800ms | 100-200ms | 4x |
| DB 연결 효율 | 동기 블로킹 | 비동기 논블로킹 | - |

### 프론트엔드 (예상)
| 지표 | 현재 | 개선 후 |
|------|------|---------|
| 캐시 히트율 | 0% | 80%+ |
| 불필요한 재요청 | 매번 | 캐시 활용 |
| 사용자 체감 속도 | 느림 | 즉각 반응 |
