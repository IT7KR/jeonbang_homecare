/**
 * Applications API Client
 * 서비스 신청 API (공개)
 */

import { fetchApi, uploadPublic } from "./client";

// Request Types
export interface ApplicationCreateRequest {
  customer_name: string;
  customer_phone: string;
  address: string;
  address_detail?: string;
  selected_services: string[];
  description: string;
  preferred_consultation_date?: string; // YYYY-MM-DD
  preferred_work_date?: string; // YYYY-MM-DD
}

// Response Types
export interface ApplicationCreateResponse {
  success: boolean;
  application_number: string;
  message: string;
}

/**
 * 서비스 신청 생성 (JSON, 사진 없음)
 */
export async function createApplicationSimple(
  data: ApplicationCreateRequest
): Promise<ApplicationCreateResponse> {
  return fetchApi<ApplicationCreateResponse>("/applications/simple", {
    method: "POST",
    body: data,
  });
}

/**
 * 서비스 신청 생성 (FormData, 사진 포함)
 */
export async function createApplication(
  data: ApplicationCreateRequest,
  photos?: File[]
): Promise<ApplicationCreateResponse> {
  const formData = new FormData();
  formData.append("customer_name", data.customer_name);
  formData.append("customer_phone", data.customer_phone);
  formData.append("address", data.address);
  if (data.address_detail) {
    formData.append("address_detail", data.address_detail);
  }
  formData.append("selected_services", JSON.stringify(data.selected_services));
  formData.append("description", data.description);

  // 희망 일정
  if (data.preferred_consultation_date) {
    formData.append("preferred_consultation_date", data.preferred_consultation_date);
  }
  if (data.preferred_work_date) {
    formData.append("preferred_work_date", data.preferred_work_date);
  }

  if (photos) {
    photos.forEach((photo) => {
      formData.append("photos", photo);
    });
  }

  return uploadPublic<ApplicationCreateResponse>("/applications", formData);
}
