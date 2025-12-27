# SMS 복수 발송 기능 구현 계획서

> 작성일: 2025-12-02
> 최종 업데이트: 2025-12-27
> **상태: 향후 구현 예정 (미구현)**
>
> 이 문서는 향후 구현할 SMS 복수 발송 기능에 대한 상세 계획서입니다.
> 현재는 단일 SMS 발송 기능만 지원됩니다.

---

## 1. 개요

### 1.1 배경

관리자로부터 "복수의 인원(고객, 협력사)에게 문자 발송이 가능한지" 문의가 접수되었습니다. 현재 시스템은 **단일 수신자 기반**으로만 SMS 발송이 가능하여, 공지사항이나 일괄 안내 발송이 불가능한 상태입니다.

### 1.2 요구사항

| 구분 | 요구사항 |
|------|----------|
| 발송 시나리오 | 공지/안내 발송, 상태별 일괄 발송, 선택 발송 |
| 발송 대상 | 고객(신청자) + 협력사 모두 |
| 발송 규모 | 50명 이상 대규모 발송 |
| 구현 방식 | 비동기 Job 기반 (안정성 우선) |
| UI 접근점 | SMS 페이지 + 신청/협력사 목록 페이지 통합 |

### 1.3 결정된 구현 방향

- **비동기 Job 방식**: 백그라운드 처리로 타임아웃 방지, 진행 상황 추적 가능
- **기존 페이지 통합**: SMS 페이지뿐 아니라 신청/협력사 목록에서도 선택 후 발송 가능

---

## 2. 현재 상태 분석

### 2.1 현재 SMS 발송 기능 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                     현재 SMS 발송 흐름                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [관리자]                                                       │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────┐                                        │
│  │ SMS 관리 페이지     │                                        │
│  │ (admin/sms/page.tsx)│                                        │
│  └─────────────────────┘                                        │
│     │                                                           │
│     │ 단일 번호 입력 + 메시지                                   │
│     ▼                                                           │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │ POST /admin/sms/send│───▶│ send_sms_direct()   │             │
│  │ (단일 수신자)       │    │ (sms.py)            │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                    │                            │
│                                    ▼                            │
│                             ┌─────────────────┐                 │
│                             │ Aligo API       │                 │
│                             │ (단일 발송)     │                 │
│                             └─────────────────┘                 │
│                                    │                            │
│                                    ▼                            │
│                             ┌─────────────────┐                 │
│                             │ SMSLog 기록     │                 │
│                             │ (1건)           │                 │
│                             └─────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 현재 관련 파일 상세

#### Backend 파일

| 파일 경로 | 역할 | 현재 상태 |
|-----------|------|-----------|
| `backend/app/models/sms_log.py` | SMS 발송 로그 모델 | 단일 발송 로그만 기록 |
| `backend/app/services/sms.py` | SMS 발송 서비스 | `send_sms_direct()` 단일 발송만 |
| `backend/app/api/v1/endpoints/admin/sms.py` | SMS API 엔드포인트 | `/send` 단일 발송만 |
| `backend/app/schemas/sms_log.py` | SMS 스키마 | 단일 수신자 요청만 |

#### Frontend 파일

| 파일 경로 | 역할 | 현재 상태 |
|-----------|------|-----------|
| `frontend/src/app/(admin)/admin/sms/page.tsx` | SMS 관리 페이지 | 단일 발송 모달만 |
| `frontend/src/lib/api/admin/sms.ts` | SMS API 함수 | `sendSMS()` 단일 발송만 |
| `frontend/src/lib/api/admin/types.ts` | API 타입 정의 | 단일 발송 타입만 |

### 2.3 현재 코드 상세 분석

#### 2.3.1 SMSLog 모델 (`backend/app/models/sms_log.py`)

```python
class SMSLog(Base):
    __tablename__ = "sms_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 발송 정보
    receiver_phone = Column(String(500), nullable=False)  # 수신자 (암호화)
    message = Column(Text, nullable=False)

    # 발송 유형
    sms_type = Column(String(50), nullable=False)  # application_new, partner_new, manual 등

    # 관련 데이터 참조
    reference_type = Column(String(50), nullable=True)  # application, partner
    reference_id = Column(BigInteger, nullable=True)

    # 발송 상태
    status = Column(String(20), nullable=False, default="pending", index=True)

    # 알리고 API 응답
    result_code = Column(String(20), nullable=True)
    result_message = Column(String(500), nullable=True)
    msg_id = Column(String(100), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
```

**분석**:
- 개별 SMS 발송 로그 기록용
- 복수 발송 시 Job 참조 필드 없음
- 배치 정보 없음

#### 2.3.2 SMS 발송 서비스 (`backend/app/services/sms.py`)

```python
async def send_sms_direct(
    receiver: str,                    # 단일 수신자만
    message: str,
    sms_type: str = "manual",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    db: Optional[Session] = None,
) -> dict:
    """SMS 발송 + DB 로그 기록"""
    # 1. Aligo API 호출 (단일)
    # 2. SMSLog 생성 (1건)
    # 3. 결과 반환
```

**분석**:
- `receiver: str` - 단일 수신자만 처리
- 루프 처리 로직 없음
- 배치 처리 미지원

#### 2.3.3 SMS API 엔드포인트 (`backend/app/api/v1/endpoints/admin/sms.py`)

```python
@router.post("/send", response_model=SMSSendResponse)
async def send_manual_sms(
    data: SMSSendRequest,  # receiver_phone: str (단일)
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    result = await send_sms_direct(
        receiver=data.receiver_phone,  # 단일값
        message=data.message,
        sms_type=data.sms_type,
        db=db,
    )
```

