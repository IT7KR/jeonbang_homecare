# API 명세서

> 최종 검토: 2025-12-27

## 1. API 설계 원칙

- RESTful 설계 원칙 준수
- JSON 형식의 요청/응답
- 버전 관리: `/api/v1/...`
- 적절한 HTTP 상태 코드 사용
- 일관된 에러 응답 형식

## 2. 공통 사항

### 2.1 Base URL
```
Production: https://api.jeonbang-homecare.com/api/v1
Development: http://localhost:8000/api/v1
```

### 2.2 인증 헤더
```
Authorization: Bearer <access_token>
```

### 2.3 공통 응답 형식

**성공 응답**
```json
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다."
}
```

**에러 응답**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": { ... }
  }
}
```

**페이지네이션 응답**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2.4 HTTP 상태 코드
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 422 | 유효성 검사 실패 |
| 500 | 서버 에러 |

### 2.5 에러 코드
| 코드 | 설명 |
|------|------|
| `AUTH_REQUIRED` | 인증이 필요합니다 |
| `AUTH_INVALID` | 인증 정보가 올바르지 않습니다 |
| `AUTH_EXPIRED` | 인증이 만료되었습니다 |
| `AUTH_LOCKED` | 계정이 잠겼습니다 |
| `VALIDATION_ERROR` | 입력값 검증 실패 |
| `NOT_FOUND` | 리소스를 찾을 수 없습니다 |
| `DUPLICATE_ENTRY` | 중복된 항목입니다 |
| `SMS_SEND_FAILED` | SMS 발송에 실패했습니다 |

---

## 3. 공개 API (인증 불필요)

### 3.1 서비스 유형 목록
```
GET /services
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "weeding",
      "name": "제초",
      "description": "잡초 제거 서비스",
      "options": [
        { "key": "area", "label": "면적", "values": ["100평 미만", "100-200평", "200평 이상"] }
      ]
    },
    {
      "id": 2,
      "code": "garden",
      "name": "정원관리",
      "description": "정원 가꾸기 서비스",
      "options": null
    }
  ]
}
```

### 3.2 서비스 지역 목록
```
GET /regions
```

**Response**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "yangpyeong", "name": "양평" },
    { "id": 2, "code": "gapyeong", "name": "가평" },
    { "id": 3, "code": "other", "name": "기타" }
  ]
}
```

### 3.3 서비스 신청
```
POST /applications
```

**Request Body**
```json
{
  "customer": {
    "name": "홍길동",
    "phone": "010-1234-5678",
    "address": "경기도 양평군 양평읍 중앙로 123",
    "addressDetail": "101동 202호"
  },
  "services": [
    {
      "code": "weeding",
      "options": { "area": "100-200평" }
    },
    {
      "code": "garden"
    }
  ],
  "schedule": {
    "preferredDate": "2025-12-01",
    "preferredTime": "morning",
    "alternativeDate": "2025-12-03"
  },
  "requestDetails": "대문 앞 잔디 관리 부탁드립니다.",
  "attachments": ["uuid-1", "uuid-2"],
  "agreements": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "applicationNo": "20251125-001",
    "message": "서비스 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다."
  }
}
```

### 3.4 파트너 등록 요청
```
POST /partners
```

**Request Body**
```json
{
  "companyName": "조경맨",
  "representativeName": "박철수",
  "contactName": "박철수",
  "phone": "010-9876-5432",
  "email": "partner@example.com",
  "address": "경기도 가평군 가평읍 가화로 456",
  "services": ["weeding", "garden", "cleaning"],
  "regions": ["yangpyeong", "gapyeong"],
  "businessLicenseFile": "uuid-file-1",
  "introduction": "10년 경력의 조경 전문가입니다.",
  "portfolio": "주요 시공 사례...",
  "agreements": {
    "terms": true,
    "privacy": true
  }
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "message": "파트너 등록 요청이 완료되었습니다. 검토 후 연락드리겠습니다."
  }
}
```

