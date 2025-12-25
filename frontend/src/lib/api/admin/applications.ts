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