**분석**:
- 단일 발송 엔드포인트만 존재
- 복수 발송 엔드포인트 없음
- 수신자 목록 조회 API 없음

#### 2.3.4 Frontend SMS 페이지 (`frontend/src/app/(admin)/admin/sms/page.tsx`)

```typescript
// 발송 모달 - 단일 번호 입력만
<input
  type="tel"
  value={sendPhone}  // 단일 번호
  placeholder="010-1234-5678"
/>

// 발송 함수
const handleSendSMS = async (e: React.FormEvent) => {
  const result = await sendSMS(token, {
    receiver_phone: sendPhone,  // 단일
    message: sendMessage,
    sms_type: "manual",
  });
};
```

**분석**:
- 단일 번호 입력 필드만 존재
- 수신자 선택 UI 없음
- 복수 발송 버튼 없음

### 2.4 현재 기능 요약 테이블

| 기능 | 현재 상태 | 비고 |
|------|-----------|------|
| 단일 수동 발송 | ✅ 지원 | 관리자가 번호 직접 입력 |
| 자동 알림 발송 | ✅ 지원 | 신청/협력사 등록 시 자동 발송 |
| 발송 내역 조회 | ✅ 지원 | 페이지네이션, 필터링 |
| 실패 건 재발송 | ✅ 지원 | 개별 재발송 |
| **복수 수동 발송** | ❌ 미지원 | 구현 필요 |
| **수신자 목록 선택** | ❌ 미지원 | 구현 필요 |
| **발송 진행 상황 표시** | ❌ 미지원 | 구현 필요 |

---

## 3. 구현 계획 상세

### 3.1 전체 아키텍처 (목표)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SMS 복수 발송 아키텍처 (목표)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ SMS 관리 페이지 │  │ 신청 관리 페이지│  │ 협력사 관리    │              │
│  │ [복수 발송]     │  │ [체크박스 선택] │  │ [체크박스 선택]│              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │ BulkSMSSheet          │                                │
│                    │ (수신자 선택 + 메시지) │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│                                ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │ POST /admin/sms/bulk  │                                │
│                    │ (Job 생성 요청)       │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│         ┌──────────────────────┼──────────────────────┐                     │
│         ▼                      ▼                      ▼                     │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐           │
│  │ 즉시 응답   │     │ BulkSMSJob      │     │ BackgroundTask   │           │
│  │ (job_id)    │     │ 생성 및 저장    │     │ 시작             │           │
│  └─────────────┘     └─────────────────┘     └────────┬────────┘           │
│                                                       │                     │
│                                                       ▼                     │
│                                            ┌─────────────────────┐          │
│                                            │ BulkSMSService      │          │
│                                            │ execute_bulk_send() │          │
│                                            └────────┬────────────┘          │
│                                                     │                       │
│                      ┌──────────────────────────────┼───────────────┐       │
│                      ▼                              ▼               ▼       │
│               ┌────────────┐              ┌────────────┐    ┌────────────┐  │
│               │ Batch 1    │              │ Batch 2    │    │ Batch N    │  │
│               │ (50명)     │              │ (50명)     │    │ (나머지)   │  │
│               └─────┬──────┘              └─────┬──────┘    └─────┬──────┘  │
│                     │                           │                 │         │
│                     ▼                           ▼                 ▼         │
│               ┌────────────┐              ┌────────────┐    ┌────────────┐  │
│               │ 병렬 발송  │              │ 병렬 발송  │    │ 병렬 발송  │  │
│               │ + 로그기록 │              │ + 로그기록 │    │ + 로그기록 │  │
│               └─────┬──────┘              └─────┬──────┘    └─────┬──────┘  │
│                     │                           │                 │         │
│                     └───────────────────────────┴─────────────────┘         │
│                                        │                                    │
│                                        ▼                                    │
│                              ┌─────────────────────┐                        │
│                              │ Job 상태 업데이트   │                        │
│                              │ (completed/failed)  │                        │
│                              └─────────────────────┘                        │
│                                        │                                    │
│                                        ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    Frontend (폴링)                               │        │
│  │  GET /admin/sms/bulk/{job_id} → 진행 상황 표시 → 완료 알림      │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 데이터베이스 변경

#### 3.2.1 신규 테이블: `bulk_sms_jobs`

```sql
CREATE TABLE bulk_sms_jobs (
    id BIGSERIAL PRIMARY KEY,

    -- Job 정보
    job_type VARCHAR(50) NOT NULL,      -- 'announcement', 'status_notify', 'manual_select'
    title VARCHAR(200),                  -- Job 제목 (관리자 식별용)

    -- 발송 대상 설정
    target_type VARCHAR(20) NOT NULL,   -- 'customer', 'partner', 'all'
    target_filter JSONB,                 -- {"status": "new", "region": "양평군"}
    target_ids JSONB,                    -- 선택 발송 시 ID 목록 [1, 2, 3]

    -- 메시지
    message TEXT NOT NULL,

    -- 통계
    total_count INTEGER DEFAULT 0,       -- 전체 수신자 수
    sent_count INTEGER DEFAULT 0,        -- 발송 완료
    failed_count INTEGER DEFAULT 0,      -- 발송 실패

    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending': 대기
    -- 'processing': 처리 중
    -- 'completed': 완료
    -- 'partial_failed': 부분 실패
    -- 'failed': 전체 실패
    -- 'cancelled': 취소

    -- 진행 정보
    current_batch INTEGER DEFAULT 0,
    total_batches INTEGER DEFAULT 0,

    -- 에러 정보
    error_message TEXT,
    failed_recipients JSONB,             -- [{"phone": "5678", "error": "..."}]

    -- 관리자
    created_by BIGINT NOT NULL,          -- Admin.id

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_bulk_sms_jobs_status ON bulk_sms_jobs(status);
CREATE INDEX idx_bulk_sms_jobs_created_by ON bulk_sms_jobs(created_by);
CREATE INDEX idx_bulk_sms_jobs_created_at ON bulk_sms_jobs(created_at DESC);
```

