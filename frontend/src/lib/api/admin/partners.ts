/**
 * Admin Partners API
 * 협력사 관리 API
 */

import { fetchWithToken } from "../client";
import type {
  PartnerListResponse,
  PartnerDetail,
  PartnerUpdate,
  PartnerListParams,
} from "./types";

/**
 * 협력사 목록 조회
 */
export async function getPartners(
  token: string,
  params: PartnerListParams = {}
): Promise<PartnerListResponse> {
  return fetchWithToken<PartnerListResponse>("/admin/partners", token, {
    params: {
      page: params.page,
      page_size: params.page_size,
      status: params.status,
      search: params.search,
    },
  });
}

/**
 * 협력사 상세 조회
 */
export async function getPartner(
  token: string,
  id: number
): Promise<PartnerDetail> {
  return fetchWithToken<PartnerDetail>(`/admin/partners/${id}`, token);
}

/**
 * 협력사 수정
 */
export async function updatePartner(
  token: string,
  id: number,
  data: PartnerUpdate
): Promise<PartnerDetail> {
  return fetchWithToken<PartnerDetail>(`/admin/partners/${id}`, token, {
    method: "PUT",
    body: data,
  });
}

/**
 * 협력사 승인/거절
 */
export async function approvePartner(
  token: string,
  id: number,
  action: "approve" | "reject",
  rejectionReason?: string
): Promise<PartnerDetail> {
  return fetchWithToken<PartnerDetail>(`/admin/partners/${id}/approve`, token, {
    method: "POST",
    body: {
      action,
      rejection_reason: rejectionReason,
    },
  });
}
