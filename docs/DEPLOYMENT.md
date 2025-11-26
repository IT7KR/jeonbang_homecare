# 배포 가이드

## Quick Start (Docker Compose)

### 개발 환경 실행
```bash
# 1. 환경 설정
cp .env.example .env

# 2. 시크릿 키 생성
./scripts/generate-secrets.sh
# 출력된 값을 .env에 복사

# 3. 개발 서버 실행
./scripts/dev.sh

# 서비스 접속:
# - Frontend: http://localhost (또는 http://localhost:3000)
# - Backend API: http://localhost/api/v1 (또는 http://localhost:8000)
# - API Docs: http://localhost:8000/docs
# - Adminer (DB 관리): http://localhost:8080
```

### 운영 환경 배포
```bash
# 1. SSL 인증서 설치 (nginx/ssl/ 디렉토리)
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem nginx/ssl/

# 2. 운영 환경 실행
./scripts/prod.sh

# 또는 자동 배포 (백업 포함)
./scripts/deploy.sh
```

### 주요 스크립트
| 스크립트 | 설명 |
|---------|------|
| `scripts/dev.sh` | 개발 환경 실행 |
| `scripts/prod.sh` | 운영 환경 실행 |
| `scripts/stop.sh [dev\|prod]` | 컨테이너 중지 |
| `scripts/logs.sh [dev\|prod]` | 로그 확인 |
| `scripts/backup.sh` | 데이터베이스 백업 |
| `scripts/restore.sh <file>` | 데이터베이스 복원 |
| `scripts/deploy.sh` | 운영 배포 (백업+빌드+시작) |
| `scripts/generate-secrets.sh` | 시크릿 키 생성 |

---

## 1. 배포 환경 개요

### 1.1 인프라 구성
- **호스팅**: AWS Lightsail
- **타입**: Container 또는 Instance
- **리전**: ap-northeast-2 (서울)
- **SSL**: Let's Encrypt 또는 AWS Certificate Manager

### 1.2 시스템 요구사항
| 항목 | 최소 사양 | 권장 사양 |
|------|----------|----------|
| vCPU | 1 | 2 |
| Memory | 1GB | 2GB |
| Storage | 20GB | 40GB |
| Database | Lightsail DB (1GB) | Lightsail DB (2GB) |

## 2. 사전 준비

### 2.1 도메인 설정
1. 도메인 등록 (예: jeonbang-homecare.com)
2. DNS 설정 (Route53 또는 외부 DNS)
   - A 레코드: @ → Lightsail 고정 IP
   - CNAME: www → @

### 2.2 SSL 인증서 발급
```bash
# Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d jeonbang-homecare.com -d www.jeonbang-homecare.com
```

### 2.3 환경 변수 준비
**Production 환경 변수 체크리스트**:
- [ ] `SECRET_KEY` - 강력한 랜덤 문자열
- [ ] `JWT_SECRET_KEY` - JWT 서명 키
- [ ] `ENCRYPTION_KEY` - 32자 암호화 키
- [ ] `DATABASE_URL` - 프로덕션 DB URL
- [ ] `ALIGO_API_KEY` - 알리고 API 키
- [ ] `ALIGO_USER_ID` - 알리고 사용자 ID
- [ ] `ALIGO_SENDER` - 발신번호

## 3. AWS Lightsail 설정

### 3.1 Instance 생성
1. AWS Lightsail 콘솔 접속
2. "인스턴스 생성" 클릭
3. 설정:
   - 플랫폼: Linux/Unix
   - 블루프린트: Ubuntu 22.04 LTS
   - 인스턴스 플랜: $10/월 (2GB RAM) 이상
4. 고정 IP 연결

### 3.2 Database 생성
1. "데이터베이스 생성" 클릭
2. 설정:
   - 엔진: PostgreSQL 15
   - 플랜: $15/월 이상
   - 고가용성: 필요 시 활성화
3. 연결 정보 확인 및 저장