#### 3.2.2 기존 테이블 수정: `sms_logs`

```sql
-- 새 컬럼 추가
ALTER TABLE sms_logs ADD COLUMN bulk_job_id BIGINT;
ALTER TABLE sms_logs ADD COLUMN batch_index INTEGER;

-- 인덱스 추가
CREATE INDEX idx_sms_logs_bulk_job_id ON sms_logs(bulk_job_id);
```

---

## 4. Backend 구현 상세

### 4.1 파일별 구현 내용

#### 4.1.1 신규 파일: `backend/app/models/bulk_sms_job.py`

```python
"""
Bulk SMS Job 모델
대량 SMS 발송 작업 관리

PK: BIGSERIAL as per CLAUDE.md
상태: pending → processing → completed / partial_failed / failed
"""

from sqlalchemy import Column, BigInteger, String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class BulkSMSJob(Base):
    """대량 SMS 발송 작업"""

    __tablename__ = "bulk_sms_jobs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # Job 정보
    job_type = Column(String(50), nullable=False)  # announcement, status_notify, manual_select
    title = Column(String(200), nullable=True)

    # 발송 대상 설정
    target_type = Column(String(20), nullable=False)  # customer, partner, all
    target_filter = Column(JSONB, nullable=True)  # {"status": "new", "region": "양평군"}
    target_ids = Column(JSONB, nullable=True)  # 선택 발송 시 ID 목록

    # 메시지
    message = Column(Text, nullable=False)

    # 통계
    total_count = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)

    # 상태
    status = Column(String(20), nullable=False, default="pending", index=True)

    # 진행 정보
    current_batch = Column(Integer, default=0)
    total_batches = Column(Integer, default=0)

    # 에러 정보
    error_message = Column(Text, nullable=True)
    failed_recipients = Column(JSONB, nullable=True)

    # 관리자
    created_by = Column(BigInteger, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<BulkSMSJob {self.id}: {self.job_type} - {self.status}>"
```

#### 4.1.2 수정 파일: `backend/app/models/sms_log.py`

**추가할 필드:**

```python
# 복수 발송 참조 (기존 필드 아래에 추가)
bulk_job_id = Column(BigInteger, nullable=True, index=True)  # BulkSMSJob.id
batch_index = Column(Integer, nullable=True)  # 배치 번호
```

#### 4.1.3 수정 파일: `backend/app/models/__init__.py`

**추가할 import:**

```python
from app.models.bulk_sms_job import BulkSMSJob

__all__ = [
    # ... 기존 항목
    "BulkSMSJob",
]
```

#### 4.1.4 신규 파일: `backend/app/schemas/bulk_sms.py`

```python
"""
Bulk SMS 스키마
대량 SMS 발송 요청/응답 스키마
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import re


class BulkSMSSendRequest(BaseModel):
    """대량 SMS 발송 요청"""

    job_type: str  # announcement, status_notify, manual_select
    title: Optional[str] = None
    target_type: str  # customer, partner
    target_filter: Optional[dict] = None  # {"status": "new"}
    target_ids: Optional[list[int]] = None  # [1, 2, 3]
    message: str

    @field_validator("job_type")
    @classmethod
    def validate_job_type(cls, v: str) -> str:
        allowed = ["announcement", "status_notify", "manual_select"]
        if v not in allowed:
            raise ValueError(f"job_type은 {allowed} 중 하나여야 합니다")
        return v

    @field_validator("target_type")
    @classmethod
    def validate_target_type(cls, v: str) -> str:
        allowed = ["customer", "partner"]
        if v not in allowed:
            raise ValueError(f"target_type은 {allowed} 중 하나여야 합니다")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("메시지는 필수입니다")
        if len(v) > 2000:
            raise ValueError("메시지는 2000자 이내여야 합니다")
        return v


class BulkSMSJobResponse(BaseModel):
    """대량 SMS Job 생성 응답"""

    job_id: int
    status: str
    message: str


class BulkSMSJobDetailResponse(BaseModel):
    """대량 SMS Job 상세 응답"""

    id: int
    job_type: str
    title: Optional[str]
    target_type: str
    status: str
    total_count: int
    sent_count: int
    failed_count: int
    progress: float  # 0-100%
    current_batch: int
    total_batches: int
    failed_recipients: Optional[list]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class BulkSMSJobListResponse(BaseModel):
    """대량 SMS Job 목록 응답"""

    items: list[BulkSMSJobDetailResponse]
    total: int
    page: int
    page_size: int


class SMSRecipient(BaseModel):
    """SMS 수신자"""

    id: int
    name: str
    phone: str  # 마스킹된 번호 (010-****-5678)
    label: str  # 신청번호 또는 회사명
    type: str  # customer, partner


class SMSRecipientsResponse(BaseModel):
    """SMS 수신자 목록 응답"""

    items: list[SMSRecipient]
    total: int
    page: int
    page_size: int
```

#### 4.1.5 신규 파일: `backend/app/services/bulk_sms.py`

