/**
 * Regions API Client
 */

import { fetchApi } from "./client";

// API Response Types
export interface DistrictResponse {
  code: string;
  name: string;
}

export interface ProvinceResponse {
  code: string;
  name: string;
  short_name: string;
}

export interface ProvinceWithDistrictsResponse {
  code: string;
  name: string;
  short_name: string;
  districts: DistrictResponse[];
}

// Frontend Type (camelCase)
export interface Province {
  code: string;
  name: string;
  shortName: string;
  districts: District[];
}

export interface District {
  code: string;
  name: string;
}

/**
 * 시/도 목록 조회
 */
export async function getProvinces(): Promise<ProvinceResponse[]> {
  return fetchApi<ProvinceResponse[]>("/regions/provinces");
}

/**
 * 특정 시/도의 시/군/구 목록 조회
 */
export async function getDistricts(
  provinceCode: string
): Promise<DistrictResponse[]> {
  return fetchApi<DistrictResponse[]>(
    `/regions/provinces/${provinceCode}/districts`
  );
}

/**
 * 전체 지역 목록 조회 (시/도 + 시/군/구)
 * 캐싱에 적합
 */
export async function getAllRegions(): Promise<ProvinceWithDistrictsResponse[]> {
  return fetchApi<ProvinceWithDistrictsResponse[]>("/regions/all");
}

/**
 * API 응답을 프론트엔드 형식으로 변환
 */
export function transformRegions(
  regions: ProvinceWithDistrictsResponse[]
): Province[] {
  return regions.map((region) => ({
    code: region.code,
    name: region.name,
    shortName: region.short_name,
    districts: region.districts,
  }));
}
