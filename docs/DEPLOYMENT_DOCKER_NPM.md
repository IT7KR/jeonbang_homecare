# 온프레미스 서버 배포 가이드

> Docker + Nginx Proxy Manager 기반 배포

## 환경 정보
- **OS**: Ubuntu/Debian
- **리버스 프록시**: Nginx Proxy Manager (GUI)
- **배포 경로**: 서브경로 `/homecare`

## 배포 아키텍처

```
Internet
    ↓
Nginx Proxy Manager (port 80/443, SSL 종료 + 리버스 프록시)
    ↓ /homecare/* → localhost:3000
    ↓ /homecare/api/* → localhost:8000
Docker Network (jeonbang-network)
├── Frontend Container (포트 3000 노출) ← Next.js standalone
├── Backend Container (포트 8000 노출) ← FastAPI
├── Database Container (내부 5432) ← PostgreSQL 15
└── Docker Volumes
    ├── postgres_data (DB 데이터)
    ├── uploads_data (파일 업로드)
    └── logs_data (로그)
```

---

## 배포 단계

### 1단계: 서버 사전 준비

```bash
# 필수 패키지 설치 (Ubuntu/Debian 기준)
sudo apt update
sudo apt install -y docker.io docker-compose git curl

# Docker 서비스 시작 및 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가 (재로그인 필요)
sudo usermod -aG docker $USER
```

### 2단계: 프로젝트 클론 및 환경 설정

```bash
# 프로젝트 클론
cd /opt
sudo git clone <repository-url> jeonbang-homecare
sudo chown -R $USER:$USER jeonbang-homecare
cd jeonbang-homecare

# 환경 파일 복사 및 수정
cp .env.example .env

# 시크릿 키 생성 (필수!)
./scripts/generate-secrets.sh
```

### 3단계: 환경 변수 설정 (.env 파일)

```ini
# 필수 수정 항목
APP_ENV=production
NODE_ENV=production

# 데이터베이스 (generate-secrets.sh로 생성된 값 사용)
DB_USER=jeonbang
DB_PASSWORD=<생성된_강력한_비밀번호>
DB_NAME=homecare
DB_PORT=5432

# 보안 키 (generate-secrets.sh로 생성된 값 사용)
SECRET_KEY=<생성된_키>
JWT_SECRET_KEY=<생성된_키>
ENCRYPTION_KEY=<생성된_키>

# API URL 설정 (실제 도메인으로 변경)
NEXT_PUBLIC_API_URL=https://yourdomain.com/homecare/api/v1
NEXT_PUBLIC_BASE_PATH=/homecare
CORS_ORIGINS=https://yourdomain.com

# Aligo SMS API (실제 키로 변경)
ALIGO_API_KEY=<your_api_key>
ALIGO_USER_ID=<your_user_id>
ALIGO_SENDER=<발신번호>

# 주소 검색 API
NEXT_PUBLIC_JUSO_API_KEY=<행정안전부_API_키>

# 로깅
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=90
```

### 4단계: 프로덕션 빌드 및 실행

```bash
# 프로덕션 배포 (자동 백업 + 빌드 + 헬스체크)
./scripts/deploy.sh

# 또는 수동 실행
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 5단계: Nginx Proxy Manager 설정

NPM GUI에서 다음과 같이 설정합니다.

#### 5-1. Proxy Host 추가 (Frontend)

1. **Dashboard → Proxy Hosts → Add Proxy Host**
2. **Details 탭**:
   - Domain Names: `yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `localhost` (또는 서버 IP)
   - Forward Port: `3000`
   - ✅ Block Common Exploits
   - ✅ Websockets Support

3. **Custom locations 탭** (API 라우팅):
   ```
   Location: /homecare/api
   Scheme: http
   Forward Hostname/IP: localhost
   Forward Port: 8000
   ```

   ```
   Location: /homecare/uploads
   Scheme: http
   Forward Hostname/IP: localhost
   Forward Port: 8000
   ```

4. **SSL 탭**:
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - SSL Certificate: Request a new SSL Certificate with Let's Encrypt
   - ✅ I Agree to the Let's Encrypt Terms