```python
"""
Bulk SMS Service
대량 SMS 발송 서비스

핵심 기능:
- 배치 분할 (50명 단위)
- 비동기 병렬 발송
- 지수 백오프 재시도
- 진행 상황 업데이트
"""

import asyncio
import math
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.bulk_sms_job import BulkSMSJob
from app.models.application import Application
from app.models.partner import Partner
from app.services.sms import send_sms_direct
from app.core.security import decrypt_value

# 설정
BATCH_SIZE = 50  # 배치당 수신자 수
RETRY_ATTEMPTS = 3  # 최대 재시도 횟수
RETRY_DELAY_BASE = 1.0  # 재시도 기본 대기 시간 (초)
BATCH_DELAY = 0.5  # 배치 간 대기 시간 (초)


class BulkSMSService:
    """대량 SMS 발송 서비스"""

    def __init__(self, db: Session):
        self.db = db

    async def execute_bulk_send(self, job_id: int):
        """
        메인 실행 함수 - BackgroundTask에서 호출

        1. Job 시작 상태 업데이트
        2. 수신자 목록 조회
        3. 배치 분할 처리
        4. 완료 상태 업데이트
        """
        job = self.db.query(BulkSMSJob).filter(BulkSMSJob.id == job_id).first()
        if not job:
            return

        try:
            # Job 시작
            job.status = "processing"
            job.started_at = datetime.now(timezone.utc)
            self.db.commit()

            # 수신자 목록 조회
            recipients = self._get_recipients(job)
            job.total_count = len(recipients)
            job.total_batches = math.ceil(len(recipients) / BATCH_SIZE)
            self.db.commit()

            if not recipients:
                job.status = "completed"
                job.completed_at = datetime.now(timezone.utc)
                self.db.commit()
                return

            # 배치 분할 처리
            for batch_index, batch in enumerate(self._chunk(recipients, BATCH_SIZE)):
                await self._process_batch(job, batch, batch_index)
                job.current_batch = batch_index + 1
                self.db.commit()

                # 배치 간 딜레이
                if batch_index < job.total_batches - 1:
                    await asyncio.sleep(BATCH_DELAY)

            # 완료 처리
            job.status = "completed" if job.failed_count == 0 else "partial_failed"
            job.completed_at = datetime.now(timezone.utc)
            self.db.commit()

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            self.db.commit()

    async def _process_batch(self, job: BulkSMSJob, recipients: list, batch_index: int):
        """단일 배치 처리 (병렬 발송)"""
        tasks = []
        for recipient in recipients:
            task = self._send_with_retry(job, recipient, batch_index)
            tasks.append(task)

        # 배치 내 병렬 실행
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 결과 처리
        for recipient, result in zip(recipients, results):
            if isinstance(result, Exception) or not result.get("success"):
                job.failed_count += 1
                if job.failed_recipients is None:
                    job.failed_recipients = []
                job.failed_recipients.append({
                    "phone": recipient["phone"][-4:],  # 마지막 4자리만
                    "name": recipient.get("name", ""),
                    "error": str(result) if isinstance(result, Exception) else result.get("error", "알 수 없는 오류")
                })
            else:
                job.sent_count += 1

    async def _send_with_retry(self, job: BulkSMSJob, recipient: dict, batch_index: int) -> dict:
        """재시도 로직이 포함된 단일 SMS 발송"""
        for attempt in range(RETRY_ATTEMPTS):
            try:
                result = await send_sms_direct(
                    receiver=recipient["phone"],
                    message=job.message,
                    sms_type=f"bulk_{job.job_type}",
                    reference_type="bulk_job",
                    reference_id=job.id,
                    db=self.db,
                    bulk_job_id=job.id,
                    batch_index=batch_index,
                )
                return result

            except Exception as e:
                if attempt < RETRY_ATTEMPTS - 1:
                    delay = RETRY_DELAY_BASE * (2 ** attempt)  # 지수 백오프
                    await asyncio.sleep(delay)
                else:
                    return {"success": False, "error": str(e)}

        return {"success": False, "error": "최대 재시도 횟수 초과"}

    def _get_recipients(self, job: BulkSMSJob) -> list:
        """Job 설정에 따라 수신자 목록 조회"""
        recipients = []

        if job.target_type == "customer":
            recipients = self._query_customers(job)
        elif job.target_type == "partner":
            recipients = self._query_partners(job)

        return recipients

    def _query_customers(self, job: BulkSMSJob) -> list:
        """고객(신청자) 목록 조회"""
        query = self.db.query(Application)

        # 선택 발송
        if job.target_ids:
            query = query.filter(Application.id.in_(job.target_ids))

        # 필터 적용
        if job.target_filter:
            if "status" in job.target_filter:
                query = query.filter(Application.status == job.target_filter["status"])
            # 추가 필터 조건...

        recipients = []
        for app in query.all():
            try:
                phone = decrypt_value(app.customer_phone)
                name = decrypt_value(app.customer_name)
                recipients.append({
                    "type": "customer",
                    "id": app.id,
                    "phone": phone,
                    "name": name,
                    "label": app.application_number,
                })
            except Exception:
                continue

        return recipients

    def _query_partners(self, job: BulkSMSJob) -> list:
        """협력사 목록 조회"""
        query = self.db.query(Partner)

        # 선택 발송
        if job.target_ids:
            query = query.filter(Partner.id.in_(job.target_ids))

        # 필터 적용
        if job.target_filter:
            if "status" in job.target_filter:
                query = query.filter(Partner.status == job.target_filter["status"])

        recipients = []
        for partner in query.all():
            try:
                phone = decrypt_value(partner.contact_phone)
                recipients.append({
                    "type": "partner",
                    "id": partner.id,
                    "phone": phone,
                    "name": partner.company_name,
                    "label": partner.company_name,
                })
            except Exception:
                continue

        return recipients

    def _chunk(self, lst: list, size: int):
        """리스트를 지정 크기로 분할"""
        for i in range(0, len(lst), size):
            yield lst[i:i + size]
```

