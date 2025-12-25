/**
 * Admin Audit Logs API
 */

import { fetchWithToken } from "../client";
import type { AuditLogListResponse, AuditLogListParams } from "./types";

/**
 * 변경 이력 목록 조회
 */
export async function getAuditLogs(
  token: string,
  params?: AuditLogListParams
): Promise<AuditLogListResponse> {
  return fetchWithToken<AuditLogListResponse>("/admin/audit-logs", token, {
    params: {
      entity_type: params?.entity_type,
      entity_id: params?.entity_id,
      action: params?.action,
      admin_id: params?.admin_id,
      page: params?.page,
      page_size: params?.page_size,
    },
  });
}

/**
 * 특정 엔티티의 변경 이력 조회
 */
export async function getEntityAuditLogs(
  token: string,
  entityType: string,
  entityId: number,
  params?: { page?: number; page_size?: number }
): Promise<AuditLogListResponse> {
  return fetchWithToken<AuditLogListResponse>(
    `/admin/audit-logs/entity/${entityType}/${entityId}`,
    token,
    {
      params: {
        page: params?.page,
        page_size: params?.page_size,
      },
    }
  );
}
