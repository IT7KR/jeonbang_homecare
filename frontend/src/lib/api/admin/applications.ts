/**
 * Admin Applications API
 * 신청 관리 API
 */

import { fetchWithToken } from "../client";
import type {
  ApplicationListResponse,
  ApplicationDetail,
  ApplicationUpdate,
  ApplicationListParams,
} from "./types";

/**
 * 신청 목록 조회
 */
export async function getApplications(
  token: string,
  params: ApplicationListParams = {}
): Promise<ApplicationListResponse> {
  return fetchWithToken<ApplicationListResponse>("/admin/applications", token, {
    params: {
      page: params.page,
      page_size: params.page_size,
      status: params.status,
      search: params.search,
    },
  });
}

/**
 * 신청 상세 조회
 */
export async function getApplication(
  token: string,
  id: number
): Promise<ApplicationDetail> {
  return fetchWithToken<ApplicationDetail>(`/admin/applications/${id}`, token);
}

/**
 * 신청 수정
 */
export async function updateApplication(
  token: string,
  id: number,
  data: ApplicationUpdate
): Promise<ApplicationDetail> {
  return fetchWithToken<ApplicationDetail>(`/admin/applications/${id}`, token, {
    method: "PUT",
    body: data,
  });
}
