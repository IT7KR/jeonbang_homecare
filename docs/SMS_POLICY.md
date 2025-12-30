# SMS 발송 정책 상세 분석

> 최종 업데이트: 2025-12-27

---

## 1. 발송 정책 요약 (Quick Reference)

### 1.1 이벤트별 발송 대상

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SMS 발송 대상 매트릭스                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [이벤트]              [발신]        [수신]           [조건]                │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ① 고객 신청 완료      ALIGO_SENDER → 모든 활성 관리자   항상 (자동)        │
│                                                                             │
│  ② 협력사 등록 완료    ALIGO_SENDER → 모든 활성 관리자   항상 (자동)        │
│                                                                             │
│  ③ 협력사 배정         ALIGO_SENDER → 해당 고객         send_sms=true 시   │
│                        ALIGO_SENDER → 담당 협력사       send_sms=true 시   │
│                                                                             │
│  ④ 일정 확정           ALIGO_SENDER → 해당 고객         send_sms=true 시   │
│                        ALIGO_SENDER → 담당 협력사       send_sms=true 시   │
│                                                                             │
│  ⑤ 일정 변경           ALIGO_SENDER → 해당 고객         send_sms=true 시   │
│                        ALIGO_SENDER → 담당 협력사       send_sms=true 시   │
│                                                                             │
│  ⑥ 수동 발송           ALIGO_SENDER → 지정 수신자       관리자 직접        │
│                                                                             │
│  ⑦ 복수 발송           ALIGO_SENDER → 선택한 대상들     관리자 직접        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 수신자 결정 로직

| 수신자 유형     | 결정 방법                                                      | 소스    |
| --------------- | -------------------------------------------------------------- | ------- |
| **활성 관리자** | Admin 테이블에서 `is_active=true` AND `phone IS NOT NULL` 조회 | DB      |
| **고객**        | Application 테이블의 `customer_phone` (복호화)                 | DB      |
| **협력사**      | Partner 테이블의 `contact_phone` (복호화)                      | DB      |
| **지정 수신자** | API 요청 파라미터 `receiver_phone`                             | Request |

---

## 2. 자동 발송 정책 상세

### 2.1 고객 서비스 신청 시

```
┌─────────────────────────────────────────────────────────┐
│  트리거: 고객이 서비스 신청 완료 (POST /api/v1/applications)  │
├─────────────────────────────────────────────────────────┤
│  발신: ALIGO_SENDER (01033237396)                       │
│  수신: 모든 활성 관리자 (Admin.phone)                    │
│  방식: BackgroundTask (비동기)                          │
│  로그: ❌ SMSLog 미기록                                  │
└─────────────────────────────────────────────────────────┘
```

**메시지 템플릿** (`admin_new_application`):

```
[전방홈케어] 신규 서비스 신청
신청번호: {application_number}
고객연락처: {customer_phone}
서비스: {services}
희망일정: {schedule_info}
관리자 페이지에서 확인해주세요.
```

**코드 위치**:

- API: `backend/app/api/v1/endpoints/applications.py`
- SMS: `backend/app/services/sms.py:send_application_notification()`

---

### 2.2 협력사 등록 신청 시

```
┌─────────────────────────────────────────────────────────┐
│  트리거: 협력사가 등록 완료 (POST /api/v1/partners)         │
├─────────────────────────────────────────────────────────┤
│  발신: ALIGO_SENDER (01033237396)                       │
│  수신: 모든 활성 관리자 (Admin.phone)                    │
│  방식: BackgroundTask (비동기)                          │
│  로그: ❌ SMSLog 미기록                                  │
└─────────────────────────────────────────────────────────┘
```

**메시지 템플릿** (`admin_new_partner`):

```
[전방홈케어] 신규 협력사 등록
업체명: {company_name}
연락처: {contact_phone}
서비스분야: {services}
관리자 페이지에서 확인해주세요.
```

**코드 위치**:

- API: `backend/app/api/v1/endpoints/partners.py`
- SMS: `backend/app/services/sms.py:send_partner_notification()`

---

### 2.3 협력사 배정 시 (조건부)

```
┌─────────────────────────────────────────────────────────┐
│  트리거: 관리자가 신청에 협력사 배정                      │
│         (PUT /api/v1/admin/applications/{id})           │
├─────────────────────────────────────────────────────────┤
│  조건: send_sms=true AND assigned_partner_id 변경       │
│  발신: ALIGO_SENDER                                     │
│  수신①: 해당 신청의 고객 (customer_phone)               │
│  수신②: 담당 협력사 (contact_phone)                    │
│  방식: BackgroundTask (비동기)                          │
│  로그: ✅ SMSLog 기록                                    │
└─────────────────────────────────────────────────────────┘
```