#### 4.1.6 수정 파일: `backend/app/services/sms.py`

**`send_sms_direct()` 함수 수정:**

```python
async def send_sms_direct(
    receiver: str,
    message: str,
    sms_type: str = "manual",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    db: Optional[Session] = None,
    bulk_job_id: Optional[int] = None,    # 추가
    batch_index: Optional[int] = None,    # 추가
) -> dict:
    """SMS 발송 + DB 로그 기록"""

    # ... 기존 발송 로직 ...

    # SMSLog 생성 시 bulk 필드 추가
    if db:
        log = SMSLog(
            receiver_phone=encrypt_value(receiver),
            message=message,
            sms_type=sms_type,
            reference_type=reference_type,
            reference_id=reference_id,
            bulk_job_id=bulk_job_id,       # 추가
            batch_index=batch_index,        # 추가
            status=status,
            result_code=result_code,
            result_message=result_message,
            msg_id=msg_id,
            sent_at=datetime.now(timezone.utc) if success else None,
        )
        db.add(log)
        db.commit()
```

#### 4.1.7 수정 파일: `backend/app/api/v1/endpoints/admin/sms.py`

**추가할 엔드포인트:**

```python
from fastapi import BackgroundTasks
from app.models.bulk_sms_job import BulkSMSJob
from app.schemas.bulk_sms import (
    BulkSMSSendRequest,
    BulkSMSJobResponse,
    BulkSMSJobDetailResponse,
    BulkSMSJobListResponse,
    SMSRecipient,
    SMSRecipientsResponse,
)
from app.services.bulk_sms import BulkSMSService
from app.services.background import run_async_in_background


# 수신자 목록 조회 (선택 발송용)
@router.get("/recipients", response_model=SMSRecipientsResponse)
def get_sms_recipients(
    target_type: str = Query(..., description="대상 유형: application | partner"),
    status: Optional[str] = Query(None, description="상태 필터"),
    search: Optional[str] = Query(None, description="검색어"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """SMS 발송 대상 목록 조회"""
    recipients = []

    if target_type == "application":
        query = db.query(Application)
        if status:
            query = query.filter(Application.status == status)
        # search 필터 추가...

        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()

        for app in items:
            try:
                phone = decrypt_value(app.customer_phone)
                name = decrypt_value(app.customer_name)
                recipients.append(SMSRecipient(
                    id=app.id,
                    name=name,
                    phone=mask_phone(phone),  # 010-****-5678
                    label=app.application_number,
                    type="customer",
                ))
            except Exception:
                continue

    elif target_type == "partner":
        query = db.query(Partner)
        if status:
            query = query.filter(Partner.status == status)

        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()

        for partner in items:
            try:
                phone = decrypt_value(partner.contact_phone)
                recipients.append(SMSRecipient(
                    id=partner.id,
                    name=partner.company_name,
                    phone=mask_phone(phone),
                    label=partner.company_name,
                    type="partner",
                ))
            except Exception:
                continue

    return SMSRecipientsResponse(
        items=recipients,
        total=total,
        page=page,
        page_size=page_size,
    )


# 복수 발송 Job 생성
@router.post("/bulk", response_model=BulkSMSJobResponse)
async def create_bulk_sms(
    data: BulkSMSSendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """대량 SMS 발송 Job 생성 (비동기)"""

    # Job 생성
    job = BulkSMSJob(
        job_type=data.job_type,
        title=data.title,
        target_type=data.target_type,
        target_filter=data.target_filter,
        target_ids=data.target_ids,
        message=data.message,
        created_by=current_admin.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 백그라운드 실행
    service = BulkSMSService(db)
    background_tasks.add_task(
        run_async_in_background,
        service.execute_bulk_send(job.id)
    )

    return BulkSMSJobResponse(
        job_id=job.id,
        status="pending",
        message="발송이 시작되었습니다. 진행 상황을 확인하세요.",
    )


# Job 상태 조회 (폴링용)
@router.get("/bulk/{job_id}", response_model=BulkSMSJobDetailResponse)
def get_bulk_sms_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """대량 SMS 발송 Job 상태 조회"""
    job = db.query(BulkSMSJob).filter(BulkSMSJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job을 찾을 수 없습니다")

    progress = 0.0
    if job.total_count > 0:
        progress = round((job.sent_count + job.failed_count) / job.total_count * 100, 1)

    return BulkSMSJobDetailResponse(
        id=job.id,
        job_type=job.job_type,
        title=job.title,
        target_type=job.target_type,
        status=job.status,
        total_count=job.total_count,
        sent_count=job.sent_count,
        failed_count=job.failed_count,
        progress=progress,
        current_batch=job.current_batch,
        total_batches=job.total_batches,
        failed_recipients=job.failed_recipients,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


# Job 목록 조회
@router.get("/bulk", response_model=BulkSMSJobListResponse)
def list_bulk_sms_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """대량 SMS 발송 Job 목록 조회"""
    query = db.query(BulkSMSJob).order_by(BulkSMSJob.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return BulkSMSJobListResponse(
        items=[...],  # BulkSMSJobDetailResponse 변환
        total=total,
        page=page,
        page_size=page_size,
    )


# 헬퍼 함수
def mask_phone(phone: str) -> str:
    """전화번호 마스킹 (010-****-5678)"""
    if len(phone) >= 8:
        return phone[:3] + "-****-" + phone[-4:]
    return phone
```

