from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_NAME: str = "전방홈케어 API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://jeonbang:password@localhost:5432/homecare"

    # JWT
    SECRET_KEY: str = "your-secret-key"
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1시간
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 14    # 14일

    # Encryption (for customer data)
    ENCRYPTION_KEY: str = "your-encryption-key"

    # Search Index Hash Salt (for encrypted field search)
    SEARCH_HASH_SALT: str = "jeonbang_homecare_search_salt"

    # Aligo SMS
    ALIGO_API_KEY: str = ""
    ALIGO_USER_ID: str = ""
    ALIGO_SENDER: str = ""

    # File Upload
    # 파일 저장 경로 (웹 루트 외부에 격리)
    # - 개발 환경: /app/uploads (편의상 앱 디렉토리 내)
    # - 운영 환경: /data/uploads (격리된 볼륨)
    UPLOAD_DIR: str = "/data/uploads"

    # File Access Control
    # 파일 접근 모드: public | admin_only | owner_only
    # - public: 토큰만으로 접근 가능 (기본값)
    # - admin_only: 관리자 JWT 인증 필수
    # - owner_only: 담당 관리자만 접근 가능 (추후 구현)
    FILE_ACCESS_MODE: str = "public"

    # Logging
    LOG_LEVEL: str = "INFO"           # DEBUG, INFO, WARNING, ERROR
    LOG_RETENTION_DAYS: int = 90      # 로그 파일 보관 일수
    LOG_DIR: str = "/data/logs"       # 로그 파일 저장 경로

    # Frontend URL (for partner portal links)
    FRONTEND_URL: str = "http://localhost:3500"
    BASE_PATH: str = ""  # 운영 환경에서 /homecare

    # CORS
    CORS_ORIGINS: str = "http://localhost:3500"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
