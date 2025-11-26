# 개발 환경 설정 가이드

## 1. 필수 요구사항

### 1.1 시스템 요구사항
- **OS**: macOS, Linux, Windows (WSL2 권장)
- **RAM**: 최소 8GB (16GB 권장)
- **Disk**: 최소 10GB 여유 공간

### 1.2 필수 소프트웨어
| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| Node.js | 18.x 이상 | Frontend 개발 |
| pnpm | 8.x 이상 | 패키지 관리 (권장) |
| Python | 3.11 이상 | Backend 개발 |
| PostgreSQL | 15.x 이상 | 데이터베이스 |
| Git | 최신 | 버전 관리 |
| Docker | 최신 | 컨테이너 (선택) |

## 2. 프로젝트 클론

```bash
# 저장소 클론
git clone https://github.com/your-org/jeonbang-homecare.git
cd jeonbang-homecare
```

## 3. Frontend 설정

### 3.1 디렉토리 이동
```bash
cd frontend
```

### 3.2 의존성 설치
```bash
# pnpm 사용 (권장)
pnpm install

# 또는 npm 사용
npm install

# 또는 yarn 사용
yarn install
```

### 3.3 환경 변수 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local
```

**.env.local 내용**
```env
# API 서버 주소
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# 도로명주소 API 키
NEXT_PUBLIC_JUSO_API_KEY=your_juso_api_key

# 기타 설정
NEXT_PUBLIC_APP_ENV=development
```

### 3.4 shadcn/ui 설정
```bash
# shadcn/ui 초기화 (이미 설정된 경우 스킵)
pnpm dlx shadcn-ui@latest init

# 필요한 컴포넌트 추가
pnpm dlx shadcn-ui@latest add button input card dialog table calendar toast sheet form
```

### 3.5 개발 서버 실행
```bash
pnpm dev
# http://localhost:3000 에서 확인
```

### 3.6 빌드 및 테스트
```bash
# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 빌드
pnpm build

# 프로덕션 모드 실행
pnpm start
```

## 4. Backend 설정

### 4.1 디렉토리 이동
```bash
cd backend
```

### 4.2 가상환경 생성
```bash
# venv 사용
python -m venv venv

# 가상환경 활성화
# macOS/Linux
source venv/bin/activate

# Windows
.\venv\Scripts\activate
```

### 4.3 의존성 설치
```bash
pip install -r requirements.txt

# 개발용 의존성 포함
pip install -r requirements-dev.txt
```

### 4.4 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env
```

**.env 내용**
```env
# 앱 설정
APP_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/jeonbang_homecare

# JWT 설정
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120

# 암호화 키 (AES-256)
ENCRYPTION_KEY=your-32-character-encryption-key!

# 알리고 SMS API
ALIGO_API_KEY=your_aligo_api_key
ALIGO_USER_ID=your_aligo_user_id
ALIGO_SENDER=031-123-4567

# 파일 업로드
UPLOAD_DIR=/path/to/uploads
MAX_UPLOAD_SIZE=10485760  # 10MB

# CORS
CORS_ORIGINS=http://localhost:3000
```

### 4.5 데이터베이스 설정

#### PostgreSQL 설치 및 설정
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 데이터베이스 생성
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 및 사용자 생성
CREATE USER jeonbang WITH PASSWORD 'your_password';
CREATE DATABASE jeonbang_homecare OWNER jeonbang;
GRANT ALL PRIVILEGES ON DATABASE jeonbang_homecare TO jeonbang;
\q
```

### 4.6 마이그레이션 실행
```bash
# Alembic 마이그레이션 적용
alembic upgrade head

# 초기 데이터 시딩
python -m app.scripts.seed_data
```

### 4.7 개발 서버 실행
```bash
# uvicorn 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는 스크립트 사용
python run.py
```

### 4.8 API 문서 확인
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4.9 테스트 실행
```bash
# 전체 테스트
pytest

# 커버리지 포함
pytest --cov=app --cov-report=html

# 특정 테스트 파일
pytest tests/test_applications.py

# 특정 테스트 함수
pytest tests/test_applications.py::test_create_application
```

## 5. Docker를 이용한 설정 (선택)

### 5.1 Docker Compose 실행
```bash
# 전체 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 5.2 docker-compose.yml 예시
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: jeonbang
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: jeonbang_homecare
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://jeonbang:your_password@db:5432/jeonbang_homecare
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## 6. IDE 설정

### 6.1 VS Code 권장 확장
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "prisma.prisma",
    "eamodio.gitlens"
  ]
}
```

### 6.2 VS Code 설정
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## 7. 외부 API 키 발급

### 7.1 도로명주소 API
1. [도로명주소 API](https://www.juso.go.kr/addrlink/devAddrLinkRequestWrite.do) 접속
2. 회원가입 및 로그인
3. API 신청서 작성
4. 승인 후 API 키 발급
5. `.env.local`의 `NEXT_PUBLIC_JUSO_API_KEY`에 설정

### 7.2 알리고 SMS API
1. [알리고](https://smartsms.aligo.in/) 접속
2. 회원가입 및 로그인
3. API 연동 신청
4. API Key, User ID 발급
5. `.env`의 `ALIGO_*` 환경변수에 설정

## 8. 개발 워크플로우

### 8.1 브랜치 전략
```
main          # 프로덕션 배포 브랜치
├── develop   # 개발 통합 브랜치
│   ├── feature/xxx  # 기능 개발
│   ├── bugfix/xxx   # 버그 수정
│   └── hotfix/xxx   # 긴급 수정
```

### 8.2 커밋 메시지 규칙
```
<type>: <subject>

<body>

<footer>
```

**Type 종류**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**예시**
```
feat: 서비스 신청 폼 Step 1 구현

- 고객 기본 정보 입력 폼 추가
- 전화번호 자동 포맷팅 적용
- 주소 검색 API 연동

Closes #12
```

## 9. 문제 해결

### 9.1 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :8000

# 프로세스 종료
kill -9 <PID>
```

### 9.2 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
pg_isready -h localhost -p 5432

# PostgreSQL 재시작
# macOS
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql
```

### 9.3 의존성 문제
```bash
# Frontend - 캐시 삭제 후 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Backend - 가상환경 재생성
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 9.4 마이그레이션 오류
```bash
# 마이그레이션 히스토리 확인
alembic history

# 특정 버전으로 다운그레이드
alembic downgrade <revision>

# 마이그레이션 초기화 (주의: 데이터 손실)
alembic downgrade base
alembic upgrade head
```
