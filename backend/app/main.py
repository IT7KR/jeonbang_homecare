"""
전방홈케어 API - FastAPI Application
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup/shutdown events"""
    # Startup
    # 개발 환경에서만 테이블 자동 생성 (운영에서는 Alembic 사용)
    if settings.APP_ENV == "development":
        Base.metadata.create_all(bind=engine)

    # 업로드 디렉토리 생성
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # 서비스 코드 캐시 초기화 (SMS 발송 시 사용)
    from app.services.sms import load_service_cache
    db = SessionLocal()
    try:
        load_service_cache(db)
    finally:
        db.close()

    yield
    # Shutdown (필요시 정리 작업)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker/k8s"""
    return {"status": "healthy", "version": settings.APP_VERSION}


# API v1 라우터 등록
# 파일 서빙은 /api/v1/files/{token} 엔드포인트로 토큰 기반 접근
app.include_router(api_router, prefix="/api/v1")