### 3.3 방화벽 설정
```
포트 22 (SSH): 관리 IP만 허용
포트 80 (HTTP): 전체 허용
포트 443 (HTTPS): 전체 허용
포트 5432 (PostgreSQL): 인스턴스 IP만 허용
```

## 4. 서버 초기 설정

### 4.1 시스템 업데이트
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 필수 패키지 설치
```bash
# 기본 패키지
sudo apt install -y git curl wget vim

# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
sudo npm install -g pnpm

# Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Nginx
sudo apt install -y nginx

# 기타 도구
sudo apt install -y supervisor
```

### 4.3 프로젝트 디렉토리 설정
```bash
sudo mkdir -p /var/www/jeonbang-homecare
sudo chown $USER:$USER /var/www/jeonbang-homecare
```

## 5. 애플리케이션 배포

### 5.1 코드 배포
```bash
cd /var/www/jeonbang-homecare

# Git 클론 (처음)
git clone https://github.com/your-org/jeonbang-homecare.git .

# 또는 업데이트
git pull origin main
```

### 5.2 Backend 배포
```bash
cd /var/www/jeonbang-homecare/backend

# 가상환경 생성 및 활성화
python3.11 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
sudo vim /var/www/jeonbang-homecare/backend/.env
# (프로덕션 환경 변수 입력)

# 마이그레이션 실행
alembic upgrade head

# 초기 데이터 시딩 (처음만)
python -m app.scripts.seed_data
```

### 5.3 Frontend 배포
```bash
cd /var/www/jeonbang-homecare/frontend

# 의존성 설치
pnpm install

# 환경 변수 설정
sudo vim .env.production
# NEXT_PUBLIC_API_URL=https://api.jeonbang-homecare.com/api/v1

# 빌드
pnpm build
```

### 5.4 업로드 디렉토리 설정
```bash
sudo mkdir -p /var/www/jeonbang-homecare/uploads
sudo chown www-data:www-data /var/www/jeonbang-homecare/uploads
sudo chmod 755 /var/www/jeonbang-homecare/uploads
```

## 6. 프로세스 관리 (Supervisor)

### 6.1 Backend 설정
```ini
# /etc/supervisor/conf.d/jeonbang-backend.conf
[program:jeonbang-backend]
command=/var/www/jeonbang-homecare/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
directory=/var/www/jeonbang-homecare/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/jeonbang/backend.log
environment=PATH="/var/www/jeonbang-homecare/backend/venv/bin"
```

### 6.2 Frontend 설정
```ini
# /etc/supervisor/conf.d/jeonbang-frontend.conf
[program:jeonbang-frontend]
command=/usr/bin/pnpm start
directory=/var/www/jeonbang-homecare/frontend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/jeonbang/frontend.log
environment=NODE_ENV="production",PORT="3000"
```

### 6.3 로그 디렉토리 생성
```bash
sudo mkdir -p /var/log/jeonbang
sudo chown www-data:www-data /var/log/jeonbang
```

### 6.4 Supervisor 시작
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## 7. Nginx 설정

### 7.1 Backend API 설정
```nginx
# /etc/nginx/sites-available/api.jeonbang-homecare.com
server {
    listen 80;
    server_name api.jeonbang-homecare.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.jeonbang-homecare.com;

    ssl_certificate /etc/letsencrypt/live/jeonbang-homecare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jeonbang-homecare.com/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 파일 업로드 크기 제한
    client_max_body_size 50M;
}
```

### 7.2 Frontend 설정
```nginx
# /etc/nginx/sites-available/jeonbang-homecare.com
server {
    listen 80;
    server_name jeonbang-homecare.com www.jeonbang-homecare.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jeonbang-homecare.com www.jeonbang-homecare.com;

    ssl_certificate /etc/letsencrypt/live/jeonbang-homecare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jeonbang-homecare.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 정적 파일 (업로드)
    location /uploads {
        alias /var/www/jeonbang-homecare/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3 Nginx 활성화
```bash
sudo ln -s /etc/nginx/sites-available/api.jeonbang-homecare.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/jeonbang-homecare.com /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl reload nginx
```

## 8. 배포 스크립트

### 8.1 배포 스크립트 생성
```bash
#!/bin/bash
# /var/www/jeonbang-homecare/deploy.sh

