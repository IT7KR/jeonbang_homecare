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

    # Aligo SMS
    ALIGO_API_KEY: str = ""
    ALIGO_USER_ID: str = ""
    ALIGO_SENDER: str = ""

    # File Upload
    UPLOAD_DIR: str = "/app/uploads"

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