**고객용 메시지 템플릿** (`partner_assigned`):

```
[전방홈케어] {customer_name}님, 담당 협력사({partner_name})가 배정되었습니다.
연락처: {partner_phone}
예정일: {scheduled_date} {scheduled_time}
견적: {estimated_cost}
곧 연락드릴 예정입니다.
```

**협력사용 메시지 템플릿** (`partner_notify_assignment`):

```
[전방홈케어] 새로운 서비스가 배정되었습니다.
신청번호: {application_number}
고객: {customer_name}
연락처: {customer_phone}
주소: {address}
서비스: {services}
예정일: {scheduled_date}
```

**코드 위치**:

- API: `backend/app/api/v1/endpoints/admin/applications.py`
- SMS 고객: `backend/app/services/sms.py:send_partner_assignment_notification()`
- SMS 협력사: `backend/app/services/sms.py:send_partner_notify_assignment()`

---

### 2.4 일정 확정 시 (조건부)

```
┌─────────────────────────────────────────────────────────┐
│  트리거: 관리자가 일정 확정                              │
│         (status→scheduled 또는 scheduled_date 설정)      │
├─────────────────────────────────────────────────────────┤
│  조건: send_sms=true                                    │
│  발신: ALIGO_SENDER                                     │
│  수신①: 해당 신청의 고객 (customer_phone)                │
│  수신②: 담당 협력사 (contact_phone) - 배정된 경우만      │
│  방식: BackgroundTask (비동기)                          │
│  로그: ✅ SMSLog 기록                                    │
└─────────────────────────────────────────────────────────┘
```

**고객용 메시지 템플릿** (`schedule_confirmed`):

```
[전방홈케어] {customer_name}님, 서비스 일정이 확정되었습니다.
신청번호: {application_number}
일시: {scheduled_date} {scheduled_time}
담당: {partner_name}
```

**협력사용 메시지 템플릿** (`partner_schedule_notify`):

```
[전방홈케어] 일정이 확정되었습니다.
일시: {scheduled_date} {scheduled_time}
고객: {customer_name}
주소: {address}
```

**코드 위치**:

- API: `backend/app/api/v1/endpoints/admin/applications.py`
- SMS 고객: `backend/app/services/sms.py:send_schedule_confirmation()`
- SMS 협력사: `backend/app/services/sms.py:send_partner_schedule_notification()`

---

### 2.5 일정 변경 시 (조건부)

```
┌─────────────────────────────────────────────────────────┐
│  트리거: 관리자가 확정된 일정 변경                        │
│         (scheduled_date 변경)                           │
├─────────────────────────────────────────────────────────┤
│  조건: send_sms=true AND 기존 일정 존재                 │
│  발신: ALIGO_SENDER                                     │
│  수신①: 해당 신청의 고객 (customer_phone)               │
│  수신②: 담당 협력사 (contact_phone) - 배정된 경우만    │
│  방식: BackgroundTask (비동기)                          │
│  로그: ✅ SMSLog 기록                                    │
└─────────────────────────────────────────────────────────┘
```

**메시지 템플릿** (`schedule_changed`):

```
[전방홈케어] 일정이 변경되었습니다.
신청번호: {application_number}
변경 전: {old_date}
변경 후: {new_date} {new_time}
```

**코드 위치**:

- API: `backend/app/api/v1/endpoints/admin/applications.py`
- SMS: `backend/app/services/sms.py:send_schedule_changed_notification()`

---

## 3. 수동 발송 정책

### 3.1 개별 수동 발송