set -e

echo "=== 전방 홈케어 배포 시작 ==="

# 1. 코드 업데이트
echo "1. 코드 업데이트..."
cd /var/www/jeonbang-homecare
git pull origin main

# 2. Backend 배포
echo "2. Backend 배포..."
cd /var/www/jeonbang-homecare/backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
deactivate

# 3. Frontend 배포
echo "3. Frontend 배포..."
cd /var/www/jeonbang-homecare/frontend
pnpm install
pnpm build

# 4. 서비스 재시작
echo "4. 서비스 재시작..."
sudo supervisorctl restart jeonbang-backend
sudo supervisorctl restart jeonbang-frontend

# 5. Nginx 재로드
echo "5. Nginx 재로드..."
sudo nginx -t && sudo systemctl reload nginx

echo "=== 배포 완료 ==="
```

### 8.2 실행 권한 부여
```bash
chmod +x /var/www/jeonbang-homecare/deploy.sh
```

## 9. 백업 설정

### 9.1 데이터베이스 백업 스크립트
```bash
#!/bin/bash
# /var/www/jeonbang-homecare/scripts/backup-db.sh

BACKUP_DIR="/var/backups/jeonbang"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="db_backup_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR

# PostgreSQL 백업
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/$FILENAME

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

### 9.2 Cron 설정
```bash
# crontab -e
# 매일 새벽 3시 백업
0 3 * * * /var/www/jeonbang-homecare/scripts/backup-db.sh >> /var/log/jeonbang/backup.log 2>&1
```

## 10. 모니터링

### 10.1 로그 확인
```bash
# Backend 로그
tail -f /var/log/jeonbang/backend.log

# Frontend 로그
tail -f /var/log/jeonbang/frontend.log

# Nginx 액세스 로그
tail -f /var/log/nginx/access.log

# Nginx 에러 로그
tail -f /var/log/nginx/error.log
```

### 10.2 프로세스 상태 확인
```bash
# Supervisor 상태
sudo supervisorctl status

# 포트 확인
sudo netstat -tlnp | grep -E '(3000|8000)'

# 디스크 사용량
df -h

# 메모리 사용량
free -m
```

### 10.3 헬스체크 설정
```bash
# /var/www/jeonbang-homecare/scripts/healthcheck.sh
#!/bin/bash

# Backend 체크
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$BACKEND" != "200" ]; then
    echo "Backend is down!" | mail -s "Alert: Backend Down" admin@example.com
    sudo supervisorctl restart jeonbang-backend
fi

# Frontend 체크
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" != "200" ]; then
    echo "Frontend is down!" | mail -s "Alert: Frontend Down" admin@example.com
    sudo supervisorctl restart jeonbang-frontend
fi
```

## 11. 롤백 절차

### 11.1 코드 롤백
```bash
cd /var/www/jeonbang-homecare

# 이전 커밋으로 롤백
git log --oneline -10  # 커밋 히스토리 확인
git checkout <commit-hash>

# 재배포
./deploy.sh
```

### 11.2 데이터베이스 롤백
```bash
# Alembic 다운그레이드
cd /var/www/jeonbang-homecare/backend
source venv/bin/activate
alembic downgrade -1
```

### 11.3 백업에서 복원
```bash
# 백업 파일 복원
gunzip -c /var/backups/jeonbang/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER $DB_NAME
```

## 12. 체크리스트

### 12.1 배포 전 체크리스트
- [ ] 로컬 환경에서 테스트 완료
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 확인
- [ ] SSL 인증서 유효성 확인
- [ ] 백업 완료

### 12.2 배포 후 체크리스트
- [ ] 사이트 접속 확인
- [ ] 로그인 기능 확인
- [ ] 신청 기능 확인
- [ ] SMS 발송 테스트
- [ ] 에러 로그 확인
- [ ] 성능 모니터링 확인
