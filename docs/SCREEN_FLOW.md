# 전방홈케어 화면 흐름도 v1.0

## 1. 고객 플로우 (Front Office)

```mermaid
flowchart TD
    subgraph 메인["메인 페이지"]
        M1[GNB 네비게이션]
        M2[Hero 배너]
        M3[서비스 소개]
        M4[프로세스 안내]
        M5[협력사 안내]
        M6[FAB 버튼]
        M7[Footer]
    end

    subgraph 견적신청["견적 신청 (3단계 마법사)"]
        A1[Step 1: 서비스 선택]
        A2[Step 2: 기본정보 입력]
        A3[Step 3: 확인 및 제출]
        A4[신청 완료]
    end

    subgraph 협력사등록["협력사 등록 (4단계 마법사)"]
        P1[Step 1: 서비스 선택]
        P2[Step 2: 지역 선택]
        P3[Step 3: 정보 입력]
        P4[Step 4: 확인 및 제출]
        P5[등록 완료]
    end

    subgraph 기타["기타 페이지"]
        F1[FAQ]
        F2[About]
    end

    M1 --> |견적 요청| A1
    M1 --> |협력사 등록| P1
    M1 --> |FAQ| F1
    M1 --> |회사소개| F2
    M6 --> |전화/문자| 외부연결

    A1 --> |다음| A2
    A2 --> |다음| A3
    A3 --> |제출| A4
    A2 --> |이전| A1
    A3 --> |이전| A2

    P1 --> |다음| P2
    P2 --> |다음| P3
    P3 --> |다음| P4
    P4 --> |제출| P5
    P2 --> |이전| P1
    P3 --> |이전| P2
    P4 --> |이전| P3

    A4 --> |확인| M1
    P5 --> |확인| M1
```

---

## 2. 관리자 플로우 (Back Office)

```mermaid
flowchart TD
    subgraph 인증["인증"]
        L1[로그인 페이지]
    end

    subgraph 메인화면["메인 화면"]
        D1[대시보드]
    end

    subgraph 신청관리["신청 관리"]
        AP1[신청 목록]
        AP2[신청 상세]
        AP3[상태 변경]
        AP4[협력사 배정]
        AP5[견적 작성]
        AP6[시공사진 관리]
        AP7[고객 URL 발송]
    end

    subgraph 협력사관리["협력사 관리"]
        PT1[협력사 목록]
        PT2[협력사 상세]
        PT3[승인/반려]
    end

    subgraph SMS관리["SMS 관리"]
        S1[SMS 발송]
        S2[발송 내역]
        S3[MMS 발송]
    end

    subgraph 일정관리["일정 관리"]
        SC1[캘린더 뷰]
        SC2[일정 상세]
    end

    subgraph 설정["설정"]
        ST1[프로필 수정]
        ST2[비밀번호 변경]
        ST3[계정 관리]
    end

    L1 --> |로그인 성공| D1

    D1 --> AP1
    D1 --> PT1
    D1 --> S1
    D1 --> SC1
    D1 --> ST1

    AP1 --> |클릭| AP2
    AP2 --> AP3
    AP2 --> AP4
    AP2 --> AP5
    AP2 --> AP6
    AP2 --> AP7

    PT1 --> |클릭| PT2
    PT2 --> PT3

    S1 --> S2
    S1 --> S3

    SC1 --> |일정 클릭| SC2

    ST1 --> ST2
    ST1 --> ST3
```

---

## 3. 서비스 프로세스 플로우 (7단계)

```mermaid
flowchart LR
    subgraph 1단계["1단계"]
        S1[고객 신청]
    end

    subgraph 2단계["2단계"]
        S2[신청 확인]
        S2A[상담 진행]
        S2B[SMS 발송]
    end

    subgraph 3단계["3단계"]
        S3[협력사 배정]
        S3A[배정 SMS]
    end

    subgraph 4단계["4단계"]
        S4[견적서 작성]
        S4A[고객 발송]
    end

    subgraph 5단계["5단계"]
        S5[고객 동의]
        S5A[시공사진 등록]
    end

    subgraph 6단계["6단계"]
        S6[결과 발송]
        S6A[고객 URL SMS]
    end

    subgraph 7단계["7단계"]
        S7[완료 보고]
        S7A[완료 SMS]
    end

    S1 --> S2
    S2 --> S2A
    S2A --> S2B
    S2 --> S3
    S3 --> S3A
    S3 --> S4
    S4 --> S4A
    S4 --> S5
    S5 --> S5A
    S5 --> S6
    S6 --> S6A
    S6 --> S7
    S7 --> S7A
```