### 3.5 파일 업로드
```
POST /uploads
Content-Type: multipart/form-data
```

**Request**
- `file`: 업로드할 파일 (최대 10MB)
- `type`: 파일 유형 (`image`, `document`)

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "filename": "original_name.jpg",
    "url": "/uploads/uuid-1234.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

---

## 4. 인증 API

### 4.1 로그인
```
POST /auth/login
```

**Request Body**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "관리자"
    }
  }
}
```

### 4.2 로그아웃
```
POST /auth/logout
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

### 4.3 현재 사용자 정보
```
GET /auth/me
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "name": "관리자",
    "email": "admin@example.com",
    "lastLoginAt": "2025-11-25T10:30:00Z"
  }
}
```

### 4.4 비밀번호 변경
```
PUT /auth/password
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123!"
}
```

---

## 5. 관리자 API - 신청 관리

### 5.1 신청 목록 조회
```
GET /admin/applications
Authorization: Bearer <token>
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | number | N | 페이지 번호 (기본: 1) |
| limit | number | N | 페이지당 항목 수 (기본: 20) |
| status | string | N | 상태 필터 (new, consulting, assigned, scheduled, completed, cancelled) |
| service | string | N | 서비스 유형 코드 |
| startDate | date | N | 기간 시작일 (YYYY-MM-DD) |
| endDate | date | N | 기간 종료일 (YYYY-MM-DD) |
| search | string | N | 검색어 (고객명, 연락처, 신청번호) |
| assigned | boolean | N | 배정 여부 |

**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "applicationNo": "20251125-001",
        "customerName": "홍길동",
        "customerPhone": "010-****-5678",
        "services": ["제초", "정원관리"],
        "preferredDate": "2025-12-01",
        "preferredTime": "morning",
        "status": "new",
        "partner": null,
        "createdAt": "2025-11-25T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 5.2 신청 상세 조회
```
GET /admin/applications/:id
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "applicationNo": "20251125-001",
    "customer": {
      "name": "홍길동",
      "phone": "010-1234-5678",
      "address": "경기도 양평군 양평읍 중앙로 123",
      "addressDetail": "101동 202호"
    },
    "services": [
      {
        "code": "weeding",
        "name": "제초",
        "options": { "area": "100-200평" }
      }
    ],
    "schedule": {
      "preferredDate": "2025-12-01",
      "preferredTime": "morning",
      "alternativeDate": "2025-12-03"
    },
    "requestDetails": "대문 앞 잔디 관리 부탁드립니다.",
    "attachments": [
      { "id": "uuid-1", "url": "/uploads/uuid-1.jpg", "filename": "photo1.jpg" }
    ],
    "status": "new",
    "partner": null,
    "agreements": {
      "terms": true,
      "privacy": true,
      "marketing": false
    },
    "statusLogs": [
      {
        "fromStatus": null,
        "toStatus": "new",
        "adminName": "시스템",
        "createdAt": "2025-11-25T10:30:00Z"
      }
    ],
    "notes": [],
    "smsLogs": [],
    "createdAt": "2025-11-25T10:30:00Z",
    "updatedAt": "2025-11-25T10:30:00Z"
  }
}
```

### 5.3 신청 상태 변경
```
PATCH /admin/applications/:id/status
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "status": "consulting"
}
```

### 5.4 파트너 배정
```
POST /admin/applications/:id/assign
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "partnerId": 5
}
```

### 5.5 메모 추가
```
POST /admin/applications/:id/notes
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "content": "고객 전화 완료. 12/1 오전 방문 예정."
}
```

### 5.6 메모 목록
```
GET /admin/applications/:id/notes
Authorization: Bearer <token>
```

### 5.7 SMS 발송
```
POST /admin/applications/:id/sms
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "message": "안녕하세요, 전방 홈케어입니다. 12월 1일 오전 방문 예정입니다.",
  "templateId": 1
}
```

---

## 6. 관리자 API - 파트너 관리

### 6.1 파트너 목록
```
GET /admin/partners
Authorization: Bearer <token>
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | number | N | 페이지 번호 |
| limit | number | N | 페이지당 항목 수 |
| status | string | N | 상태 (pending, approved, rejected, inactive) |
| service | string | N | 서비스 유형 코드 |
| region | string | N | 지역 코드 |

