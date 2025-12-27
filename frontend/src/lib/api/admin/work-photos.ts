/**
 * 시공 사진 및 고객 URL 관리 API
 */

import { fetchWithToken, uploadWithAuth } from "../client";
import type {
  WorkPhotosResponse,
  WorkPhotoUploadResponse,
  CustomerUrlResponse,
  CustomerUrlCreate,
  CustomerUrlExtend,
} from "./types";

const BASE_URL = "/admin/applications";

// ===== 시공 사진 API =====

/**
 * 시공 사진 조회
 */
export async function getWorkPhotos(
  applicationId: number,
  assignmentId: number,
  token?: string
): Promise<WorkPhotosResponse> {
  return fetchWithToken<WorkPhotosResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos`,
    token || ""
  );
}

/**
 * 시공 사진 업로드
 */
export async function uploadWorkPhotos(
  applicationId: number,
  assignmentId: number,
  photoType: "before" | "after",
  files: File[],
  token?: string
): Promise<WorkPhotoUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return uploadWithAuth<WorkPhotoUploadResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos/${photoType}`,
    formData,
    token
  );
}

/**
 * 시공 사진 삭제
 */
export async function deleteWorkPhoto(
  applicationId: number,
  assignmentId: number,
  photoType: "before" | "after",
  photoIndex: number,
  token?: string
): Promise<{ message: string; remaining_count: number }> {
  return fetchWithToken<{ message: string; remaining_count: number }>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos/${photoType}?photo_index=${photoIndex}`,
    token || "",
    { method: "DELETE" }
  );
}

// ===== 고객 URL API =====

/**
 * 고객 열람 URL 조회
 */
export async function getCustomerUrl(
  applicationId: number,
  assignmentId: number,
  token?: string
): Promise<CustomerUrlResponse> {
  return fetchWithToken<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url`,
    token || ""
  );
}

/**
 * 고객 열람 URL 발급
 */
export async function createCustomerUrl(
  applicationId: number,
  assignmentId: number,
  data?: CustomerUrlCreate,
  token?: string
): Promise<CustomerUrlResponse> {
  return fetchWithToken<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url`,
    token || "",
    { method: "POST", body: data || {} }
  );
}

/**
 * 고객 열람 URL 연장
 */
export async function extendCustomerUrl(
  applicationId: number,
  assignmentId: number,
  data: CustomerUrlExtend,
  token?: string
): Promise<CustomerUrlResponse> {
  return fetchWithToken<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url/extend`,
    token || "",
    { method: "POST", body: data }
  );
}

/**
 * 고객 열람 URL 재발급
 */
export async function renewCustomerUrl(
  applicationId: number,
  assignmentId: number,
  data?: CustomerUrlCreate,
  token?: string
): Promise<CustomerUrlResponse> {
  return fetchWithToken<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url/renew`,
    token || "",
    { method: "POST", body: data || {} }
  );
}

/**
 * 고객 열람 URL 만료
 */
export async function revokeCustomerUrl(
  applicationId: number,
  assignmentId: number,
  token?: string
): Promise<CustomerUrlResponse> {
  return fetchWithToken<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url/revoke`,
    token || "",
    { method: "POST" }
  );
}