```
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/v1/admin/sms/send                       │
├─────────────────────────────────────────────────────────┤
│  발신: ALIGO_SENDER                                     │
│  수신: 요청에 지정된 receiver_phone                      │
│  인증: 관리자 JWT 필수                                   │
│  로그: ✅ SMSLog 기록 (sms_type: "manual")              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 실패 SMS 재발송

```
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/v1/admin/sms/retry/{log_id}             │
├─────────────────────────────────────────────────────────┤
│  발신: ALIGO_SENDER                                     │
│  수신: 원래 SMS 로그의 receiver_phone                    │
│  인증: 관리자 JWT 필수                                   │
│  로그: ✅ SMSLog 기록 (sms_type: "{원본}_retry")        │
└─────────────────────────────────────────────────────────┘
```

### 3.3 복수 발송 (Bulk)

```
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/v1/admin/sms/bulk                       │
├─────────────────────────────────────────────────────────┤
│  발신: ALIGO_SENDER                                     │
│  수신: 조건/선택에 따른 고객 또는 협력사 목록            │
│  인증: 관리자 JWT 필수                                   │
│  로그: ✅ SMSLog 기록 + BulkSMSJob 기록                 │
│  처리: 50명씩 배치, 500ms 간격, 최대 3회 재시도         │
└─────────────────────────────────────────────────────────┘
```

**발송 유형**:
| job_type | 대상 결정 방식 |
|----------|--------------|
| `announcement` | target_filter 조건에 맞는 전체 |
| `status_notify` | 특정 상태의 대상 |
| `manual_select` | target_ids로 직접 선택 |

---

## 4. 환경변수 및 설정

### 4.1 백엔드 환경변수 (`.env`)

| 환경변수        | 역할                      | 예시            |
| --------------- | ------------------------- | --------------- |
| `ALIGO_API_KEY` | SMS 발송 활성화 키 (핵심) | `sor4r0me4h...` |
| `ALIGO_USER_ID` | 알리고 계정 ID            | `jeonbang01`    |
| `ALIGO_SENDER`  | 발신번호 (사전 등록 필수) | `01033237396`   |

### 4.2 프론트엔드 환경변수 (`.env.local`)

| 환경변수                        | 역할                   | 현재값  |
| ------------------------------- | ---------------------- | ------- |
| `NEXT_PUBLIC_ENABLE_MANUAL_SMS` | 수동 발송 UI 표시 여부 | `false` |

> **참고**: 이 값은 UI 가시성만 제어합니다. 백엔드 API는 항상 동작합니다.

### 4.3 관리자 알림 수신자 설정

관리자 알림 SMS는 **Admin 테이블**에서 조회됩니다:

```sql
SELECT phone FROM admins
WHERE is_active = true
  AND phone IS NOT NULL
  AND phone != '';
```

**관리자 추가/수정**: 관리자 페이지 → 설정 → 계정 관리

---

## 5. SMS 발송 타입 분류

| sms_type                    | 설명                      | 수신자           | 자동/수동 | 로그 |
| --------------------------- | ------------------------- | ---------------- | --------- | ---- |
| `application_new`           | 신규 신청 알림            | 활성 관리자 전체 | 자동      | ❌   |
| `partner_new`               | 협력사 등록 알림          | 활성 관리자 전체 | 자동      | ❌   |
| `partner_assigned`          | 협력사 배정 알림 (고객)   | 해당 고객        | 조건부    | ✅   |
| `partner_notify_assignment` | 협력사 배정 알림 (협력사) | 담당 협력사      | 조건부    | ✅   |
| `schedule_confirmed`        | 일정 확정 (고객)          | 해당 고객        | 조건부    | ✅   |
| `partner_schedule`          | 일정 안내 (협력사)        | 담당 협력사      | 조건부    | ✅   |
| `schedule_changed`          | 일정 변경 알림            | 고객 + 협력사    | 조건부    | ✅   |
| `assignment_changed`        | 배정 정보 변경            | 해당 고객        | 조건부    | ✅   |
| `manual`                    | 수동 발송                 | 지정 수신자      | 수동      | ✅   |
| `manual_retry`              | 재발송                    | 원본 수신자      | 수동      | ✅   |
| `bulk_announcement`         | 공지 발송                 | 조건 대상        | 수동      | ✅   |
| `bulk_status_notify`        | 상태별 발송               | 조건 대상        | 수동      | ✅   |
| `bulk_manual_select`        | 선택 발송                 | 선택 대상        | 수동      | ✅   |

---

## 6. 발송 흐름도

### 6.1 자동 발송 흐름

```
[고객/협력사 액션]
        │
        ▼
┌───────────────────┐
│   API 엔드포인트   │
│  (applications/   │
│   partners)       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  BackgroundTask   │
│    등록           │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ get_admin_phones()│  ← Admin 테이블 조회
│  관리자 목록 조회  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   각 관리자에게    │
│   SMS 발송 루프    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  send_sms()       │
│  알리고 API 호출   │
└───────────────────┘
```

### 6.2 조건부 발송 흐름

```
[관리자 신청 수정]
        │
        ▼
