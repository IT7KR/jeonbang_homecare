"""
전방홈케어 API - FastAPI Application
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import async_engine, engine, Base, AsyncSessionLocal
from app.core.logging_config import setup_logging
from app.api.v1.router import api_router
from app.middleware import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup/shutdown events"""
    # Startup
    # 로깅 초기화
    setup_logging()

    # 개발 환경에서만 테이블 자동 생성 (운영에서는 Alembic 사용)
    if settings.APP_ENV == "development":
        # 비동기 엔진으로 테이블 생성
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # 업로드 디렉토리 생성
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # 로그 디렉토리 생성
    os.makedirs(settings.LOG_DIR, exist_ok=True)

    # 서비스 코드 캐시 초기화 (SMS 발송 시 사용)
    from app.services.sms import load_service_cache_async
    async with AsyncSessionLocal() as db:
        await load_service_cache_async(db)

    yield

    # Shutdown: 비동기 엔진 정리
    await async_engine.dispose()


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

# 로깅 미들웨어
app.add_middleware(LoggingMiddleware)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker/k8s"""
    return {"status": "healthy", "version": settings.APP_VERSION}


# API v1 라우터 등록
# 파일 서빙은 /api/v1/files/{token} 엔드포인트로 토큰 기반 접근
app.include_router(api_router, prefix="/api/v1")
