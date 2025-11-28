/**
 * Services API Client
 * 서비스 카테고리 및 타입 API
 */

import { fetchApi } from "./client";

// Response Types
export interface ServiceType {
  code: string;
  name: string;
  category_code: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ServiceCategory {
  code: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
}

export interface ServiceCategoryWithTypes extends ServiceCategory {
  services: ServiceType[];
}

export interface ServicesListResponse {
  categories: ServiceCategoryWithTypes[];
}

/**
 * 전체 서비스 목록 조회 (카테고리 + 서비스 타입)
 */
export async function getServices(): Promise<ServicesListResponse> {
  return fetchApi<ServicesListResponse>("/services");
}

/**
 * 서비스 카테고리 목록 조회
 */
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  return fetchApi<ServiceCategory[]>("/services/categories");
}

/**
 * 서비스 타입 목록 조회
 */
export async function getServiceTypes(
  categoryCode?: string
): Promise<ServiceType[]> {
  const params = categoryCode ? { category_code: categoryCode } : undefined;
  return fetchApi<ServiceType[]>("/services/types", { params });
}

/**
 * 서비스 코드로 이름 조회 헬퍼
 */
export function getServiceNameFromList(
  services: ServicesListResponse,
  code: string
): string {
  for (const category of services.categories) {
    const service = category.services.find((s) => s.code === code);
    if (service) return service.name;
  }
  return code; // fallback to code if not found
}

/**
 * 서비스 코드 배열을 이름 배열로 변환
 */
export function getServiceNamesFromList(
  services: ServicesListResponse,
  codes: string[]
): string[] {
  return codes.map((code) => getServiceNameFromList(services, code));
}