5. **Advanced 탭** (커스텀 설정):
   ```nginx
   # 서브경로 프록시 설정
   location /homecare {
       proxy_pass http://localhost:3000/homecare;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
   }

   location /homecare/api {
       proxy_pass http://localhost:8000/api;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }

   location /homecare/uploads {
       proxy_pass http://localhost:8000/uploads;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
   }
   ```

---

## 운영 관리 명령어

### 서비스 상태 확인
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 로그 확인
```bash
./scripts/logs.sh prod backend   # 백엔드 로그
./scripts/logs.sh prod frontend  # 프론트엔드 로그
./scripts/logs.sh prod db        # DB 로그
```

### 백업
```bash
./scripts/backup.sh  # backups/ 디렉토리에 저장
```

### 재시작
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### 업데이트 배포
```bash
./scripts/deploy.sh  # 자동 백업 → pull → 빌드 → 재시작 → 헬스체크
```

---

## 포트 사용 현황

| 용도 | 내부 포트 | 외부 노출 |
|------|----------|----------|
| Frontend (Next.js) | 3000 | localhost:3000 (NPM 프록시) |
| Backend (FastAPI) | 8000 | localhost:8000 (NPM 프록시) |
| PostgreSQL | 5432 | 미노출 (보안) |
| Nginx Proxy Manager HTTP | - | 80 |
| Nginx Proxy Manager HTTPS | - | 443 |
| NPM Admin UI | 81 | 관리 인터페이스 |

---

## 배포 전 체크리스트

### 서버 준비
- [ ] Docker, Docker Compose 설치
- [ ] Git 설치 및 프로젝트 클론
- [ ] Nginx Proxy Manager 설치 및 실행

### 환경 설정
- [ ] `./scripts/generate-secrets.sh` 실행
- [ ] `.env` 파일에 프로덕션 값 설정
- [ ] `NEXT_PUBLIC_API_URL=https://yourdomain.com/homecare/api/v1`
- [ ] `NEXT_PUBLIC_BASE_PATH=/homecare`
- [ ] `CORS_ORIGINS=https://yourdomain.com`
- [ ] Aligo SMS API 키 설정
- [ ] 주소검색 API 키 설정

### Docker 설정
- [ ] `docker-compose.prod.yml`에 포트 노출 확인 (3000, 8000)
- [ ] 컨테이너 빌드 및 실행

### Nginx Proxy Manager 설정
- [ ] Proxy Host 추가 (도메인 → localhost:3000)
- [ ] Custom Location 추가 (/homecare/api → localhost:8000)
- [ ] SSL 인증서 발급 (Let's Encrypt)
- [ ] Advanced 설정 (nginx 커스텀 설정)

### 검증
- [ ] 방화벽 80/443 포트 오픈
- [ ] 헬스체크 확인 (`curl https://yourdomain.com/homecare/api/v1/health`)
- [ ] 프론트엔드 접속 확인 (`https://yourdomain.com/homecare`)

---

## 문제 해결

### 컨테이너가 시작되지 않을 때
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs
```

### DB 연결 오류
```bash
# DB 컨테이너 상태 확인
docker compose exec db psql -U jeonbang -d homecare -c "SELECT 1"
```

### NPM 프록시 502/504 에러
```bash
# 컨테이너 실행 및 포트 확인
docker ps

# 포트 리스닝 확인
netstat -tlnp | grep -E "3000|8000"

# NPM 로그 확인 (NPM도 Docker로 운영 시)
docker logs nginx-proxy-manager

# 직접 연결 테스트
curl http://localhost:3000/homecare
curl http://localhost:8000/api/v1/health
```

### 서브경로 라우팅 문제
- `NEXT_PUBLIC_BASE_PATH=/homecare` 확인
- Next.js 재빌드 필요 (환경변수 변경 시)
- NPM Advanced 설정의 location 경로 확인

---

## 주의사항

1. **보안**: `.env` 파일은 절대 Git에 커밋하지 않음
2. **백업**: 정기적인 DB 백업 (cron 설정 권장)
3. **모니터링**: 로그 확인 및 디스크 공간 관리
4. **업데이트**: 배포 전 항상 백업 수행
5. **NPM**: 포트 3000, 8000은 localhost에서만 접근 가능하도록 방화벽 설정