---

## 5. Frontend 구현 상세

### 5.1 파일별 구현 내용

#### 5.1.1 수정 파일: `frontend/src/lib/api/admin/types.ts`

**추가할 타입:**

```typescript
// ==================== Bulk SMS ====================

/** SMS 수신자 */
export interface SMSRecipient {
  id: number;
  name: string;
  phone: string;  // 마스킹된 번호
  label: string;
  type: "customer" | "partner";
}

/** SMS 수신자 목록 응답 */
export interface SMSRecipientsResponse {
  items: SMSRecipient[];
  total: number;
  page: number;
  page_size: number;
}

/** 대량 SMS 발송 요청 */
export interface BulkSMSSendRequest {
  job_type: "announcement" | "status_notify" | "manual_select";
  title?: string;
  target_type: "customer" | "partner";
  target_filter?: Record<string, string>;
  target_ids?: number[];
  message: string;
}

/** 대량 SMS Job 생성 응답 */
export interface BulkSMSJobResponse {
  job_id: number;
  status: string;
  message: string;
}

/** 대량 SMS Job 상세 */
export interface BulkSMSJobDetail {
  id: number;
  job_type: string;
  title?: string;
  target_type: string;
  status: "pending" | "processing" | "completed" | "partial_failed" | "failed" | "cancelled";
  total_count: number;
  sent_count: number;
  failed_count: number;
  progress: number;  // 0-100
  current_batch: number;
  total_batches: number;
  failed_recipients?: Array<{
    phone: string;
    name: string;
    error: string;
  }>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/** 대량 SMS Job 목록 응답 */
export interface BulkSMSJobListResponse {
  items: BulkSMSJobDetail[];
  total: number;
  page: number;
  page_size: number;
}
```

#### 5.1.2 수정 파일: `frontend/src/lib/api/admin/sms.ts`

**추가할 함수:**

```typescript
import type {
  SMSRecipientsResponse,
  BulkSMSSendRequest,
  BulkSMSJobResponse,
  BulkSMSJobDetail,
  BulkSMSJobListResponse,
} from "./types";

/**
 * SMS 수신자 목록 조회
 */
export async function getSMSRecipients(
  token: string,
  params: {
    target_type: "application" | "partner";
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }
): Promise<SMSRecipientsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("target_type", params.target_type);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.page_size) searchParams.set("page_size", params.page_size.toString());

  return fetchWithAuth<SMSRecipientsResponse>(
    `/admin/sms/recipients?${searchParams.toString()}`,
    token
  );
}

/**
 * 대량 SMS 발송 Job 생성
 */
export async function createBulkSMS(
  token: string,
  data: BulkSMSSendRequest
): Promise<BulkSMSJobResponse> {
  return fetchWithAuth<BulkSMSJobResponse>("/admin/sms/bulk", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 대량 SMS Job 상태 조회
 */
export async function getBulkSMSJob(
  token: string,
  jobId: number
): Promise<BulkSMSJobDetail> {
  return fetchWithAuth<BulkSMSJobDetail>(`/admin/sms/bulk/${jobId}`, token);
}

/**
 * 대량 SMS Job 목록 조회
 */
export async function getBulkSMSJobs(
  token: string,
  params?: { page?: number; page_size?: number }
): Promise<BulkSMSJobListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size) searchParams.set("page_size", params.page_size.toString());

  const query = searchParams.toString();
  return fetchWithAuth<BulkSMSJobListResponse>(
    `/admin/sms/bulk${query ? `?${query}` : ""}`,
    token
  );
}
```

#### 5.1.3 신규 컴포넌트 디렉토리 구조

```
frontend/src/components/sms/
├── index.ts                    # 모듈 export
├── BulkSMSSheet.tsx           # 복수 발송 메인 패널
├── RecipientSelector.tsx      # 수신자 선택 (탭, 필터)
├── RecipientTable.tsx         # 체크박스 테이블
├── MessageComposer.tsx        # 메시지 작성 영역
├── SMSPreviewDialog.tsx       # 발송 전 미리보기
├── SendProgressDialog.tsx     # 발송 진행 상황
└── QuickSMSDialog.tsx         # 기존 페이지 통합용 간편 발송
```

#### 5.1.4 신규 파일: `frontend/src/components/sms/BulkSMSSheet.tsx`

**UI 구조:**

