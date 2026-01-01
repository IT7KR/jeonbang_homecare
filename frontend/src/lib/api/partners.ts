/**
 * Partners API Client
 * 파트너 등록 API (공개)
 */

import { type SelectedRegion } from "@/lib/constants/regions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8020/api/v1";

// Request Types
export interface PartnerCreateRequest {
  companyName: string;
  representativeName: string;
  businessNumber?: string;
  contactPhone: string;
  contactEmail?: string;
  address: string;
  addressDetail?: string;
  serviceAreas: string[];
  workRegions: SelectedRegion[];
  introduction?: string;
  experience?: string;
  remarks?: string;
  businessRegistrationFile?: File;  // 사업자등록증 파일
}

// 중복 협력사 정보
export interface DuplicatePartnerInfo {
  existing_id: number;
  existing_company_name: string;
  existing_status: string;
  existing_created_at: string;
  duplicate_type: "business_number" | "phone_company";
}

// Response Types
export interface PartnerCreateResponse {
  success: boolean;
  partner_id: number;
  message: string;
  // 중복 협력사 정보 (있는 경우)
  duplicate_info?: DuplicatePartnerInfo;
  is_duplicate: boolean;
}

/**
 * 파트너 등록 신청 (FormData로 파일 업로드 지원)
 */
export async function createPartner(
  data: PartnerCreateRequest
): Promise<PartnerCreateResponse> {
  const formData = new FormData();

  // 기본 필드 추가
  formData.append("companyName", data.companyName);
  formData.append("representativeName", data.representativeName);
  if (data.businessNumber) formData.append("businessNumber", data.businessNumber);
  formData.append("contactPhone", data.contactPhone);
  if (data.contactEmail) formData.append("contactEmail", data.contactEmail);
  formData.append("address", data.address);
  if (data.addressDetail) formData.append("addressDetail", data.addressDetail);

  // JSON 배열을 문자열로 변환
  formData.append("serviceAreas", JSON.stringify(data.serviceAreas));
  formData.append("workRegions", JSON.stringify(data.workRegions));

  // 선택 필드
  if (data.introduction) formData.append("introduction", data.introduction);
  if (data.experience) formData.append("experience", data.experience);
  if (data.remarks) formData.append("remarks", data.remarks);

  // 사업자등록증 파일
  if (data.businessRegistrationFile) {
    formData.append("businessRegistrationFile", data.businessRegistrationFile);
  }

  const response = await fetch(`${API_BASE_URL}/partners`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "요청 처리 중 오류가 발생했습니다." }));
    throw new Error(error.detail || "협력사 등록에 실패했습니다.");
  }

  return response.json();
}
