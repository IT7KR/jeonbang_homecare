/**
 * Partners API Client
 * 파트너 등록 API (공개)
 */

import { fetchApi } from "./client";
import { type SelectedRegion } from "@/lib/constants/regions";

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
}

// Response Types
export interface PartnerCreateResponse {
  success: boolean;
  partner_id: number;
  message: string;
}

/**
 * 파트너 등록 신청
 */
export async function createPartner(
  data: PartnerCreateRequest
): Promise<PartnerCreateResponse> {
  return fetchApi<PartnerCreateResponse>("/partners", {
    method: "POST",
    body: data,
  });
}
