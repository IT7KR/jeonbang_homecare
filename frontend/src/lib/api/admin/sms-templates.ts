/**
 * Admin SMS Templates API
 */

import { fetchWithToken } from "../client";
import type {
  SMSTemplate,
  SMSTemplateListResponse,
  SMSTemplateCreate,
  SMSTemplateUpdate,
  SMSTemplatePreviewRequest,
  SMSTemplatePreviewResponse,
  SMSTemplateListParams,
} from "./types";

/**
 * SMS 템플릿 목록 조회
 */
export async function getSMSTemplates(
  token: string,
  params?: SMSTemplateListParams
): Promise<SMSTemplateListResponse> {
  return fetchWithToken<SMSTemplateListResponse>("/admin/sms-templates", token, {
    params: {
      is_active: params?.is_active,
      search: params?.search,
    },
  });
}

/**
 * SMS 템플릿 상세 조회
 */
export async function getSMSTemplate(
  token: string,
  templateId: number
): Promise<SMSTemplate> {
  return fetchWithToken<SMSTemplate>(`/admin/sms-templates/${templateId}`, token);
}

/**
 * SMS 템플릿 키로 조회
 */
export async function getSMSTemplateByKey(
  token: string,
  templateKey: string
): Promise<SMSTemplate> {
  return fetchWithToken<SMSTemplate>(`/admin/sms-templates/key/${templateKey}`, token);
}

/**
 * SMS 템플릿 생성
 */
export async function createSMSTemplate(
  token: string,
  data: SMSTemplateCreate
): Promise<SMSTemplate> {
  return fetchWithToken<SMSTemplate>("/admin/sms-templates", token, {
    method: "POST",
    body: data,
  });
}

/**
 * SMS 템플릿 수정
 */
export async function updateSMSTemplate(
  token: string,
  templateId: number,
  data: SMSTemplateUpdate
): Promise<SMSTemplate> {
  return fetchWithToken<SMSTemplate>(`/admin/sms-templates/${templateId}`, token, {
    method: "PUT",
    body: data,
  });
}

/**
 * SMS 템플릿 삭제
 */
export async function deleteSMSTemplate(
  token: string,
  templateId: number
): Promise<{ message: string }> {
  return fetchWithToken<{ message: string }>(`/admin/sms-templates/${templateId}`, token, {
    method: "DELETE",
  });
}

/**
 * SMS 템플릿 미리보기
 */
export async function previewSMSTemplate(
  token: string,
  data: SMSTemplatePreviewRequest
): Promise<SMSTemplatePreviewResponse> {
  return fetchWithToken<SMSTemplatePreviewResponse>("/admin/sms-templates/preview", token, {
    method: "POST",
    body: data,
  });
}
