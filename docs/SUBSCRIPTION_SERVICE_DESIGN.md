# 구독/정기 서비스 모델 확장 설계 문서

> **작성일**: 2025-12-30
> **상태**: 설계 문서 (구현은 추후 진행)
> **권장 방안**: Option C - Assignment 재활용형 (기존 신청 상세에서 회차 관리)

## 요약

### 핵심 요구사항
- 구독 서비스는 **기존 서비스 중 하나** (별도 페이지 X)
- **기존 신청 상세 페이지**에서 회차별 일정 관리
- 정기관리 서비스(`regular_management_*`) 선택 시 자동 인식
- 관리자가 구독 설정 및 회차 관리

---

## 1. 현재 시스템 분석

### 1.1 현재 구현 상태
| 항목 | 상태 | 설명 |
|------|:----:|------|
| 서비스 모델 | 단건 | 모든 신청은 1회성으로 처리 |
| 정기 관리 서비스 | 타입만 존재 | `regular_management_*` 서비스 타입만 있고 반복 기능 없음 |
| 결제 | 현장 결제 | 온라인 결제 미지원 (Out of Scope) |
| 시공 사진 | 구현됨 | `work_photos_before/after` 필드 |

### 1.2 현재 데이터 흐름
```
고객 신청 (Application)
  → 관리자 상담 (consulting)
  → 협력사 배정 (Assignment 생성)
  → 일정 확정 (scheduled_date)
  → 시공 완료 (completed)
```

### 1.3 확장 필요 사항
- 구독 여부 자동 인식 (정기관리 서비스 선택 시)
- 구독 설정 관리 (주기, 기간, 상태)
- 회차별 일정 관리 (기존 신청 상세에서)
- 회차별 시공 기록 관리 (사진, 비용)

---

## 2. 설계 선택지 비교

### Option A: Application 확장형 (최소 변경)
기존 Application 모델에 구독 필드 추가, 회차는 별도 모델

| 항목 | 점수 | 근거 |
|------|:----:|------|
| 구현 복잡도 | 4/10 | Application 필드 추가 + 회차 모델 신규 |
| 사용자 편의성 | 7/10 | 기존 신청 상세에서 회차 관리 가능 |
| 정합성 | 6/10 | 단건/구독 구분 필요, 상태 분기 |
| 개발 효율성 | 7/10 | 기존 UI 재사용, 중간 속도 |
| **총점** | **24/40** | |

### Option B: Subscription 독립 모델 (별도 페이지)
별도의 Subscription + SubscriptionSchedule 모델 추가

| 항목 | 점수 | 근거 |
|------|:----:|------|
| 구현 복잡도 | 6/10 | 신규 모델 2개, API/페이지 추가 필요 |
| 사용자 편의성 | 8/10 | 전용 UI, 회차별 이력 명확 |
| 정합성 | 9/10 | 단건/구독 완전 분리 |
| 개발 효율성 | 5/10 | 초기 투자 높음 |
| **총점** | **28/40** | **별도 페이지 요구 시 권장** |

### Option C: Assignment 재활용형 (권장)
기존 Assignment 모델에 회차 번호 추가, Application에 구독 설정 추가

| 항목 | 점수 | 근거 |
|------|:----:|------|
| 구현 복잡도 | 3/10 | 기존 모델 필드 추가만, 신규 모델 없음 |
| 사용자 편의성 | 8/10 | 기존 신청 상세에서 통합 관리, 회차 표시 |
| 정합성 | 7/10 | Assignment가 회차 역할도 수행 (명확한 역할 부여) |
| 개발 효율성 | 9/10 | 기존 API/컴포넌트 최대 재활용 |
| **총점** | **27/40** | **요구사항에 가장 적합** |

---

## 3. 권장 방안: Option C 상세 설계

### 3.1 설계 개념

**핵심 아이디어**: 기존 모델 확장으로 신규 모델 없이 구독 기능 구현

```
Application (구독 설정 추가)
  └── Assignment (회차 번호 추가)
       ├── 1회차: 2025-01-15, 완료
       ├── 2회차: 2025-02-15, 완료
       ├── 3회차: 2025-03-15, 예정
       └── ...
```

### 3.2 데이터 모델 변경

