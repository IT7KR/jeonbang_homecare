from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


# ============================================================
# 동기 엔진 (Alembic 마이그레이션용)
# ============================================================
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
)

# 동기 세션 팩토리 (레거시 코드용 - deprecated)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ============================================================
# 비동기 엔진 (메인 애플리케이션용)
# ============================================================
def _get_async_database_url() -> str:
    """PostgreSQL URL을 asyncpg 드라이버용으로 변환"""
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    return url


async_engine = create_async_engine(
    _get_async_database_url(),
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
)

# 비동기 세션 팩토리
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


# ============================================================
# 의존성 주입 함수
# ============================================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """비동기 데이터베이스 세션 의존성 (FastAPI Depends용)"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db():
    """
    동기 데이터베이스 세션 의존성 (레거시 코드용)

    Warning:
        이 함수는 deprecated입니다.
        새 코드에서는 get_db()를 사용하세요.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