### 6.2 파트너 상세
```
GET /admin/partners/:id
Authorization: Bearer <token>
```

### 6.3 파트너 승인
```
PATCH /admin/partners/:id/approve
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "sendSms": true
}
```

### 6.4 파트너 반려
```
PATCH /admin/partners/:id/reject
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "reason": "사업자등록증이 유효하지 않습니다.",
  "sendSms": true
}
```

### 6.5 파트너 비활성화
```
PATCH /admin/partners/:id/deactivate
Authorization: Bearer <token>
```

---

## 7. 관리자 API - 일정 관리

### 7.1 일정 목록
```
GET /admin/schedules
Authorization: Bearer <token>
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| startDate | date | Y | 시작일 |
| endDate | date | Y | 종료일 |
| partnerId | number | N | 파트너 ID |
| status | string | N | 신청 상태 |

### 7.2 캘린더 데이터
```
GET /admin/schedules/calendar
Authorization: Bearer <token>
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| year | number | Y | 연도 |
| month | number | Y | 월 (1-12) |

**Response**
```json
{
  "success": true,
  "data": {
    "2025-12-01": [
      {
        "applicationId": 1,
        "customerName": "홍길동",
        "services": ["제초"],
        "time": "morning",
        "partnerName": "조경맨"
      }
    ],
    "2025-12-03": [...]
  }
}
```

---

## 8. 관리자 API - 설정

### 8.1 회사 정보 조회
```
GET /admin/settings/company
Authorization: Bearer <token>
```

### 8.2 회사 정보 수정
```
PUT /admin/settings/company
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "companyName": "전방 홈케어",
  "representative": "김대표",
  "address": "경기도 양평군...",
  "phone": "031-123-4567",
  "businessNumber": "123-45-67890"
}
```

### 8.3 서비스 유형 CRUD
```
GET    /admin/settings/services
POST   /admin/settings/services
PUT    /admin/settings/services/:id
DELETE /admin/settings/services/:id
```

### 8.4 지역 CRUD
```
GET    /admin/settings/regions
POST   /admin/settings/regions
PUT    /admin/settings/regions/:id
DELETE /admin/settings/regions/:id
```

### 8.5 SMS 템플릿 CRUD
```
GET    /admin/settings/sms-templates
POST   /admin/settings/sms-templates
PUT    /admin/settings/sms-templates/:id
DELETE /admin/settings/sms-templates/:id
```

---

## 9. 관리자 API - 대시보드

### 9.1 대시보드 요약
```
GET /admin/dashboard/summary
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "todayApplications": 5,
    "pendingApplications": 12,
    "weeklySchedules": 8,
    "pendingPartners": 3
  }
}
```

### 9.2 최근 활동
```
GET /admin/dashboard/recent
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "recentApplications": [
      {
        "id": 1,
        "applicationNo": "20251125-001",
        "customerName": "홍길동",
        "services": ["제초"],
        "createdAt": "2025-11-25T10:30:00Z"
      }
    ]
  }
}
```

---

## 10. 관리자 API - QR 코드

### 10.1 QR 코드 생성
```
POST /admin/qrcodes
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "name": "양평 전단지 QR",
  "content": "https://jeonbang-homecare.com/apply?utm_source=flyer&utm_campaign=yangpyeong"
}
```

### 10.2 QR 코드 목록
```
GET /admin/qrcodes
Authorization: Bearer <token>
```

### 10.3 QR 코드 삭제
```
DELETE /admin/qrcodes/:id
Authorization: Bearer <token>
```