---

## 4. 신청 상태 흐름

```mermaid
stateDiagram-v2
    [*] --> new: 고객 신청
    new --> consulting: 상담 시작
    consulting --> assigned: 협력사 배정
    assigned --> scheduled: 일정 확정
    scheduled --> completed: 작업 완료

    new --> cancelled: 취소
    consulting --> cancelled: 취소
    assigned --> cancelled: 취소
    scheduled --> cancelled: 취소

    completed --> [*]
    cancelled --> [*]
```

---

## 5. 협력사 상태 흐름

```mermaid
stateDiagram-v2
    [*] --> pending: 등록 신청
    pending --> approved: 승인
    pending --> rejected: 반려
    approved --> inactive: 비활성화
    inactive --> approved: 재활성화

    approved --> [*]
    rejected --> [*]
```

---

## 6. 페이지별 URL 구조

### Front Office (고객용)
| 페이지 | URL | 설명 |
|--------|-----|------|
| 메인 | `/` | 랜딩 페이지 |
| 견적 신청 | `/apply` | 3단계 마법사 |
| 협력사 등록 | `/partner/register` | 4단계 마법사 |
| FAQ | `/faq` | 자주 묻는 질문 |
| 회사소개 | `/about` | 전방홈케어 소개 |

### Back Office (관리자용)
| 페이지 | URL | 설명 |
|--------|-----|------|
| 로그인 | `/admin/login` | 관리자 로그인 |
| 대시보드 | `/admin` | 현황 요약 |
| 신청 목록 | `/admin/applications` | 신청 관리 |
| 신청 상세 | `/admin/applications/[id]` | 신청 상세 정보 |
| 협력사 목록 | `/admin/partners` | 협력사 관리 |
| 협력사 상세 | `/admin/partners/[id]` | 협력사 상세 정보 |
| SMS 관리 | `/admin/sms` | SMS 발송/내역 |
| 일정 관리 | `/admin/schedule` | 캘린더 뷰 |
| 설정 | `/admin/settings` | 프로필/계정 설정 |

---

## 7. 주요 기능별 접근 경로

### 견적서 발송
```
대시보드 → 신청 목록 → 신청 상세 → 협력사 배정 섹션 → [견적] 버튼 → 견적 모달 → SMS 발송
```

### 시공사진 등록
```
대시보드 → 신청 목록 → 신청 상세 → 협력사 배정 섹션 → [사진] 버튼 → 사진 모달 → 업로드
```

### 고객 결과 URL 발송
```
대시보드 → 신청 목록 → 신청 상세 → 협력사 배정 섹션 → [고객] 버튼 → URL 모달 → SMS 전송
```

### 협력사 승인
```
대시보드 → 협력사 목록 → 협력사 상세 → 승인/반려 버튼
```

### SMS 직접 발송
```
대시보드 → SMS 관리 → 수신자 입력 → 메시지 작성 → 발송
```

---

## 8. 데이터 흐름도

```mermaid
flowchart TB
    subgraph 고객["고객"]
        C1[웹 브라우저]
    end

    subgraph Frontend["Frontend (Next.js)"]
        F1[고객 페이지]
        F2[관리자 페이지]
    end

    subgraph Backend["Backend (FastAPI)"]
        B1[Public API]
        B2[Admin API]
        B3[SMS Service]
    end

    subgraph Database["Database (PostgreSQL)"]
        DB1[(applications)]
        DB2[(partners)]
        DB3[(sms_logs)]
        DB4[(admins)]
    end

    subgraph External["외부 서비스"]
        E1[알리고 SMS API]
        E2[도로명주소 API]
    end

    C1 <--> F1
    C1 <--> F2
    F1 <--> B1
    F2 <--> B2
    B1 <--> DB1
    B1 <--> DB2
    B2 <--> DB1
    B2 <--> DB2
    B2 <--> DB3
    B2 <--> DB4
    B3 <--> E1
    B1 <--> E2
    B2 <--> B3
```

---

**작성일**: 2025-12-30
**버전**: 1.0
