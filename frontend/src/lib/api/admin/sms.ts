/**
 * Admin SMS API
 * SMS 발송 관리 API
 */

import { fetchWithToken } from "../client";
import type {
  SMSStats,
  SMSLogListResponse,
  SMSSendRequest,
  SMSSendResponse,
  SMSLogListParams,
  // Bulk SMS Types
  SMSRecipientsResponse,
  SMSRecipientsParams,
  BulkSMSSendRequest,
  BulkSMSJobResponse,
  BulkSMSJobDetail,
  BulkSMSJobListResponse,
  BulkSMSJobListParams,
} from "./types";

/**
 * SMS 통계 조회
 */
export async function getSMSStats(token: string): Promise<SMSStats> {
  return fetchWithToken<SMSStats>("/admin/sms/stats", token);
}

/**
 * SMS 발송 내역 조회
 */
export async function getSMSLogs(
  token: string,
  params: SMSLogListParams = {}
): Promise<SMSLogListResponse> {
  return fetchWithToken<SMSLogListResponse>("/admin/sms", token, {
    params: {
      page: params.page,
      page_size: params.page_size,
      status: params.status,
      sms_type: params.sms_type,
      search: params.search,
    },
  });
}

/**
 * SMS 발송
 */
export async function sendSMS(
  token: string,
  data: SMSSendRequest
): Promise<SMSSendResponse> {
  return fetchWithToken<SMSSendResponse>("/admin/sms/send", token, {
    method: "POST",
    body: data,
  });
}

/**
 * SMS 재발송
 */
export async function retrySMS(
  token: string,
  logId: number
): Promise<SMSSendResponse> {
  return fetchWithToken<SMSSendResponse>(`/admin/sms/retry/${logId}`, token, {
    method: "POST",
  });
}

// ===== Bulk SMS API =====

/**
 * SMS 수신자 목록 조회 (복수 발송용)
 */
export async function getSMSRecipients(
  token: string,
  params: SMSRecipientsParams
): Promise<SMSRecipientsResponse> {
  return fetchWithToken<SMSRecipientsResponse>("/admin/sms/recipients", token, {
    params: {
      target_type: params.target_type,
      status: params.status,
      search: params.search,
      page: params.page,
      page_size: params.page_size,
    },
  });
}

/**
 * 복수 SMS 발송 Job 생성
 */
export async function createBulkSMSJob(
  token: string,
  data: BulkSMSSendRequest
): Promise<BulkSMSJobResponse> {
  return fetchWithToken<BulkSMSJobResponse>("/admin/sms/bulk", token, {
    method: "POST",
    body: data,
  });
}

/**
 * 복수 SMS 발송 Job 상태 조회 (폴링용)
 */
export async function getBulkSMSJob(
  token: string,
  jobId: number
): Promise<BulkSMSJobDetail> {
  return fetchWithToken<BulkSMSJobDetail>(`/admin/sms/bulk/${jobId}`, token);
}

/**
 * 복수 SMS 발송 Job 목록 조회
 */
export async function getBulkSMSJobs(
  token: string,
  params: BulkSMSJobListParams = {}
): Promise<BulkSMSJobListResponse> {
  return fetchWithToken<BulkSMSJobListResponse>("/admin/sms/bulk", token, {
    params: {
      page: params.page,
      page_size: params.page_size,
      status: params.status,
    },
  });
}
