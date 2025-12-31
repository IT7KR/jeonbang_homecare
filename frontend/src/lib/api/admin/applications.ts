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
  BulkAssignRequest,
  BulkAssignResponse,
  ApplicationNote,
  ApplicationNotesListResponse,
  ApplicationNoteCreate,
  Assignment,
  AssignmentListResponse,
  AssignmentCreate,
  AssignmentUpdate,
  CustomerHistoryResponse,
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
      search_type: params.search_type,
      date_from: params.date_from,
      date_to: params.date_to,
      services: params.services,
      assigned_admin_id: params.assigned_admin_id,
      assigned_partner_id: params.assigned_partner_id,
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

/**
 * 신청 일괄 배정
 */
export async function bulkAssignApplications(
  token: string,
  data: BulkAssignRequest
): Promise<BulkAssignResponse> {
  return fetchWithToken<BulkAssignResponse>("/admin/applications/bulk-assign", token, {
    method: "POST",
    body: data,
  });
}

// ==================== 관리자 메모 API ====================

/**
 * 신청 관리자 메모 목록 조회
 */
export async function getApplicationNotes(
  token: string,
  applicationId: number,
  params: { page?: number; page_size?: number } = {}
): Promise<ApplicationNotesListResponse> {
  return fetchWithToken<ApplicationNotesListResponse>(
    `/admin/applications/${applicationId}/notes`,
    token,
    {
      params: {
        page: params.page,
        page_size: params.page_size,
      },
    }
  );
}

/**
 * 신청 관리자 메모 추가
 */