```
+------------------------------------------------------------------+
| 복수 SMS 발송                                              [X]   |
+------------------------------------------------------------------+
|                                                                  |
| ┌──────────┐ ┌──────────┐                                        |
| │  고객    │ │ 협력사   │                          <- 탭         |
| └──────────┘ └──────────┘                                        |
|                                                                  |
+------------------------------------------------------------------+
| 필터:                                                            |
| ┌───────────────┐ ┌───────────────┐ ┌─────────────────────────┐  |
| │ 상태 전체   ▼ │ │ 지역 전체   ▼ │ │ 검색...               🔍│  |
| └───────────────┘ └───────────────┘ └─────────────────────────┘  |
+------------------------------------------------------------------+
| ┌─────────────────────────────────────────────────────────────┐  |
| │ [✓] 전체 선택 (15명)                       선택됨: 5명     │  |
| ├─────────────────────────────────────────────────────────────┤  |
| │ [ ] 홍길동    010-****-5678    양평군    신규              │  |
| │ [✓] 김철수    010-****-6789    가평군    상담중            │  |
| │ [✓] 이영희    010-****-7890    양평군    배정완료          │  |
| │ [✓] 박민수    010-****-8901    가평군    완료              │  |
| │ ...                                                         │  |
| └─────────────────────────────────────────────────────────────┘  |
|                                                                  |
|                     [이전] [1] [2] [3] [다음]                    |
|                                                                  |
+------------------------------------------------------------------+
| 메시지:                                                          |
| ┌─────────────────────────────────────────────────────────────┐  |
| │ [전방 홈케어] 안녕하세요.                                   │  |
| │                                                             │  |
| │ 서비스 관련 안내드립니다...                                 │  |
| │                                                             │  |
| └─────────────────────────────────────────────────────────────┘  |
| 125/2000자 (90자 초과 시 LMS)                                    |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|                      [취소]  [미리보기]  [발송 (5건)]            |
|                                                                  |
+------------------------------------------------------------------+
```

#### 5.1.5 신규 파일: `frontend/src/components/sms/SendProgressDialog.tsx`

**UI 구조:**

```
+------------------------------------------------------------------+
| SMS 발송 중...                                                   |
+------------------------------------------------------------------+
|                                                                  |
|  ██████████████████████░░░░░░░░░░░░  65%                        |
|                                                                  |
|  ┌────────────────────────────────────────────────────────────┐  |
|  │  총 발송: 50명                                             │  |
|  │  성공: 30건  |  실패: 2건  |  대기: 18건                   │  |
|  │  예상 남은 시간: 약 12초                                   │  |
|  └────────────────────────────────────────────────────────────┘  |
|                                                                  |
|  현재 배치: 2 / 3                                                |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|                        [백그라운드로 전환]                        |
|                                                                  |
+------------------------------------------------------------------+
```

**완료 시:**

```
+------------------------------------------------------------------+
| SMS 발송 완료                                              [X]   |
+------------------------------------------------------------------+
|                                                                  |
|  ✅ 발송이 완료되었습니다                                        |
|                                                                  |
|  ┌────────────────────────────────────────────────────────────┐  |
|  │  총 발송: 50명                                             │  |
|  │  성공: 48건  |  실패: 2건                                  │  |
|  │  소요 시간: 25초                                           │  |
|  └────────────────────────────────────────────────────────────┘  |
|                                                                  |
|  ⚠️ 실패 건 (2건):                                               |
|  ┌────────────────────────────────────────────────────────────┐  |
|  │  • 홍길동 (****5678): 수신 거부                            │  |
|  │  • 김철수 (****6789): 번호 오류                            │  |
|  └────────────────────────────────────────────────────────────┘  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|                              [확인]                               |
|                                                                  |
+------------------------------------------------------------------+
```

#### 5.1.6 신규 파일: `frontend/src/components/common/FloatingActionBar.tsx`

**신청/협력사 페이지 통합용:**

```
+------------------------------------------------------------------+
|                                                                  |
|  5건 선택됨       [SMS 발송]    [상태 변경]    [선택 해제]       |
|                                                                  |
+------------------------------------------------------------------+
```

#### 5.1.7 수정 파일: `frontend/src/app/(admin)/admin/sms/page.tsx`

**변경 사항:**

1. "복수 발송" 버튼 추가
2. BulkSMSSheet 연결
3. 발송 내역에 bulk 발송 표시

```typescript
// 추가할 버튼 (기존 "SMS 발송" 버튼 옆)
<Button onClick={() => setIsBulkSheetOpen(true)}>
  <Users className="h-4 w-4 mr-2" />
  복수 발송
</Button>

// Sheet 컴포넌트 추가
<BulkSMSSheet
  open={isBulkSheetOpen}
  onOpenChange={setIsBulkSheetOpen}
  onSuccess={() => {
    loadStats();
    loadLogs();
  }}
/>
```

#### 5.1.8 수정 파일: `frontend/src/app/(admin)/admin/applications/page.tsx`

**변경 사항:**

1. 테이블 첫 컬럼에 체크박스 추가
2. 선택 상태 관리
3. FloatingActionBar 추가
4. QuickSMSDialog 연결

```typescript
// 상태 추가
const [selectedIds, setSelectedIds] = useState<number[]>([]);
const [isQuickSMSOpen, setIsQuickSMSOpen] = useState(false);

// 테이블 헤더에 체크박스
<TableHead className="w-12">
  <Checkbox
    checked={selectedIds.length === items.length}
    onCheckedChange={handleSelectAll}
  />
</TableHead>

// 테이블 행에 체크박스
<TableCell>
  <Checkbox
    checked={selectedIds.includes(item.id)}
    onCheckedChange={() => handleSelect(item.id)}
  />
</TableCell>

// FloatingActionBar (선택 시 표시)
{selectedIds.length > 0 && (
  <FloatingActionBar
    count={selectedIds.length}
    onSMS={() => setIsQuickSMSOpen(true)}
    onClear={() => setSelectedIds([])}
  />
)}

// QuickSMSDialog
<QuickSMSDialog
  open={isQuickSMSOpen}
  onOpenChange={setIsQuickSMSOpen}
  targetType="customer"
  targetIds={selectedIds}
  onSuccess={() => setSelectedIds([])}
/>
```

#### 5.1.9 수정 파일: `frontend/src/app/(admin)/admin/partners/page.tsx`

