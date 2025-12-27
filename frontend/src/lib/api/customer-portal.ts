/**
 * 고객 포털 API (인증 없음)
 */

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// 인증 없이 사용하는 클라이언트
const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== Types =====

export interface CustomerViewPhoto {
  url: string;
  filename: string;
}

export interface CustomerViewQuoteItem {
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface CustomerViewQuote {
  quote_number: string;
  quote_date: string;
  items: CustomerViewQuoteItem[];
  total_amount: number;
  estimate_note: string | null;
  pdf_download_url: string;
}

export interface ProgressStep {
  step: string;
  status: "completed" | "current" | "pending" | "cancelled";
  date: string | null;
}

export interface CustomerViewResponse {
  assignment_id: number;
  assignment_status: string;
  status_label: string;
  assigned_services: string[];
  scheduled_date: string | null;
  scheduled_time: string | null;
  application_number: string;
  customer_name_masked: string;
  address_partial: string;
  selected_services: string[];
  description: string | null;
  partner_company: string | null;
  partner_phone_masked: string | null;
  quote: CustomerViewQuote | null;
  work_photos_before: CustomerViewPhoto[];
  work_photos_after: CustomerViewPhoto[];
  work_photos_uploaded_at: string | null;
  progress_steps: ProgressStep[];
  created_at: string;
  token_expires_at: string;
  contact_info: string;
}

export interface CustomerViewTokenInfo {
  is_valid: boolean;
  expires_at: string | null;
  assignment_id: number | null;
  message: string | null;
}

// ===== API Functions =====

/**
 * 고객 열람 데이터 조회
 */
export async function getCustomerView(token: string): Promise<CustomerViewResponse> {
  const response = await publicClient.get<CustomerViewResponse>(
    `/customer-portal/view/${token}`
  );
  return response.data;
}

/**
 * 토큰 유효성 확인
 */
export async function getTokenInfo(token: string): Promise<CustomerViewTokenInfo> {
  const response = await publicClient.get<CustomerViewTokenInfo>(
    `/customer-portal/token-info/${token}`
  );
  return response.data;
}

/**
 * 견적서 PDF 다운로드 URL 생성
 */
export function getQuotePdfUrl(token: string): string {
  return `${API_URL}/customer-portal/quote-pdf/${token}`;
}