#### Application 모델 확장
```python
class Application(Base):
    # ... 기존 필드 유지 ...

    # === 구독 관련 필드 추가 ===

    # 구독 여부 (정기관리 서비스 선택 시 True)
    is_subscription = Column(Boolean, default=False)

    # 구독 주기: weekly/biweekly/monthly/quarterly/seasonal
    subscription_cycle = Column(String(20), nullable=True)

    # 구독 상태: active/paused/cancelled (구독인 경우만)
    subscription_status = Column(String(20), nullable=True)

    # 구독 기간 (null이면 무기한)
    subscription_start_date = Column(Date, nullable=True)
    subscription_end_date = Column(Date, nullable=True)

    # 일시정지/해지 시각
    subscription_paused_at = Column(DateTime(timezone=True), nullable=True)
    subscription_cancelled_at = Column(DateTime(timezone=True), nullable=True)
```

#### Assignment 모델 확장
```python
class ApplicationPartnerAssignment(Base):
    # ... 기존 필드 유지 ...

    # === 구독 회차 관련 필드 추가 ===

    # 회차 번호 (구독인 경우만, null이면 단건)
    sequence_number = Column(Integer, nullable=True)

    # 자동 생성 여부 (자동 생성 버튼으로 생성된 회차)
    is_auto_generated = Column(Boolean, default=False)
```

### 3.3 구독 인식 로직

```python
# 정기관리 서비스 코드 패턴
SUBSCRIPTION_SERVICE_PREFIXES = [
    "regular_management_basic",
    "regular_management_standard",
    "regular_management_premium",
]

def is_subscription_application(selected_services: list[str]) -> bool:
    """선택된 서비스 중 정기관리 서비스가 있는지 확인"""
    return any(
        service.startswith(prefix)
        for service in selected_services
        for prefix in SUBSCRIPTION_SERVICE_PREFIXES
    )
```

### 3.4 구독 주기 설정
```python
from datetime import timedelta
from dateutil.relativedelta import relativedelta

CYCLE_INTERVALS = {
    "weekly": timedelta(weeks=1),        # 주간
    "biweekly": timedelta(weeks=2),      # 격주
    "monthly": relativedelta(months=1),   # 월간
    "quarterly": relativedelta(months=3), # 분기별
    "seasonal": relativedelta(months=4),  # 계절별
}

CYCLE_LABELS = {
    "weekly": "주간 (매주)",
    "biweekly": "격주 (2주마다)",
    "monthly": "월간 (매월)",
    "quarterly": "분기별 (3개월마다)",
    "seasonal": "계절별 (4개월마다)",
}
```

### 3.5 워크플로우

#### 신청 → 구독 전환 플로우
```
1. 고객이 정기관리 서비스 선택하여 신청
   → is_subscription = True 자동 설정

2. 관리자가 상담 후 구독 설정
   → subscription_cycle 설정 (예: monthly)
   → subscription_start_date 설정
   → subscription_status = "active"

3. 협력사 배정 시 1회차 생성
   → Assignment 생성 with sequence_number = 1

4. 추가 회차 관리
   → 수동: 관리자가 Assignment 추가 (sequence_number = 2, 3, ...)
   → 자동: "다음 N회차 생성" 버튼 클릭
```

#### 회차 자동 생성 로직
```python
def generate_next_schedules(
    application: Application,
    count: int = 3,
    partner_id: int = None,
) -> list[ApplicationPartnerAssignment]:
    """다음 N개 회차 자동 생성"""

    # 마지막 회차 조회
    last_assignment = get_last_assignment(application.id)
    last_seq = last_assignment.sequence_number if last_assignment else 0
    last_date = last_assignment.scheduled_date if last_assignment else application.subscription_start_date

    interval = CYCLE_INTERVALS.get(application.subscription_cycle)
    assignments = []

    for i in range(1, count + 1):
        next_date = last_date + (interval * i)

        # 종료일 체크
        if application.subscription_end_date and next_date > application.subscription_end_date:
            break

        assignment = ApplicationPartnerAssignment(
            application_id=application.id,
            partner_id=partner_id or application.assigned_partner_id,
            sequence_number=last_seq + i,
            scheduled_date=next_date,
            status="pending",
            is_auto_generated=True,
        )
        assignments.append(assignment)

    return assignments
```

### 3.6 API 변경사항

#### 기존 API 확장
| 엔드포인트 | 변경 내용 |
|-----------|----------|
| `GET /api/v1/admin/applications` | `is_subscription` 필터 추가 |
| `GET /api/v1/admin/applications/{id}` | 구독 설정 + 회차 목록 포함 |
| `PATCH /api/v1/admin/applications/{id}` | 구독 설정 변경 지원 |

#### 신규 API 추가
| 엔드포인트 | 메서드 | 설명 |
|-----------|:------:|------|
| `/api/v1/admin/applications/{id}/subscription` | PATCH | 구독 설정 변경 |
| `/api/v1/admin/applications/{id}/subscription/pause` | POST | 일시정지 |
| `/api/v1/admin/applications/{id}/subscription/resume` | POST | 재개 |
| `/api/v1/admin/applications/{id}/subscription/cancel` | POST | 해지 |
| `/api/v1/admin/applications/{id}/generate-schedules` | POST | 회차 자동 생성 |