┌───────────────────┐
│ send_sms 플래그   │
│ 확인              │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    │           │
  false       true
    │           │
    ▼           ▼
 [종료]   ┌───────────────────┐
          │ 변경 사항 감지     │
          │ - 협력사 배정?    │
          │ - 일정 확정?      │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ 해당 고객/협력사   │
          │ 에게 SMS 발송      │
          └───────────────────┘
```

---

## 7. 주요 코드 위치

| 파일                                                 | 역할                     |
| ---------------------------------------------------- | ------------------------ |
| `backend/app/services/sms.py`                        | SMS 발송 핵심 로직       |
| `backend/app/services/sms.py:get_admin_phones()`     | 관리자 번호 조회         |
| `backend/app/services/sms.py:send_sms()`             | 알리고 API 호출          |
| `backend/app/services/bulk_sms.py`                   | 복수 발송 배치 처리      |
| `backend/app/api/v1/endpoints/applications.py`       | 신청 시 자동 발송        |
| `backend/app/api/v1/endpoints/partners.py`           | 협력사 등록 시 자동 발송 |
| `backend/app/api/v1/endpoints/admin/applications.py` | 상태 변경 시 조건부 발송 |
| `backend/app/api/v1/endpoints/admin/sms.py`          | SMS 관리 API             |

---

## 8. 개발/프로덕션 모드

### 8.1 개발 모드 (ALIGO_API_KEY 미설정)

```
- 실제 SMS 발송: ❌
- 알리고 API 호출: ❌
- 데이터 저장: ✅ (신청/협력사 정상 저장)
- 로그 메시지: "SMS API key not configured (development mode)"
```

### 8.2 프로덕션 모드 (ALIGO_API_KEY 설정)

```
- 실제 SMS 발송: ✅
- 알리고 API 호출: ✅
- 발송 결과: result_code="1" (성공) / 기타 (실패)
- 로그 기록: 조건에 따라 SMSLog 기록
```

---

## 9. 현재 구현 상태

| 기능                       | 상태 | 수신자           | 비고                                                    |
| -------------------------- | ---- | ---------------- | ------------------------------------------------------- |
| 신청 시 관리자 알림        | ✅   | 활성 관리자 전체 | 로그 미기록, 템플릿: `admin_new_application`            |
| 협력사 등록 시 관리자 알림 | ✅   | 활성 관리자 전체 | 로그 미기록, 템플릿: `admin_new_partner`                |
| 협력사 배정 알림 (고객)    | ✅   | 해당 고객        | send_sms 체크 필요, 템플릿: `partner_assigned`          |
| 협력사 배정 알림 (협력사)  | ✅   | 담당 협력사      | send_sms 체크 필요, 템플릿: `partner_notify_assignment` |
| 일정 확정 알림 (고객)      | ✅   | 해당 고객        | send_sms 체크 필요, 템플릿: `schedule_confirmed`        |
| 일정 확정 알림 (협력사)    | ✅   | 담당 협력사      | send_sms 체크 필요, 템플릿: `partner_schedule_notify`   |
| 일정 변경 알림             | ✅   | 고객 + 협력사    | send_sms 체크 필요, 템플릿: `schedule_changed`          |
| 배정 정보 변경 알림        | ✅   | 해당 고객        | send_sms 체크 필요, 템플릿: `assignment_changed`        |
| 수동 발송                  | ✅   | 지정 수신자      | UI 비활성화 상태                                        |
| 복수 발송                  | ✅   | 선택/조건 대상   | UI 비활성화 상태                                        |

---

## 10. 개선 가능 사항

1. **신청/협력사 생성 시 SMS 로그 기록**

   - 현재: SMSLog 미기록
   - 개선: send_sms_direct() 사용으로 로그 기록

2. **관리자별 알림 설정**
   - 현재: 모든 활성 관리자에게 발송
   - 검토: 관리자별 알림 수신 여부 설정 추가

---

## 11. 변경 이력

| 날짜       | 변경 내용                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| 2025-12-27 | 템플릿 키 불일치 수정 (`admin_new_application`, `admin_new_partner`, `schedule_changed` 추가) |
| 2025-12-27 | 협력사 배정 시 협력사 알림 기능 추가 (`partner_notify_assignment`)                            |
| 2025-12-27 | 템플릿 개선: 협력사 연락처, 신청번호, 문의 전화번호(1551-6640) 추가                           |
