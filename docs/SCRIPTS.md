# 스크립트 사용 가이드

프로젝트 루트의 `scripts/` 디렉토리에는 개발 및 운영에 필요한 스크립트들이 있습니다.

## 개발 환경

### `./scripts/dev.sh` - 개발 서버 시작

```bash
./scripts/dev.sh
```

**기능**:
- 개발용 Docker Compose 설정으로 실행
- **Hot Reload 활성화**: 코드 수정 시 자동 반영
  - Backend: uvicorn `--reload` 옵션
  - Frontend: Next.js 개발 서버
- 볼륨 마운트로 로컬 코드 연결

**접속 URL**:
| 서비스 | URL |
|--------|-----|
| Frontend | http://localhost:3500 |
| Backend API | http://localhost:8000 |
| API 문서 (Swagger) | http://localhost:8000/docs |
| Adminer (DB 관리) | http://localhost:8080 |
| PostgreSQL | localhost:5437 |

**참고**: 80포트 충돌 시 nginx는 제외하고 실행됩니다. 개발 환경에서는 직접 포트 접속을 권장합니다.

### `./scripts/stop.sh` - 서버 중지

```bash
./scripts/stop.sh
```

모든 Docker 컨테이너를 중지합니다.

### `./scripts/logs.sh` - 로그 확인

```bash
# 모든 서비스 로그
./scripts/logs.sh

# 특정 서비스 로그
./scripts/logs.sh backend
./scripts/logs.sh frontend
./scripts/logs.sh db
./scripts/logs.sh nginx
```

실시간 로그를 확인합니다 (`docker compose logs -f`).

---

## 운영 환경

### `./scripts/deploy.sh` - 운영 배포

```bash
./scripts/deploy.sh
```

**기능**:
- 운영용 Docker Compose 설정으로 빌드 및 배포
- 최적화된 프로덕션 빌드
- 환경 변수 검증

### `./scripts/prod.sh` - 운영 서버 직접 실행

```bash
./scripts/prod.sh
```

운영 설정으로 컨테이너를 시작합니다 (배포 전 로컬 테스트용).

---

## 데이터베이스 관리

### `./scripts/backup.sh` - DB 백업

```bash
./scripts/backup.sh
```

**기능**:
- PostgreSQL 데이터베이스 전체 백업
- 압축 파일 생성: `backups/backup_YYYYMMDD_HHMMSS.sql.gz`
- 자동으로 `backups/` 디렉토리 생성

### `./scripts/restore.sh` - DB 복원

```bash
./scripts/restore.sh backups/backup_20251126_120000.sql.gz
```

**주의**: 기존 데이터가 모두 삭제되고 백업 데이터로 대체됩니다.

---

## 초기 설정

### `./scripts/generate-secrets.sh` - 시크릿 키 생성

```bash
./scripts/generate-secrets.sh
```

**기능**:
- `SECRET_KEY`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY` 자동 생성
- `.env` 파일에 추가 (기존 값이 없는 경우)

---

## 수동 Docker Compose 명령어

스크립트 대신 직접 Docker Compose를 사용할 수도 있습니다:

```bash
# 개발 환경 (Hot Reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 개발 환경 + 빌드
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 운영 환경
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 컨테이너 중지 및 삭제
docker compose down

# 컨테이너 + 볼륨 삭제 (데이터 포함)
docker compose down -v

# 특정 서비스만 재시작
docker compose restart backend

# 특정 서비스만 재빌드
docker compose build backend --no-cache
```

---

## 개발 팁

### 코드 수정 후 반영 확인

개발 모드에서는 코드 수정이 자동으로 반영됩니다:

- **Backend (Python)**: 저장 즉시 uvicorn이 자동 재시작
- **Frontend (Next.js)**: 저장 즉시 Fast Refresh 적용

반영이 안 될 경우:
```bash
# 특정 서비스 재시작
docker compose restart backend

# 또는 전체 재시작
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
```

### 의존성 추가 후

```bash
# Backend (requirements.txt 수정 후)
docker compose build backend --no-cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend

# Frontend (package.json 수정 후)
docker compose build frontend --no-cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend
```

### 로그에서 에러 확인

```bash
# 실시간 로그 (Ctrl+C로 종료)
docker compose logs -f backend frontend

# 최근 100줄만
docker compose logs --tail 100 backend
```