**변경 사항:** 신청 관리와 동일한 패턴 적용

---

## 6. 구현 순서 및 예상 기간

### 6.1 Phase별 작업

| Phase | 작업 | 예상 기간 | 선행 조건 |
|-------|------|-----------|-----------|
| **Phase 1** | Backend 모델 및 서비스 | 1-2일 | - |
| 1-1 | BulkSMSJob 모델 생성 | 2시간 | - |
| 1-2 | SMSLog 모델 수정 | 30분 | 1-1 |
| 1-3 | DB 마이그레이션 생성 및 적용 | 30분 | 1-2 |
| 1-4 | bulk_sms 스키마 정의 | 1시간 | - |
| 1-5 | BulkSMSService 구현 | 4시간 | 1-3 |
| 1-6 | sms.py 수정 (bulk 파라미터 추가) | 30분 | 1-5 |
| **Phase 2** | Backend API | 1일 | Phase 1 |
| 2-1 | /recipients 엔드포인트 추가 | 2시간 | - |
| 2-2 | /bulk 엔드포인트 추가 | 2시간 | 1-5 |
| 2-3 | /bulk/{job_id} 엔드포인트 추가 | 1시간 | 2-2 |
| 2-4 | /bulk 목록 엔드포인트 추가 | 1시간 | 2-2 |
| **Phase 3** | Frontend SMS 복수 발송 UI | 1-2일 | Phase 2 |
| 3-1 | API 타입 및 함수 추가 | 1시간 | - |
| 3-2 | RecipientTable 컴포넌트 | 2시간 | 3-1 |
| 3-3 | RecipientSelector 컴포넌트 | 2시간 | 3-2 |
| 3-4 | MessageComposer 컴포넌트 | 1시간 | - |
| 3-5 | BulkSMSSheet 컴포넌트 | 3시간 | 3-2, 3-3, 3-4 |
| 3-6 | SMSPreviewDialog 컴포넌트 | 1시간 | 3-5 |
| 3-7 | SendProgressDialog 컴포넌트 | 2시간 | 3-1 |
| 3-8 | SMS 페이지 수정 | 1시간 | 3-5, 3-7 |
| **Phase 4** | Frontend 기존 페이지 통합 | 1일 | Phase 3 |
| 4-1 | FloatingActionBar 컴포넌트 | 1시간 | - |
| 4-2 | QuickSMSDialog 컴포넌트 | 2시간 | 3-5 |
| 4-3 | 신청 관리 페이지 수정 | 2시간 | 4-1, 4-2 |
| 4-4 | 협력사 관리 페이지 수정 | 1시간 | 4-3 |
| **Phase 5** | 테스트 및 마무리 | 0.5일 | Phase 4 |
| 5-1 | 통합 테스트 | 2시간 | - |
| 5-2 | 버그 수정 | 2시간 | 5-1 |

### 6.2 전체 예상 기간

| 구분 | 기간 |
|------|------|
| 최소 | 4.5일 |
| 최대 | 6.5일 |
| **권장** | **5일** |

---

## 7. 제약사항 및 고려사항

### 7.1 기술적 제약

| 제약사항 | 영향 | 대응 방안 |
|----------|------|-----------|
| Aligo API Rate Limit | 과도한 요청 시 차단 가능 | 배치 간 0.5초 딜레이 |
| HTTP 타임아웃 | 대규모 동기 발송 불가 | 비동기 Job 처리 |
| 서버 재시작 | 처리 중 Job 중단 | status 기반 복구 (향후) |
| DB 세션 관리 | 백그라운드 태스크 세션 | 별도 세션 생성 |

### 7.2 보안 고려사항

| 항목 | 대응 |
|------|------|
| 전화번호 노출 | 목록에서 마스킹 (010-****-5678) |
| 권한 검증 | 모든 API에 관리자 인증 필수 |
| 발송 기록 | SMSLog에 모든 발송 기록 |

### 7.3 성능 고려사항

| 항목 | 수치 | 비고 |
|------|------|------|
| 배치 크기 | 50명 | API 안정성 고려 |
| 배치 내 병렬 처리 | O | asyncio.gather 사용 |
| 배치 간 딜레이 | 0.5초 | Rate Limit 방지 |
| 재시도 횟수 | 3회 | 지수 백오프 |
| 폴링 간격 | 3초 | 진행 상황 조회 |

### 7.4 향후 확장 고려

| 기능 | 우선순위 | 비고 |
|------|----------|------|
| SMS 템플릿 관리 | 중 | 자주 사용하는 메시지 저장 |
| 예약 발송 | 중 | 특정 시간에 발송 |
| 변수 치환 | 하 | {고객명}, {서비스명} 등 |
| 발송 통계 대시보드 | 하 | 일별/월별 통계 |

---

## 8. 부록

### 8.1 API 명세 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/admin/sms/recipients` | 수신자 목록 조회 |
| POST | `/admin/sms/bulk` | 복수 발송 Job 생성 |
| GET | `/admin/sms/bulk/{job_id}` | Job 상태 조회 |
| GET | `/admin/sms/bulk` | Job 목록 조회 |

### 8.2 상태 흐름도

```
BulkSMSJob 상태:

pending ──────► processing ──────► completed
                    │
                    │              partial_failed
                    │
                    └────────────► failed

                cancelled (관리자 취소)
```

### 8.3 참고 문서

- [알리고 SMS API 문서](https://smartsms.aligo.in/smsapi.html)
- 프로젝트 CLAUDE.md
- docs/API_SPEC.md
- docs/DATABASE.md
