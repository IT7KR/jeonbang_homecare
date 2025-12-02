"""
Bulk SMS Service
대량 SMS 발송 서비스

핵심 기능:
- 배치 분할 (50명 단위)
- 비동기 병렬 발송
- 지수 백오프 재시도
- 진행 상황 업데이트
"""

import asyncio
import math
from datetime import datetime, timezone
from typing import Optional
import logging

from sqlalchemy.orm import Session

from app.models.bulk_sms_job import BulkSMSJob
from app.models.application import Application
from app.models.partner import Partner
from app.services.sms import send_sms_direct
from app.core.encryption import decrypt_value

logger = logging.getLogger(__name__)

# 설정
BATCH_SIZE = 50  # 배치당 수신자 수
RETRY_ATTEMPTS = 3  # 최대 재시도 횟수
RETRY_DELAY_BASE = 1.0  # 재시도 기본 대기 시간 (초)
BATCH_DELAY = 0.5  # 배치 간 대기 시간 (초)


class BulkSMSService:
    """대량 SMS 발송 서비스"""

    def __init__(self, db: Session):
        self.db = db

    async def execute_bulk_send(self, job_id: int):
        """
        메인 실행 함수 - BackgroundTask에서 호출

        1. Job 시작 상태 업데이트
        2. 수신자 목록 조회
        3. 배치 분할 처리
        4. 완료 상태 업데이트
        """
        job = self.db.query(BulkSMSJob).filter(BulkSMSJob.id == job_id).first()
        if not job:
            logger.error(f"BulkSMSJob {job_id} not found")
            return

        try:
            # Job 시작
            job.status = "processing"
            job.started_at = datetime.now(timezone.utc)
            self.db.commit()

            logger.info(f"BulkSMSJob {job_id} started")

            # 수신자 목록 조회
            recipients = self._get_recipients(job)
            job.total_count = len(recipients)
            job.total_batches = math.ceil(len(recipients) / BATCH_SIZE) if recipients else 0
            self.db.commit()

            if not recipients:
                logger.warning(f"BulkSMSJob {job_id}: No recipients found")
                job.status = "completed"
                job.completed_at = datetime.now(timezone.utc)
                self.db.commit()
                return

            logger.info(f"BulkSMSJob {job_id}: {len(recipients)} recipients, {job.total_batches} batches")

            # 배치 분할 처리
            for batch_index, batch in enumerate(self._chunk(recipients, BATCH_SIZE)):
                await self._process_batch(job, batch, batch_index)
                job.current_batch = batch_index + 1
                self.db.commit()

                logger.info(f"BulkSMSJob {job_id}: Batch {batch_index + 1}/{job.total_batches} completed")

                # 배치 간 딜레이 (마지막 배치 제외)
                if batch_index < job.total_batches - 1:
                    await asyncio.sleep(BATCH_DELAY)

            # 완료 처리
            job.status = "completed" if job.failed_count == 0 else "partial_failed"
            job.completed_at = datetime.now(timezone.utc)
            self.db.commit()

            logger.info(
                f"BulkSMSJob {job_id} finished: "
                f"sent={job.sent_count}, failed={job.failed_count}, status={job.status}"
            )

        except Exception as e:
            logger.error(f"BulkSMSJob {job_id} error: {str(e)}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            self.db.commit()

    async def _process_batch(self, job: BulkSMSJob, recipients: list, batch_index: int):
        """단일 배치 처리 (병렬 발송)"""
        tasks = []
        for recipient in recipients:
            task = self._send_with_retry(job, recipient, batch_index)
            tasks.append(task)

        # 배치 내 병렬 실행
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 결과 처리
        for recipient, result in zip(recipients, results):
            if isinstance(result, Exception):
                job.failed_count += 1
                self._add_failed_recipient(job, recipient, str(result))
            elif not result.get("success"):
                job.failed_count += 1
                self._add_failed_recipient(job, recipient, result.get("error", "알 수 없는 오류"))
            else:
                job.sent_count += 1

    def _add_failed_recipient(self, job: BulkSMSJob, recipient: dict, error: str):
        """실패한 수신자 추가"""
        if job.failed_recipients is None:
            job.failed_recipients = []

        # 전화번호 마지막 4자리만 저장 (개인정보 보호)
        phone_last4 = recipient.get("phone", "")[-4:] if recipient.get("phone") else ""

        job.failed_recipients.append({
            "phone": phone_last4,
            "name": recipient.get("name", ""),
            "error": error[:200],  # 에러 메시지 길이 제한
        })

    async def _send_with_retry(self, job: BulkSMSJob, recipient: dict, batch_index: int) -> dict:
        """재시도 로직이 포함된 단일 SMS 발송"""
        for attempt in range(RETRY_ATTEMPTS):
            try:
                result = await send_sms_direct(
                    receiver=recipient["phone"],
                    message=job.message,
                    sms_type=f"bulk_{job.job_type}",
                    reference_type="bulk_job",
                    reference_id=job.id,
                    db=self.db,
                    bulk_job_id=job.id,
                    batch_index=batch_index,
                )
                return result

            except Exception as e:
                if attempt < RETRY_ATTEMPTS - 1:
                    delay = RETRY_DELAY_BASE * (2 ** attempt)  # 지수 백오프: 1s, 2s, 4s
                    logger.warning(
                        f"BulkSMSJob {job.id}: Retry {attempt + 1} for {recipient.get('phone', '')[-4:]}, "
                        f"waiting {delay}s"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"BulkSMSJob {job.id}: Max retries exceeded for {recipient.get('phone', '')[-4:]}"
                    )
                    return {"success": False, "error": str(e)}

        return {"success": False, "error": "최대 재시도 횟수 초과"}

    def _get_recipients(self, job: BulkSMSJob) -> list:
        """Job 설정에 따라 수신자 목록 조회"""
        recipients = []

        if job.target_type == "customer":
            recipients = self._query_customers(job)
        elif job.target_type == "partner":
            recipients = self._query_partners(job)

        return recipients

    def _query_customers(self, job: BulkSMSJob) -> list:
        """고객(신청자) 목록 조회"""
        query = self.db.query(Application)

        # 선택 발송 (target_ids가 있는 경우)
        if job.target_ids:
            query = query.filter(Application.id.in_(job.target_ids))

        # 필터 적용 (target_filter가 있는 경우)
        if job.target_filter:
            if "status" in job.target_filter:
                query = query.filter(Application.status == job.target_filter["status"])
            if "region" in job.target_filter:
                # region은 복호화된 주소에서 확인해야 하므로 애플리케이션 레벨에서 필터링
                pass

        recipients = []
        for app in query.all():
            try:
                phone = decrypt_value(app.customer_phone)
                name = decrypt_value(app.customer_name)

                # region 필터 (암호화된 필드는 애플리케이션 레벨에서 필터링)
                if job.target_filter and "region" in job.target_filter:
                    address = decrypt_value(app.customer_address) if app.customer_address else ""
                    if job.target_filter["region"] not in address:
                        continue

                recipients.append({
                    "type": "customer",
                    "id": app.id,
                    "phone": phone,
                    "name": name,
                    "label": app.application_number,
                })
            except Exception as e:
                logger.warning(f"Failed to decrypt customer data for application {app.id}: {e}")
                continue

        return recipients

    def _query_partners(self, job: BulkSMSJob) -> list:
        """협력사 목록 조회"""
        query = self.db.query(Partner)

        # 선택 발송 (target_ids가 있는 경우)
        if job.target_ids:
            query = query.filter(Partner.id.in_(job.target_ids))

        # 필터 적용 (target_filter가 있는 경우)
        if job.target_filter:
            if "status" in job.target_filter:
                query = query.filter(Partner.status == job.target_filter["status"])

        recipients = []
        for partner in query.all():
            try:
                phone = decrypt_value(partner.contact_phone)
                recipients.append({
                    "type": "partner",
                    "id": partner.id,
                    "phone": phone,
                    "name": partner.company_name,
                    "label": partner.company_name,
                })
            except Exception as e:
                logger.warning(f"Failed to decrypt partner data for partner {partner.id}: {e}")
                continue

        return recipients

    def _chunk(self, lst: list, size: int):
        """리스트를 지정 크기로 분할"""
        for i in range(0, len(lst), size):
            yield lst[i:i + size]


async def execute_bulk_sms_job(db: Session, job_id: int):
    """
    백그라운드 태스크에서 호출하는 래퍼 함수
    """
    service = BulkSMSService(db)
    await service.execute_bulk_send(job_id)
