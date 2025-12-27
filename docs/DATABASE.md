# 데이터베이스 설계 문서

> 최종 검토: 2025-12-27

## 1. 데이터베이스 개요

- **DBMS**: PostgreSQL (확정)
- **호스팅**: Local (개발) / AWS Lightsail Managed DB (운영)
- **문자셋**: UTF-8
- **Collation**: ko_KR.UTF-8

### 1.1 데이터베이스 규칙

| 규칙 | 설명 |
|------|------|
| **PK 타입** | `BIGSERIAL` 사용 (자동 증가 BIGINT) |
| **FK 제약조건** | 사용하지 않음 (애플리케이션 레벨에서 관계 관리) |
| **관계 컬럼** | `_id` 접미사로 명명 (예: `partner_id`, `admin_id`) |
| **타임스탬프** | `created_at`, `updated_at` 표준 사용 |
| **소프트 삭제** | 필요 시 `is_active` 또는 `deleted_at` 사용 |

### 1.2 FK 미사용 이유

1. **유연성**: 데이터 마이그레이션 및 스키마 변경 시 유연성 확보
2. **성능**: 대량 데이터 작업 시 FK 체크 오버헤드 제거
3. **애플리케이션 제어**: 관계 무결성을 애플리케이션 레벨에서 관리
4. **삭제 정책**: 소프트 삭제 패턴과의 호환성

> **주의**: FK 제약조건을 사용하지 않으므로, 애플리케이션 코드에서 참조 무결성을 반드시 관리해야 합니다.

## 2. ERD (Entity Relationship Diagram)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Admin      │     │ Application  │     │   Partner    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ username     │     │ customer_*   │────▶│ company_name │
│ password     │     │ service_*    │     │ status       │
│ name         │     │ schedule_*   │     │ services     │
│ ...          │     │ status       │     │ regions      │
└──────────────┘     │ partner_id   │     │ ...          │
                     │ notes        │     └──────────────┘
                     │ sms_logs     │            │
                     └──────────────┘            │
                            │                    │
                     ┌──────┴──────┐      ┌──────┴──────┐
                     │             │      │             │
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │ ServiceType  │  │    Region    │  │  SMSLog      │
              ├──────────────┤  ├──────────────┤  ├──────────────┤
              │ id           │  │ id           │  │ id           │
              │ name         │  │ name         │  │ phone        │
              │ description  │  │ code         │  │ message      │
              │ is_active    │  │ is_active    │  │ sent_at      │
              └──────────────┘  └──────────────┘  │ status       │
                                                  └──────────────┘
