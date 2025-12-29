"""
요청/응답 로깅 미들웨어

수집 정보:
- 요청: URL, Method, Query Params
- 클라이언트: IP (X-Forwarded-For 포함), User-Agent
- 인증: 관리자 정보 (있는 경우)
- 에러: 메시지, 스택트레이스
- 메타: 타임스탬프, 응답시간, 상태코드
"""

import time
import logging
import traceback
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("api.access")


def get_client_ip(request: Request) -> str:
    """클라이언트 IP 추출 (프록시 뒤에서도 실제 IP 획득)"""
    # X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # 첫 번째 IP가 실제 클라이언트
        return forwarded_for.split(",")[0].strip()

    # X-Real-IP 헤더 확인 (Nginx)
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip

    # 직접 연결
    if request.client:
        return request.client.host

    return "unknown"


def get_admin_info(request: Request) -> Optional[str]:
    """요청에서 관리자 정보 추출 (인증된 경우)"""
    # 의존성 주입으로 설정된 admin 정보 확인
    if hasattr(request.state, "admin"):
        admin = request.state.admin
        if admin:
            return f"{admin.email} (id:{admin.id})"
    return None


def truncate_string(s: str, max_length: int = 200) -> str:
    """긴 문자열 잘라내기"""
    if len(s) > max_length:
        return s[:max_length] + "..."
    return s


class LoggingMiddleware(BaseHTTPMiddleware):
    """HTTP 요청/응답 로깅 미들웨어"""

    # 로깅 제외 경로 (헬스체크, 정적 파일 등)
    EXCLUDE_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next) -> Response:
        # 제외 경로 체크
        if request.url.path in self.EXCLUDE_PATHS:
            return await call_next(request)

        # 요청 정보 수집
        start_time = time.time()
        client_ip = get_client_ip(request)
        user_agent = truncate_string(request.headers.get("user-agent", "unknown"))
        method = request.method
        path = request.url.path
        query = str(request.query_params) if request.query_params else ""

        try:
            # 요청 처리
            response = await call_next(request)
            duration = time.time() - start_time

            # 관리자 정보 (인증 후 사용 가능)
            admin_info = get_admin_info(request)

            # 로그 레벨 결정
            if response.status_code >= 500:
                log_level = logging.ERROR
            elif response.status_code >= 400:
                log_level = logging.WARNING
            else:
                log_level = logging.INFO

            # 로그 메시지 구성
            log_parts = [
                f"{client_ip}",
                f"{method} {path}",
                f"status={response.status_code}",
                f"duration={duration:.3f}s",
            ]

            if query:
                log_parts.insert(2, f"query={query}")

            if admin_info:
                log_parts.append(f"admin={admin_info}")

            log_message = " | ".join(log_parts)

            # User-Agent는 WARNING 이상에서만 포함
            if log_level >= logging.WARNING:
                log_message += f"\n├─ User-Agent: {user_agent}"

            logger.log(log_level, log_message)

            return response

        except Exception as e:
            # 에러 발생 시 상세 로깅
            duration = time.time() - start_time
            admin_info = get_admin_info(request)

            error_log = [
                f"{client_ip} | {method} {path}",
                f"├─ Query: {query}" if query else None,
                f"├─ User-Agent: {user_agent}",
                f"├─ Admin: {admin_info}" if admin_info else None,
                f"├─ Duration: {duration:.3f}s",
                f"├─ Error: {type(e).__name__}: {str(e)}",
                f"└─ Traceback:\n{traceback.format_exc()}",
            ]

            # None 제거 후 합치기
            error_message = "\n".join(filter(None, error_log))
            logger.error(error_message)

            # 예외 다시 발생 (FastAPI가 처리하도록)
            raise
