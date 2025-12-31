/**
 * Quotes API Client
 * 견적 항목 관리 API
 */

import { fetchWithAuth } from "../client";
import { getToken } from "@/lib/stores/auth";
import type {
  QuoteItem,
  QuoteItemCreate,
  QuoteItemUpdate,
  QuoteSummary,
  QuoteItemBulkCreate,
  QuoteCalculateRequest,
} from "./types";

/**
 * 견적 항목 목록 조회
 */
export async function getQuoteItems(
  assignmentId: number
): Promise<QuoteSummary> {
  return fetchWithAuth<QuoteSummary>(
    `/admin/assignments/${assignmentId}/quote`
  );
}

/**
 * 견적 항목 추가
 */
export async function createQuoteItem(
  assignmentId: number,
  data: QuoteItemCreate
): Promise<QuoteItem> {
  return fetchWithAuth<QuoteItem>(
    `/admin/assignments/${assignmentId}/quote/items`,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 견적 항목 일괄 추가
 */
export async function createQuoteItemsBulk(
  assignmentId: number,
  data: QuoteItemBulkCreate
): Promise<QuoteSummary> {
  return fetchWithAuth<QuoteSummary>(
    `/admin/assignments/${assignmentId}/quote/items/bulk`,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 견적 항목 수정
 */
export async function updateQuoteItem(
  assignmentId: number,
  itemId: number,
  data: QuoteItemUpdate
): Promise<QuoteItem> {
  return fetchWithAuth<QuoteItem>(
    `/admin/assignments/${assignmentId}/quote/items/${itemId}`,
    {
      method: "PUT",
      body: data,
    }
  );
}

/**
 * 견적 항목 삭제
 */
export async function deleteQuoteItem(
  assignmentId: number,
  itemId: number
): Promise<void> {
  await fetchWithAuth<void>(
    `/admin/assignments/${assignmentId}/quote/items/${itemId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * 모든 견적 항목 삭제
 */
export async function deleteAllQuoteItems(assignmentId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/assignments/${assignmentId}/quote/items`, {
    method: "DELETE",
  });
}

/**
 * 견적 합계 계산 및 저장
 */
export async function calculateQuote(
  assignmentId: number,
  data: QuoteCalculateRequest = { update_assignment: true }
): Promise<QuoteSummary> {
  return fetchWithAuth<QuoteSummary>(
    `/admin/assignments/${assignmentId}/quote/calculate`,
    {
      method: "POST",
      body: data,
    }
  );
}

/**
 * 견적 항목 순서 변경
 */
export async function reorderQuoteItems(
  assignmentId: number,
  itemIds: number[]
): Promise<QuoteSummary> {
  return fetchWithAuth<QuoteSummary>(
    `/admin/assignments/${assignmentId}/quote/items/reorder`,
    {
      method: "POST",
      body: itemIds,
    }
  );
}

/**
 * 견적서 PDF 다운로드 URL 반환
 */
export function getQuotePdfUrl(assignmentId: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return `${baseUrl}/admin/assignments/${assignmentId}/quote/pdf`;
}

/**
 * 견적서 PDF 다운로드 (Blob)
 */
export async function downloadQuotePdf(assignmentId: number): Promise<Blob> {
  const token = getToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const response = await fetch(
    `${baseUrl}/admin/assignments/${assignmentId}/quote/pdf`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "견적서 다운로드에 실패했습니다." }));
    throw new Error(errorData.detail || "견적서 다운로드에 실패했습니다.");
  }

  return response.blob();
}
