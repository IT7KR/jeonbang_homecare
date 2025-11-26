"""
전방홈케어 API - FastAPI Application
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup/shutdown events"""
    # Startup
    # 개발 환경에서만 테이블 자동 생성 (운영에서는 Alembic 사용)
    if settings.APP_ENV == "development":
        Base.metadata.create_all(bind=engine)
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
app.include_router(api_router, prefix="/api/v1")

# 정적 파일 서빙 (업로드된 파일)
# /uploads/* 경로로 접근 가능
UPLOAD_DIR = "/app/uploads"
if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
