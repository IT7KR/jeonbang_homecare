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
  PartnerNote,
  PartnerNotesListResponse,
  PartnerNoteCreate,
  PartnerStatusChange,
  SimilarPartnersResponse,
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
      search_type: params.search_type,
      date_from: params.date_from,
      date_to: params.date_to,
      services: params.services,
      region: params.region,
      approved_by: params.approved_by,
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

/**
 * 협력사 상태 변경 (어떤 상태에서든 변경 가능)
 */
export async function changePartnerStatus(
  token: string,
  id: number,
  data: PartnerStatusChange
): Promise<PartnerDetail> {
  return fetchWithToken<PartnerDetail>(`/admin/partners/${id}/status`, token, {
    method: "POST",
    body: {
      new_status: data.new_status,
      reason: data.reason,
      send_sms: data.send_sms ?? true,
    },
  });
}

/**
 * 협력사 메모/히스토리 목록 조회
 */
export async function getPartnerNotes(
  token: string,
  partnerId: number
): Promise<PartnerNotesListResponse> {
  return fetchWithToken<PartnerNotesListResponse>(
    `/admin/partners/${partnerId}/notes`,
    token
  );
}

/**
 * 협력사 메모 추가
 */
export async function createPartnerNote(
  token: string,
  partnerId: number,
  data: PartnerNoteCreate
): Promise<PartnerNote> {
  return fetchWithToken<PartnerNote>(
    `/admin/partners/${partnerId}/notes`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 협력사 메모 삭제
 */
export async function deletePartnerNote(
  token: string,
  partnerId: number,
  noteId: number
): Promise<void> {
  return fetchWithToken<void>(
    `/admin/partners/${partnerId}/notes/${noteId}`,
    token,
    {
      method: "DELETE",
    }
  );
}

// ==================== 유사 협력사 API (중복 관리) ====================

/**
 * 유사 협력사 조회 (동일 전화번호/사업자번호)
 */
export async function getSimilarPartners(
  token: string,
  partnerId: number
): Promise<SimilarPartnersResponse> {
  return fetchWithToken<SimilarPartnersResponse>(
    `/admin/partners/${partnerId}/similar-partners`,
    token
  );
}
