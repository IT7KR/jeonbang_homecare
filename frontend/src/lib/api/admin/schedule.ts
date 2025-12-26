/**
 * Admin Schedule API
 * 일정 관리 API
 */

import { fetchWithToken } from "../client";
import type {
  ScheduleListResponse,
  MonthlyStats,
  SchedulePartner,
  ScheduleListParams,
} from "./types";

/**
 * 일정 목록 조회
 */
export async function getSchedule(
  token: string,
  params: ScheduleListParams
): Promise<ScheduleListResponse> {
  return fetchWithToken<ScheduleListResponse>("/admin/schedule", token, {
    params: {
      start_date: params.start_date,
      end_date: params.end_date,
      status: params.status,
      partner_id: params.partner_id,
    },
  });
}

/**
 * 월간 통계 조회
 */
export async function getMonthlyStats(
  token: string,
  year: number,
  month: number
): Promise<MonthlyStats> {
  return fetchWithToken<MonthlyStats>("/admin/schedule/monthly-stats", token, {
    params: {
      year,
      month,
    },
  });
}

/**
 * 일정 배정 가능한 협력사 목록
 */
export async function getSchedulePartners(
  token: string
): Promise<SchedulePartner[]> {
  return fetchWithToken<SchedulePartner[]>("/admin/schedule/partners", token);
}
