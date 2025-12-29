"""
로깅 설정 모듈

- 일별 로그 로테이션 (TimedRotatingFileHandler)
- 설정 가능한 보관 기간 (LOG_RETENTION_DAYS)
- 에러 로그 별도 파일 분리
"""

import logging
import sys
from pathlib import Path
from logging.handlers import TimedRotatingFileHandler
from .config import settings


def setup_logging() -> None:
    """애플리케이션 로깅 초기화"""

    # 로그 디렉토리 생성
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)

    # 로그 레벨 설정
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # 포맷 설정
    log_format = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(log_format, datefmt=date_format)

    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # 기존 핸들러 제거 (중복 방지)
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 1. 콘솔 핸들러 (모든 로그)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 2. 파일 핸들러 - 전체 로그 (일별 로테이션)
    app_log_path = log_dir / "app.log"
    app_handler = TimedRotatingFileHandler(
        filename=app_log_path,
        when="midnight",
        interval=1,
        backupCount=settings.LOG_RETENTION_DAYS,
        encoding="utf-8",
    )
    app_handler.setLevel(log_level)
    app_handler.setFormatter(formatter)
    app_handler.suffix = "%Y-%m-%d"  # app.log.2025-01-15 형식
    root_logger.addHandler(app_handler)

    # 3. 파일 핸들러 - 에러 전용 (일별 로테이션)
    error_log_path = log_dir / "error.log"
    error_handler = TimedRotatingFileHandler(
        filename=error_log_path,
        when="midnight",
        interval=1,
        backupCount=settings.LOG_RETENTION_DAYS,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    error_handler.suffix = "%Y-%m-%d"
    root_logger.addHandler(error_handler)

    # 외부 라이브러리 로그 레벨 조정 (너무 시끄러운 것들)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # 초기화 완료 로그
    logging.info(
        f"Logging initialized: level={settings.LOG_LEVEL}, "
        f"retention={settings.LOG_RETENTION_DAYS}days, "
        f"dir={settings.LOG_DIR}"
    )
