"""
Background Task Service
백그라운드 작업 공통 서비스
"""

import asyncio
import logging
from typing import Callable, Coroutine, Any
from functools import wraps

logger = logging.getLogger(__name__)


def run_async_in_background(coro: Coroutine[Any, Any, Any]) -> Any:
    """
    코루틴을 새 이벤트 루프에서 동기적으로 실행

    BackgroundTasks에서 async 함수를 실행할 때 사용

    Args:
        coro: 실행할 코루틴

    Returns:
        코루틴 실행 결과
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def create_background_task(*coros: Coroutine[Any, Any, Any]) -> Callable[[], None]:
    """
    여러 코루틴을 순차 실행하는 백그라운드 태스크 함수 생성

    Args:
        *coros: 순차 실행할 코루틴들

    Returns:
        BackgroundTasks.add_task()에 전달할 함수

    Example:
        background_tasks.add_task(
            create_background_task(
                send_notification(admin_phone, message),
                log_sms_sent(log_data),
            )
        )
    """
    # 코루틴을 저장 (클로저)
    coroutines = list(coros)

    def task():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            for coro in coroutines:
                try:
                    loop.run_until_complete(coro)
                except Exception as e:
                    logger.error(f"Background task failed: {e}")
        finally:
            loop.close()

    return task


async def run_tasks_sequentially(*coros: Coroutine[Any, Any, Any]) -> list[Any]:
    """
    여러 코루틴을 순차 실행 (이미 async 컨텍스트 내에서)

    Args:
        *coros: 순차 실행할 코루틴들

    Returns:
        각 코루틴의 결과 리스트
    """
    results = []
    for coro in coros:
        try:
            result = await coro
            results.append(result)
        except Exception as e:
            logger.error(f"Sequential task failed: {e}")
            results.append(None)
    return results