```

## 3. 테이블 정의

### 3.1 Admin (관리자)

관리자 계정 정보를 저장합니다.

| 컬럼명           | 타입                         | 제약조건           | 설명                   |
| ---------------- | ---------------------------- | ------------------ | ---------------------- |
| id               | BIGINT                       | PK, AUTO_INCREMENT | 관리자 ID              |
| username         | VARCHAR(50)                  | UNIQUE, NOT NULL   | 로그인 아이디          |
| password_hash    | VARCHAR(255)                 | NOT NULL           | 비밀번호 해시 (bcrypt) |
| name             | VARCHAR(50)                  | NOT NULL           | 관리자 이름            |
| email            | VARCHAR(100)                 |                    | 이메일                 |
| role             | ENUM('admin', 'super_admin') | DEFAULT 'admin'    | 역할 (확장용)          |
| is_active        | BOOLEAN                      | DEFAULT true       | 활성 상태              |
| login_fail_count | INT                          | DEFAULT 0          | 로그인 실패 횟수       |
| locked_until     | TIMESTAMP                    |                    | 잠금 해제 시간         |
| last_login_at    | TIMESTAMP                    |                    | 마지막 로그인          |
| created_at       | TIMESTAMP                    | DEFAULT NOW()      | 생성일시               |
| updated_at       | TIMESTAMP                    |                    | 수정일시               |

```sql
CREATE TABLE admin (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    login_fail_count INT DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 3.2 Application (서비스 신청)

고객의 서비스 신청 정보를 저장합니다.

| 컬럼명                  | 타입         | 제약조건           | 설명                    |
| ----------------------- | ------------ | ------------------ | ----------------------- |
| id                      | BIGINT       | PK, AUTO_INCREMENT | 신청 ID                 |
| application_no          | VARCHAR(20)  | UNIQUE, NOT NULL   | 신청번호 (YYYYMMDD-XXX) |
| customer_name           | VARCHAR(255) | NOT NULL           | 고객명 (암호화)         |
| customer_phone          | VARCHAR(255) | NOT NULL           | 연락처 (암호화)         |
| customer_address        | VARCHAR(500) | NOT NULL           | 주소 (암호화)           |
| customer_address_detail | VARCHAR(255) |                    | 상세주소 (암호화)       |
| services                | JSONB        | NOT NULL           | 선택 서비스 목록        |
| preferred_date          | DATE         | NOT NULL           | 희망일자                |
| preferred_time          | VARCHAR(20)  |                    | 희망시간대              |
| alternative_date        | DATE         |                    | 대체일자                |
| request_details         | TEXT         |                    | 요청사항                |
| attachments             | JSONB        |                    | 첨부파일 경로 목록      |
| status                  | VARCHAR(20)  | DEFAULT 'new'      | 상태                    |
| partner_id              | BIGINT       |                    | 배정된 파트너 ID        |
| assigned_at             | TIMESTAMP    |                    | 배정 일시               |
| terms_agreed            | BOOLEAN      | NOT NULL           | 이용약관 동의           |
| privacy_agreed          | BOOLEAN      | NOT NULL           | 개인정보 동의           |
| marketing_agreed        | BOOLEAN      | DEFAULT false      | 마케팅 동의             |
| created_at              | TIMESTAMP    | DEFAULT NOW()      | 신청일시                |
| updated_at              | TIMESTAMP    |                    | 수정일시                |

**status 값**: `new`, `consulting`, `assigned`, `scheduled`, `completed`, `cancelled`

**preferred_time 값**: `morning`, `afternoon`, `anytime`

```sql
CREATE TABLE application (
    id BIGSERIAL PRIMARY KEY,
    application_no VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(255) NOT NULL,
    customer_address VARCHAR(500) NOT NULL,
    customer_address_detail VARCHAR(255),
    services JSONB NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time VARCHAR(20),
    alternative_date DATE,
    request_details TEXT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'new',
    partner_id BIGINT,
    assigned_at TIMESTAMP,
    terms_agreed BOOLEAN NOT NULL,
    privacy_agreed BOOLEAN NOT NULL,
    marketing_agreed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_application_status ON application(status);
CREATE INDEX idx_application_preferred_date ON application(preferred_date);
CREATE INDEX idx_application_created_at ON application(created_at);
CREATE INDEX idx_application_partner_id ON application(partner_id);
```

### 3.3 ApplicationNote (신청 메모)

신청 건에 대한 관리자 메모를 저장합니다.

| 컬럼명         | 타입      | 제약조건           | 설명           |
| -------------- | --------- | ------------------ | -------------- |
| id             | BIGINT    | PK, AUTO_INCREMENT | 메모 ID        |
| application_id | BIGINT    | NOT NULL           | 신청 ID        |
| admin_id       | BIGINT    |                    | 작성 관리자 ID |
| content        | TEXT      | NOT NULL           | 메모 내용      |
| created_at     | TIMESTAMP | DEFAULT NOW()      | 작성일시       |

```sql
CREATE TABLE application_note (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    admin_id BIGINT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_application_note_application_id ON application_note(application_id);
```

### 3.4 ApplicationStatusLog (상태 변경 이력)

신청 건의 상태 변경 이력을 저장합니다.

| 컬럼명         | 타입        | 제약조건           | 설명           |
| -------------- | ----------- | ------------------ | -------------- |
| id             | BIGINT      | PK, AUTO_INCREMENT | 로그 ID        |
| application_id | BIGINT      | NOT NULL           | 신청 ID        |
| from_status    | VARCHAR(20) |                    | 이전 상태      |
| to_status      | VARCHAR(20) | NOT NULL           | 변경 상태      |
| admin_id       | BIGINT      |                    | 처리 관리자 ID |
| created_at     | TIMESTAMP   | DEFAULT NOW()      | 변경일시       |

```sql
CREATE TABLE application_status_log (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    admin_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_application_status_log_application_id ON application_status_log(application_id);
```

### 3.5 Partner (파트너)

협력 파트너 정보를 저장합니다.

| 컬럼명               | 타입         | 제약조건           | 설명                   |
| -------------------- | ------------ | ------------------ | ---------------------- |
| id                   | BIGINT       | PK, AUTO_INCREMENT | 파트너 ID              |
| company_name         | VARCHAR(100) | NOT NULL           | 업체명                 |
| representative_name  | VARCHAR(50)  | NOT NULL           | 대표자명               |
| contact_name         | VARCHAR(50)  | NOT NULL           | 담당자명               |
| phone                | VARCHAR(255) | NOT NULL           | 연락처 (암호화)        |
| email                | VARCHAR(100) | NOT NULL           | 이메일                 |
| address              | VARCHAR(255) | NOT NULL           | 사업장 주소            |
| services             | JSONB        | NOT NULL           | 서비스 가능 항목       |
| regions              | JSONB        | NOT NULL           | 서비스 가능 지역       |
| business_license_url | VARCHAR(255) | NOT NULL           | 사업자등록증 파일 경로 |
| introduction         | TEXT         |                    | 자기소개               |
| portfolio            | TEXT         |                    | 경력/포트폴리오        |
| status               | VARCHAR(20)  | DEFAULT 'pending'  | 상태                   |
| rejection_reason     | TEXT         |                    | 반려 사유              |
| approved_at          | TIMESTAMP    |                    | 승인 일시              |
| created_at           | TIMESTAMP    | DEFAULT NOW()      | 등록 요청일시          |
| updated_at           | TIMESTAMP    |                    | 수정일시               |

**status 값**: `pending`, `approved`, `rejected`, `inactive`

```sql
CREATE TABLE partner (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    representative_name VARCHAR(50) NOT NULL,
    contact_name VARCHAR(50) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    services JSONB NOT NULL,
    regions JSONB NOT NULL,
    business_license_url VARCHAR(255) NOT NULL,
    introduction TEXT,
    portfolio TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_partner_status ON partner(status);
```

### 3.6 ServiceType (서비스 유형)

서비스 유형 마스터 데이터를 저장합니다.

| 컬럼명        | 타입        | 제약조건           | 설명        |
| ------------- | ----------- | ------------------ | ----------- |
| id            | BIGINT      | PK, AUTO_INCREMENT | 서비스 ID   |
| code          | VARCHAR(20) | UNIQUE, NOT NULL   | 서비스 코드 |
| name          | VARCHAR(50) | NOT NULL           | 서비스명    |
| description   | TEXT        |                    | 설명        |
| options       | JSONB       |                    | 세부 옵션   |
| display_order | INT         | DEFAULT 0          | 표시 순서   |
| is_active     | BOOLEAN     | DEFAULT true       | 활성 상태   |
| created_at    | TIMESTAMP   | DEFAULT NOW()      | 생성일시    |

```sql
CREATE TABLE service_type (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    options JSONB,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**초기 데이터**

```sql
INSERT INTO service_type (code, name, description, display_order) VALUES
('weeding', '제초', '잡초 제거 서비스', 1),
('garden', '정원관리', '정원 가꾸기 서비스', 2),
('cleaning', '외벽청소', '외벽 및 지붕 청소 서비스', 3),
('repair', '간단수리', '간단한 시설 수리 서비스', 4),
('other', '기타', '기타 홈케어 서비스', 99);
```

### 3.7 Region (서비스 지역)

서비스 가능 지역 마스터 데이터를 저장합니다.

| 컬럼명        | 타입        | 제약조건           | 설명      |
| ------------- | ----------- | ------------------ | --------- |
| id            | BIGINT      | PK, AUTO_INCREMENT | 지역 ID   |
| code          | VARCHAR(20) | UNIQUE, NOT NULL   | 지역 코드 |
| name          | VARCHAR(50) | NOT NULL           | 지역명    |
| display_order | INT         | DEFAULT 0          | 표시 순서 |
| is_active     | BOOLEAN     | DEFAULT true       | 활성 상태 |
| created_at    | TIMESTAMP   | DEFAULT NOW()      | 생성일시  |

```sql
CREATE TABLE region (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**초기 데이터**

```sql
INSERT INTO region (code, name, display_order) VALUES
('yangpyeong', '양평', 1),
('gapyeong', '가평', 2),
('other', '기타', 99);
```

### 3.8 SMSLog (SMS 발송 이력)

SMS 발송 이력을 저장합니다.

| 컬럼명         | 타입         | 제약조건           | 설명           |
| -------------- | ------------ | ------------------ | -------------- |
| id             | BIGINT       | PK, AUTO_INCREMENT | 로그 ID        |
| application_id | BIGINT       |                    | 관련 신청 ID   |
| partner_id     | BIGINT       |                    | 관련 파트너 ID |
| phone          | VARCHAR(20)  | NOT NULL           | 수신 번호      |
| message        | TEXT         | NOT NULL           | 메시지 내용    |
| template_id    | BIGINT       |                    | 사용 템플릿 ID |
| status         | VARCHAR(20)  | NOT NULL           | 발송 상태      |
| external_id    | VARCHAR(100) |                    | 알리고 발송 ID |
| sent_at        | TIMESTAMP    |                    | 발송 일시      |
| admin_id       | BIGINT       |                    | 발송 관리자 ID |
| created_at     | TIMESTAMP    | DEFAULT NOW()      | 생성일시       |

**status 값**: `pending`, `sent`, `failed`

```sql
CREATE TABLE sms_log (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT,
    partner_id BIGINT,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    template_id BIGINT,
    status VARCHAR(20) NOT NULL,
    external_id VARCHAR(100),
    sent_at TIMESTAMP,
    admin_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_log_application_id ON sms_log(application_id);
CREATE INDEX idx_sms_log_created_at ON sms_log(created_at);
```

### 3.9 SMSTemplate (SMS 템플릿)

자주 사용하는 SMS 메시지 템플릿을 저장합니다.

| 컬럼명     | 타입        | 제약조건           | 설명           |
| ---------- | ----------- | ------------------ | -------------- |
| id         | BIGINT      | PK, AUTO_INCREMENT | 템플릿 ID      |
| name       | VARCHAR(50) | NOT NULL           | 템플릿명       |
| content    | TEXT        | NOT NULL           | 메시지 내용    |
| variables  | JSONB       |                    | 사용 변수 목록 |
| is_active  | BOOLEAN     | DEFAULT true       | 활성 상태      |
| created_at | TIMESTAMP   | DEFAULT NOW()      | 생성일시       |

```sql
CREATE TABLE sms_template (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**초기 데이터 예시**

```sql
INSERT INTO sms_template (name, content, variables) VALUES
('신청 접수 안내', '[전방홈케어] {customer_name}님, 서비스 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.', '["customer_name"]'),
('방문 일정 안내', '[전방홈케어] {customer_name}님, {visit_date} {visit_time} 방문 예정입니다.', '["customer_name", "visit_date", "visit_time"]'),
('파트너 승인 안내', '[전방홈케어] {company_name} 담당자님, 파트너 등록이 승인되었습니다.', '["company_name"]');
```

### 3.10 CompanyInfo (회사 정보)

회사 기본 정보를 저장합니다 (단일 레코드).

| 컬럼명          | 타입         | 제약조건 | 설명             |
| --------------- | ------------ | -------- | ---------------- |
| id              | BIGINT       | PK       | 설정 ID (항상 1) |
| company_name    | VARCHAR(100) | NOT NULL | 회사명           |
| representative  | VARCHAR(50)  | NOT NULL | 대표자           |
| address         | VARCHAR(255) | NOT NULL | 주소             |
| phone           | VARCHAR(20)  | NOT NULL | 연락처           |
| business_number | VARCHAR(20)  | NOT NULL | 사업자번호       |
| updated_at      | TIMESTAMP    |          | 수정일시         |

```sql
CREATE TABLE company_info (
    id BIGINT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(100) NOT NULL,
    representative VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    business_number VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);
```

### 3.11 QRCode (QR 코드)

생성된 QR 코드 정보를 저장합니다.

| 컬럼명     | 타입         | 제약조건           | 설명             |
| ---------- | ------------ | ------------------ | ---------------- |
| id         | BIGINT       | PK, AUTO_INCREMENT | QR 코드 ID       |
| name       | VARCHAR(100) | NOT NULL           | QR 코드명        |
| content    | TEXT         | NOT NULL           | 인코딩된 내용    |
| image_url  | VARCHAR(255) | NOT NULL           | 이미지 파일 경로 |
| admin_id   | BIGINT       |                    | 생성 관리자 ID   |
| created_at | TIMESTAMP    | DEFAULT NOW()      | 생성일시         |

```sql
CREATE TABLE qr_code (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    admin_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. JSONB 필드 구조

### 4.1 Application.services

```json
[
  {
    "code": "weeding",
    "options": {
      "area": "100-200평"
    }
  },
  {
    "code": "garden",
    "options": null
  }
]
```

### 4.2 Application.attachments

```json
[
  {
    "id": "uuid-1234",
    "filename": "photo1.jpg",
    "url": "/uploads/uuid-1234.jpg"
  }
]
```

### 4.3 Partner.services

```json
["weeding", "garden", "cleaning"]
```

### 4.4 Partner.regions

```json
["yangpyeong", "gapyeong"]
```

### 4.5 ServiceType.options

```json
[
  {
    "key": "area",
    "label": "면적",
    "values": ["100평 미만", "100-200평", "200평 이상"]
  }
]
```

### 4.6 SMSTemplate.variables

```json
["customer_name", "visit_date", "visit_time"]
```

## 5. 암호화 정책

### 5.1 암호화 대상 필드

- `application.customer_name`
- `application.customer_phone`
- `application.customer_address`
- `application.customer_address_detail`
- `partner.phone`

### 5.2 암호화 방식

- **알고리즘**: AES-256-GCM
- **키 관리**: 환경 변수로 관리 (`ENCRYPTION_KEY`)
- **구현**: 애플리케이션 레벨에서 암/복호화

## 6. 마이그레이션

### 6.1 Alembic 사용

```bash
# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 적용
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1
```

### 6.2 초기 데이터 시딩

```bash
python -m app.scripts.seed_data
```
