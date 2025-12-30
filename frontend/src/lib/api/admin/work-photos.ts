/**
 * 시공 사진 및 고객 URL 관리 API
 */

import { fetchWithAuth, uploadWithAuth } from "../client";
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
  assignmentId: number
): Promise<WorkPhotosResponse> {
  return fetchWithAuth<WorkPhotosResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos`
  );
}

/**
 * 시공 사진 업로드
 */
export async function uploadWorkPhotos(
  applicationId: number,
  assignmentId: number,
  photoType: "before" | "after",
  files: File[]
): Promise<WorkPhotoUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("photos", file);
  });

  return uploadWithAuth<WorkPhotoUploadResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos/${photoType}`,
    formData
  );
}

/**
 * 시공 사진 삭제
 */
export async function deleteWorkPhoto(
  applicationId: number,
  assignmentId: number,
  photoType: "before" | "after",
  photoIndex: number
): Promise<{ message: string; remaining_count: number }> {
  return fetchWithAuth<{ message: string; remaining_count: number }>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos/${photoType}`,
    { method: "DELETE", params: { photo_index: photoIndex } }
  );
}

/**
 * 시공 사진 순서 변경
 */
export async function reorderWorkPhotos(
  applicationId: number,
  assignmentId: number,
  photoType: "before" | "after",
  order: number[]
): Promise<{ success: boolean; message: string; photos: string[] }> {
  return fetchWithAuth<{ success: boolean; message: string; photos: string[] }>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/work-photos/${photoType}/reorder`,
    { method: "PUT", body: order }
  );
}

// ===== 고객 URL API =====

/**
 * 고객 열람 URL 조회
 */
export async function getCustomerUrl(
  applicationId: number,
  assignmentId: number
): Promise<CustomerUrlResponse> {
  return fetchWithAuth<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url`
  );
}

/**
 * 고객 열람 URL 발급
 */
export async function createCustomerUrl(
  applicationId: number,
  assignmentId: number,
  data?: CustomerUrlCreate
): Promise<CustomerUrlResponse> {
  return fetchWithAuth<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url`,
    { method: "POST", body: data || {} }
  );
}

/**
 * 고객 열람 URL 연장
 */
export async function extendCustomerUrl(
  applicationId: number,
  assignmentId: number,
  data: CustomerUrlExtend
): Promise<CustomerUrlResponse> {
  return fetchWithAuth<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url/extend`,
    { method: "POST", body: data }
  );
}

/**
 * 고객 열람 URL 재발급
 */
export async function renewCustomerUrl(
  applicationId: number,
  assignmentId: number,
  data?: CustomerUrlCreate
): Promise<CustomerUrlResponse> {
  return fetchWithAuth<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url/renew`,
    { method: "POST", body: data || {} }
  );
}

/**
 * 고객 열람 URL 만료
 */
export async function revokeCustomerUrl(
  applicationId: number,
  assignmentId: number
): Promise<CustomerUrlResponse> {
  return fetchWithAuth<CustomerUrlResponse>(
    `${BASE_URL}/${applicationId}/assignments/${assignmentId}/customer-url/revoke`,
    { method: "POST" }
  );
}
