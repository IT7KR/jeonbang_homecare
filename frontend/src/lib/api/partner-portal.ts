/**
 * 협력사 포털 API (토큰 인증)
 * 협력사가 자신의 배정 정보를 조회하고 시공 사진을 업로드
 */

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// 토큰 기반 인증 클라이언트 (JWT 아님)
const portalClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== Types =====

export interface PartnerViewPhoto {
  url: string;
  filename: string;
}

export interface PartnerViewResponse {
  assignment_id: number;
  assignment_status: string;
  assigned_services: string[];
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_cost: number | null;
  estimate_note: string | null;
  note: string | null;
  application_number: string;
  customer_name_masked: string;
  address_partial: string;
  selected_services: string[];
  description: string;
  preferred_consultation_date: string | null;
  preferred_work_date: string | null;
  photos: PartnerViewPhoto[];
  created_at: string;
  token_expires_at: string;
}

export interface PartnerWorkPhotosResponse {
  assignment_id: number;
  before_photos: PartnerViewPhoto[];
  after_photos: PartnerViewPhoto[];
  can_upload: boolean;
  max_photos_per_type: number;
}

export interface PartnerPhotoUploadResponse {
  assignment_id: number;
  photo_type: "before" | "after";
  photos: string[];
  total_count: number;
  message: string;
}

export interface PartnerPhotoDeleteResponse {
  assignment_id: number;
  photo_type: "before" | "after";
  remaining_photos: string[];
  deleted_count: number;
  message: string;
}

// ===== API Functions =====

/**
 * 협력사 열람 데이터 조회
 */
export async function getPartnerView(token: string): Promise<PartnerViewResponse> {
  const response = await portalClient.get<PartnerViewResponse>(
    `/partner-portal/view/${token}`
  );
  return response.data;
}

/**
 * 협력사 시공 사진 목록 조회
 */
export async function getPartnerWorkPhotos(token: string): Promise<PartnerWorkPhotosResponse> {
  const response = await portalClient.get<PartnerWorkPhotosResponse>(
    `/partner-portal/work-photos/${token}`
  );
  return response.data;
}

/**
 * 협력사 시공 사진 업로드
 */
export async function uploadPartnerPhotos(
  token: string,
  photoType: "before" | "after",
  photos: File[]
): Promise<PartnerPhotoUploadResponse> {
  const formData = new FormData();
  formData.append("photo_type", photoType);
  photos.forEach((photo) => {
    formData.append("photos", photo);
  });

  const response = await portalClient.post<PartnerPhotoUploadResponse>(
    `/partner-portal/upload-photos/${token}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

/**
 * 협력사 시공 사진 삭제
 */
export async function deletePartnerPhoto(
  token: string,
  photoType: "before" | "after",
  photoIndex: number
): Promise<PartnerPhotoDeleteResponse> {
  const response = await portalClient.delete<PartnerPhotoDeleteResponse>(
    `/partner-portal/photos/${token}/${photoType}`,
    {
      params: { photo_index: photoIndex },
    }
  );
  return response.data;
}