export async function createApplicationNote(
  token: string,
  applicationId: number,
  data: ApplicationNoteCreate
): Promise<ApplicationNote> {
  return fetchWithToken<ApplicationNote>(
    `/admin/applications/${applicationId}/notes`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 신청 관리자 메모 삭제
 */
export async function deleteApplicationNote(
  token: string,
  applicationId: number,
  noteId: number
): Promise<{ success: boolean; message: string }> {
  return fetchWithToken<{ success: boolean; message: string }>(
    `/admin/applications/${applicationId}/notes/${noteId}`,
    token,
    {
      method: "DELETE",
    }
  );
}

// ==================== 협력사 배정 API (1:N) ====================

/**
 * 신청의 협력사 배정 목록 조회
 */
export async function getApplicationAssignments(
  token: string,
  applicationId: number
): Promise<AssignmentListResponse> {
  return fetchWithToken<AssignmentListResponse>(
    `/admin/applications/${applicationId}/assignments`,
    token
  );
}

/**
 * 신청에 협력사 배정 추가
 */
export async function createApplicationAssignment(
  token: string,
  applicationId: number,
  data: AssignmentCreate
): Promise<Assignment> {
  return fetchWithToken<Assignment>(
    `/admin/applications/${applicationId}/assignments`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 배정 수정
 */
export async function updateApplicationAssignment(
  token: string,
  applicationId: number,
  assignmentId: number,
  data: AssignmentUpdate
): Promise<Assignment> {
  return fetchWithToken<Assignment>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}`,
    token,
    {
      method: "PUT",
      body: data,
    }
  );
}

/**
 * 배정 삭제
 */
export async function deleteApplicationAssignment(
  token: string,
  applicationId: number,
  assignmentId: number
): Promise<{ success: boolean; message: string }> {
  return fetchWithToken<{ success: boolean; message: string }>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}`,
    token,
    {
      method: "DELETE",
    }
  );
}

/**
 * 배정 일괄 상태 변경 요청 타입
 */
export interface BatchAssignmentStatusUpdate {
  assignment_ids: number[];
  status: string;
  send_sms: boolean;
}

/**
 * 배정 일괄 상태 변경 응답 타입
 */
export interface BatchAssignmentStatusResponse {
  success: boolean;
  updated_count: number;
  failed_count: number;
  message: string;
  results: Array<{
    assignment_id: number;
    success: boolean;
    partner_name?: string;
    prev_status?: string;
    new_status?: string;
    sms_sent?: boolean;
    error?: string;
  }>;
}

/**
 * 배정 일괄 상태 변경
 */
export async function batchUpdateAssignmentStatus(
  token: string,
  applicationId: number,
  data: BatchAssignmentStatusUpdate
): Promise<BatchAssignmentStatusResponse> {
  return fetchWithToken<BatchAssignmentStatusResponse>(
    `/admin/applications/${applicationId}/assignments/batch-status`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

// ==================== 고객 이력 API (중복 관리) ====================

/**
 * 고객 신청 이력 조회 (동일 전화번호의 모든 신청)
 */
export async function getCustomerHistory(
  token: string,
  applicationId: number
): Promise<CustomerHistoryResponse> {
  return fetchWithToken<CustomerHistoryResponse>(
    `/admin/applications/${applicationId}/customer-history`,
    token
  );
}

// ==================== URL 관리 API ====================

/**
 * URL 정보 타입
 */
export interface URLInfo {
  assignment_id: number;
  token: string | null;
  view_url: string | null;
  expires_at: string | null;
  is_issued: boolean;
  is_expired: boolean;
}

/**
 * URL 갱신 요청 타입
 */
export interface URLRenewRequest {
  expires_in_days?: number;
}

/**
 * 협력사 URL 기간 연장 요청 타입
 */
export interface PartnerUrlExtend {
  additional_days: number;
}

/**
 * URL 만료 요청 타입
 */
export interface URLRevokeRequest {
  reason?: string;
}

/**
 * 배정의 협력사 포털 URL 조회 (발급된 URL만 반환)
 */
export async function getAssignmentURL(
  token: string,
  applicationId: number,
  assignmentId: number
): Promise<URLInfo> {
  return fetchWithToken<URLInfo>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}/url`,
    token
  );
}

/**
 * 배정의 협력사 포털 URL 발급 (명시적 발급)
 */
export async function generateAssignmentURL(
  token: string,
  applicationId: number,
  assignmentId: number,
  data: URLRenewRequest = {}
): Promise<URLInfo> {
  return fetchWithToken<URLInfo>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}/generate-url`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 배정의 협력사 포털 URL 재발급
 */
export async function renewAssignmentURL(
  token: string,
  applicationId: number,
  assignmentId: number,
  data: URLRenewRequest = {}
): Promise<URLInfo> {
  return fetchWithToken<URLInfo>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}/renew-url`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 배정의 협력사 포털 URL 만료(취소)
 */
export async function revokeAssignmentURL(
  token: string,
  applicationId: number,
  assignmentId: number,
  data: URLRevokeRequest = {}
): Promise<{ success: boolean; message: string }> {
  return fetchWithToken<{ success: boolean; message: string }>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}/revoke-url`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 배정의 협력사 포털 URL 기간 연장 (기존 URL 유지)
 */
export async function extendAssignmentURL(
  token: string,
  applicationId: number,
  assignmentId: number,
  data: PartnerUrlExtend
): Promise<URLInfo> {
  return fetchWithToken<URLInfo>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}/extend-url`,
    token,
    {
      method: "POST",
      body: data,
    }
  );
}

// ==================== SMS 발송 API ====================

/**
 * SMS 발송 응답 타입
 */
export interface SendSMSResponse {
  success: boolean;
  message: string;
}

/**
 * 배정별 SMS 수동 발송
 * @param target "customer" (고객) 또는 "partner" (협력사)
 */
export async function sendAssignmentSMS(
  token: string,
  applicationId: number,
  assignmentId: number,
  target: "customer" | "partner"
): Promise<SendSMSResponse> {
  return fetchWithToken<SendSMSResponse>(
    `/admin/applications/${applicationId}/assignments/${assignmentId}/send-sms?target=${target}`,
    token,
    {
      method: "POST",
    }
  );
}