#### 고객용 API (토큰 인증)
| 엔드포인트 | 메서드 | 설명 |
|-----------|:------:|------|
| `/api/v1/applications/subscription/{token}` | GET | 구독 현황 조회 |

### 3.7 프론트엔드 구조

#### 기존 페이지 확장 (신규 페이지 없음)
```
app/(admin)/admin/applications/[id]/page.tsx
└── 신청 상세 페이지 확장
    ├── 기존: 고객정보, 서비스정보, 배정관리
    └── 추가: [구독인 경우] 구독 설정 섹션 + 회차 관리 섹션
```

#### 신규 컴포넌트
```
components/features/admin/applications/
├── ... 기존 컴포넌트 ...
├── SubscriptionSettings.tsx      # 구독 설정 카드 (주기, 기간, 상태)
├── SubscriptionScheduleList.tsx  # 회차 목록 (타임라인 뷰)
├── SubscriptionScheduleCard.tsx  # 개별 회차 카드
├── GenerateSchedulesModal.tsx    # 자동 생성 모달
└── SubscriptionStatusActions.tsx # 일시정지/재개/해지 버튼
```

#### 고객용 페이지 (신규)
```
app/(front)/subscription/[token]/page.tsx
└── 구독 현황 조회 페이지
    ├── 다음 방문 예정 카드
    ├── 완료된 회차 갤러리 (시공 전/후 사진)
    └── 일정 변경 요청 버튼
```

### 3.8 캘린더 확장

기존 `useSchedule.tsx` 훅에서 구독 회차 구분 표시:

```typescript
interface ScheduleItem {
  // 기존 필드...

  // 구독 관련 추가
  is_subscription?: boolean;
  sequence_number?: number;
}

// 캘린더에서 구독 일정 시각적 구분
const getScheduleBadge = (item: ScheduleItem) => {
  if (item.is_subscription) {
    return `${item.sequence_number}회차`;  // 예: "3회차"
  }
  return null;
};
```

---

## 4. 관점별 핵심 고려사항

### 4.1 UX/UI 전문가
- **기존 신청 상세 페이지 확장**: 별도 페이지 없이 통합 관리
- **구독 설정 섹션**: 주기/기간/상태를 명확하게 표시
- **회차 타임라인**: 완료/예정 회차를 시각적으로 구분
- **상태 액션 버튼**: 일시정지/재개/해지 명확한 버튼 제공
- **캘린더 회차 표시**: "3회차" 같은 배지로 구독 일정 구분

### 4.2 프론트엔드 개발자
- 기존 신청 상세 페이지(`/admin/applications/[id]`)에 조건부 렌더링 추가
- 기존 `useApplicationDetail` 훅 확장으로 구독 데이터 포함
- 신규 컴포넌트 5개 추가 (SubscriptionSettings, ScheduleList, Card, Modal, Actions)
- TypeScript 타입 확장 (`Application` 타입에 구독 필드 추가)

### 4.3 백엔드 개발자
- Application 모델에 구독 필드 7개 추가
- Assignment 모델에 회차 필드 2개 추가
- 기존 API 확장 (목록 필터, 상세 응답 확장)
- 신규 서비스 함수 (`generate_next_schedules`, `pause/resume/cancel_subscription`)
- 구독 인식 로직 (`is_subscription_application`)

### 4.4 DB 엔지니어
- 마이그레이션: Application 테이블 컬럼 7개 추가
- 마이그레이션: Assignment 테이블 컬럼 2개 추가
- 인덱스: `idx_applications_is_subscription` 추가
- 인덱스: `idx_assignments_sequence` 추가 (복합: application_id + sequence_number)
- FK 없이 애플리케이션 레벨 무결성 관리 (기존 패턴 유지)

---

## 5. 구현 로드맵 (참고용)

### Phase 1: DB & API (1주)
1. Application/Assignment 모델 필드 추가
2. DB 마이그레이션 작성 및 적용
3. 구독 설정 API (PATCH, pause, resume, cancel)
4. 회차 자동 생성 API (POST generate-schedules)

### Phase 2: 관리자 UI (1주)
1. 신청 상세 페이지에 구독 설정 섹션 추가
2. 회차 목록/관리 UI 추가
3. 회차 자동 생성 모달
4. 캘린더에서 구독 회차 구분 표시

