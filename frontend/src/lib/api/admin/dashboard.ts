/**
 * Admin Dashboard API
 * 대시보드 데이터 조회
 */

import { fetchWithToken } from "../client";
import type { DashboardResponse } from "./types";

/**
 * 대시보드 데이터 조회
 */
export async function getDashboard(token: string): Promise<DashboardResponse> {
  return fetchWithToken<DashboardResponse>("/admin/dashboard", token);
}
