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