### Phase 3: 고객 UI (0.5주)
1. 고객용 구독 현황 조회 페이지
2. 시공 기록 갤러리 (회차별 before/after 사진)
3. SMS 알림 연동 (다음 방문 예정 안내)

---

## 6. 주요 파일 (구현 시 참조)

### Backend
| 파일 | 변경 내용 |
|------|----------|
| `backend/app/models/application.py` | 구독 필드 7개 추가 |
| `backend/app/models/application_assignment.py` | 회차 필드 2개 추가 |
| `backend/app/schemas/application.py` | 스키마 확장 |
| `backend/app/services/application.py` | 구독 인식 로직 추가 |
| `backend/app/services/subscription.py` | 신규: 회차 생성, 상태 변경 |
| `backend/app/api/v1/endpoints/admin/applications.py` | API 확장 |

### Frontend
| 파일 | 변경 내용 |
|------|----------|
| `frontend/src/lib/api/admin/types.ts` | Application 타입 확장 |
| `frontend/src/lib/api/admin/applications.ts` | API 함수 추가 |
| `frontend/src/app/(admin)/admin/applications/[id]/page.tsx` | 구독 섹션 추가 |
| `frontend/src/components/features/admin/applications/` | 신규 컴포넌트 5개 |
| `frontend/src/hooks/useSchedule.tsx` | 회차 표시 확장 |

### 마이그레이션
| 파일 | 내용 |
|------|------|
| `alembic/versions/YYYYMMDD_add_subscription_fields.py` | 구독 필드 추가 |

---

## 7. 결론

**권장 방안**: Option C (Assignment 재활용형)

| 기준 | 점수 |
|------|:----:|
| 사용자 편의성 (1순위) | 8/10 |
| 정합성 (2순위) | 7/10 |
| 개발 편의성/클린코드 (3순위) | 9/10 |
| **총점** | **27/40** |

**선택 이유**:
1. **기존 UI 통합**: 별도 페이지 없이 신청 상세에서 회차 관리
2. **최소 변경**: 신규 모델 없이 기존 모델 필드 추가만
3. **빠른 구현**: 기존 API/컴포넌트 최대 재활용
4. **자연스러운 흐름**: 구독도 "신청"의 한 종류로 처리

**Trade-off**:
- Assignment가 "배정" + "회차" 이중 역할 (역할 명확성 약간 감소)
- 단건/구독 조건부 로직 증가 (UI/API에서 분기 필요)

---

## 8. UI 와이어프레임 (참고)

### 신청 상세 페이지 (구독인 경우)
```
┌─────────────────────────────────────────────────┐
│ 신청 상세 - 20251230-001                        │
├─────────────────────────────────────────────────┤
│ [고객 정보]                                      │
│ 이름: 홍길동 | 연락처: 010-1234-5678            │
│ 주소: 양평군 ...                                │
├─────────────────────────────────────────────────┤
│ [서비스 정보]                                    │
│ 선택 서비스: 정기관리 STANDARD                   │
│ 요청 내용: ...                                  │
├─────────────────────────────────────────────────┤
│ [구독 설정]                        🏷️ 정기서비스│
│ ┌─────────────────────────────────────────────┐│
│ │ 주기: [월간 ▼]  상태: 🟢 활성               ││
│ │ 시작일: 2025-01-01  종료일: 무기한          ││
│ │ [일시정지] [해지]                           ││
│ └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│ [회차 관리]                 [+ 수동 추가] [⚡ 3회차 자동 생성]│
│ ┌─────────────────────────────────────────────┐│
│ │ 3회차 | 2025-03-01 | 예정    | [수정][삭제]││
│ │ 2회차 | 2025-02-01 | 완료 ✅ | [사진 보기] ││
│ │ 1회차 | 2025-01-01 | 완료 ✅ | [사진 보기] ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 캘린더 (구독 회차 표시)
```
┌─────────────────────────────────────────┐
│        2025년 3월                        │
├────┬────┬────┬────┬────┬────┬────┤
│ 일 │ 월 │ 화 │ 수 │ 목 │ 금 │ 토 │
├────┼────┼────┼────┼────┼────┼────┤
│    │  1 │  2 │  3 │  4 │  5 │  6 │
│    │🔵  │    │    │    │    │    │
│    │3회차│    │    │    │    │    │
├────┼────┼────┼────┼────┼────┼────┤
│  7 │  8 │  9 │ 10 │ 11 │ 12 │ 13 │
│    │    │🟡  │    │    │    │    │
│    │    │단건│    │    │    │    │
└────┴────┴────┴────┴────┴────┴────┘

🔵 구독 회차  🟡 단건 신청
```
