"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  X,
  MapPin,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAllRegions,
  transformRegions,
  type Province,
} from "@/lib/api/regions";
import { type SelectedRegion, formatSelectedRegions } from "@/lib/constants/regions";
import { cn } from "@/lib/utils";

interface RegionSelectorProps {
  value: SelectedRegion[];
  onChange: (regions: SelectedRegion[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function RegionSelector({
  value = [],
  onChange,
  placeholder = "활동 지역을 선택하세요",
  className,
  error,
}: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  // API에서 지역 데이터 가져오기
  const {
    data: regions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const data = await getAllRegions();
      return transformRegions(data);
    },
    staleTime: 5 * 60 * 1000, // 5분 캐싱
  });

  // 선택된 지역을 표시 문자열로 변환
  const displayText = useMemo(() => {
    if (value.length === 0) return "";
    return formatSelectedRegions(value);
  }, [value]);

  // 시/도가 선택되었는지 확인
  const isProvinceSelected = (provinceCode: string) => {
    return value.some((r) => r.provinceCode === provinceCode);
  };

  // 시/도 전체가 선택되었는지 확인
  const isProvinceAllSelected = (provinceCode: string) => {
    const region = value.find((r) => r.provinceCode === provinceCode);
    return region?.isAllDistricts ?? false;
  };

  // 특정 시/군/구가 선택되었는지 확인
  const isDistrictSelected = (provinceCode: string, districtCode: string) => {
    const region = value.find((r) => r.provinceCode === provinceCode);
    if (!region) return false;
    if (region.isAllDistricts) return true;
    return region.districtCodes.includes(districtCode);
  };

  // 시/도 전체 선택/해제
  const handleProvinceAllToggle = (province: Province) => {
    const existing = value.find((r) => r.provinceCode === province.code);

    if (existing?.isAllDistricts) {
      // 전체 선택 해제 → 해당 시/도 제거
      onChange(value.filter((r) => r.provinceCode !== province.code));
    } else {
      // 전체 선택
      const newRegion: SelectedRegion = {
        provinceCode: province.code,
        provinceName: province.name,
        districtCodes: [],
        districtNames: [],
        isAllDistricts: true,
      };
      const filtered = value.filter((r) => r.provinceCode !== province.code);
      onChange([...filtered, newRegion]);
    }
  };

  // 개별 시/군/구 선택/해제
  const handleDistrictToggle = (province: Province, districtCode: string) => {
    const district = province.districts.find((d) => d.code === districtCode);
    if (!district) return;

    const existing = value.find((r) => r.provinceCode === province.code);

    if (!existing) {
      // 새로 추가
      const newRegion: SelectedRegion = {
        provinceCode: province.code,
        provinceName: province.name,
        districtCodes: [districtCode],
        districtNames: [district.name],
        isAllDistricts: false,
      };
      onChange([...value, newRegion]);
    } else if (existing.isAllDistricts) {
      // 전체 선택 상태에서 개별 해제 → 해당 구만 제외
      const newDistrictCodes = province.districts
        .filter((d) => d.code !== districtCode)
        .map((d) => d.code);
      const newDistrictNames = province.districts
        .filter((d) => d.code !== districtCode)
        .map((d) => d.name);

      if (newDistrictCodes.length === 0) {
        onChange(value.filter((r) => r.provinceCode !== province.code));
      } else {
        const updated: SelectedRegion = {
          ...existing,
          districtCodes: newDistrictCodes,
          districtNames: newDistrictNames,
          isAllDistricts: false,
        };
        onChange(
          value.map((r) => (r.provinceCode === province.code ? updated : r))
        );
      }
    } else {
      // 개별 선택 상태
      const isSelected = existing.districtCodes.includes(districtCode);

      if (isSelected) {
        // 해제
        const newDistrictCodes = existing.districtCodes.filter(
          (c) => c !== districtCode
        );
        const newDistrictNames = existing.districtNames.filter(
          (n) => n !== district.name
        );

        if (newDistrictCodes.length === 0) {
          onChange(value.filter((r) => r.provinceCode !== province.code));
        } else {
          const updated: SelectedRegion = {
            ...existing,
            districtCodes: newDistrictCodes,
            districtNames: newDistrictNames,
          };
          onChange(
            value.map((r) => (r.provinceCode === province.code ? updated : r))
          );
        }
      } else {
        // 추가
        const newDistrictCodes = [...existing.districtCodes, districtCode];
        const newDistrictNames = [...existing.districtNames, district.name];

        // 모든 구가 선택되면 전체 선택으로 변경
        if (newDistrictCodes.length === province.districts.length) {
          const updated: SelectedRegion = {
            ...existing,
            districtCodes: [],
            districtNames: [],
            isAllDistricts: true,
          };
          onChange(
            value.map((r) => (r.provinceCode === province.code ? updated : r))
          );
        } else {
          const updated: SelectedRegion = {
            ...existing,
            districtCodes: newDistrictCodes,
            districtNames: newDistrictNames,
          };
          onChange(
            value.map((r) => (r.provinceCode === province.code ? updated : r))
          );
        }
      }
    }
  };

  // 선택된 지역 태그 제거
  const handleRemoveRegion = (provinceCode: string) => {
    onChange(value.filter((r) => r.provinceCode !== provinceCode));
  };

  // 전체 초기화
  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* 선택된 지역 표시 또는 선택 버튼 */}
      {value.length > 0 ? (
        <div className="space-y-2">
          {/* 선택된 지역 태그들 */}
          <div className="flex flex-wrap gap-2">
            {value.map((region) => (
              <div
                key={region.provinceCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-sm"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {region.isAllDistricts
                    ? `${region.provinceName} 전체`
                    : `${region.provinceName} ${region.districtNames.join(", ")}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(region.provinceCode)}
                  className="ml-1 hover:text-secondary/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {/* 추가/수정 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600"
          >
            {isOpen ? "닫기" : "지역 추가/수정"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 justify-start text-gray-400 font-normal hover:text-gray-600"
        >
          <MapPin className="h-5 w-5 mr-2" />
          {placeholder}
        </Button>
      )}

      {/* 지역 선택 패널 */}
      {isOpen && (
        <div className="border rounded-lg bg-white shadow-lg max-h-96 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              지역 선택 (시/도 → 시/군/구)
            </span>
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                전체 초기화
              </button>
            )}
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                지역 데이터 로딩 중...
              </span>
            </div>
          )}

          {/* 에러 상태 */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                지역 데이터를 불러오지 못했습니다
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* 시/도 목록 */}
          {!isLoading && !isError && (
            <div className="overflow-y-auto max-h-80">
              {regions.map((province) => (
                <div key={province.code} className="border-b last:border-b-0">
                  {/* 시/도 헤더 */}
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                      isProvinceSelected(province.code) && "bg-secondary/5"
                    )}
                    onClick={() =>
                      setExpandedProvince(
                        expandedProvince === province.code ? null : province.code
                      )
                    }
                  >
                    <div className="flex items-center flex-1">
                      {expandedProvince === province.code ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className="font-medium text-gray-800">
                        {province.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({province.districts.length}개 시/군/구)
                      </span>
                    </div>

                    {/* 전체 선택 체크박스 */}
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                        <Checkbox
                          checked={isProvinceAllSelected(province.code)}
                          onCheckedChange={() => handleProvinceAllToggle(province)}
                        />
                        <span>전체</span>
                      </label>
                    </div>
                  </div>

                  {/* 시/군/구 목록 */}
                  {expandedProvince === province.code && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <div className="flex flex-wrap gap-2">
                        {province.districts.map((district) => {
                          const isSelected = isDistrictSelected(
                            province.code,
                            district.code
                          );
                          return (
                            <button
                              key={district.code}
                              type="button"
                              onClick={() =>
                                handleDistrictToggle(province, district.code)
                              }
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                isSelected
                                  ? "bg-secondary text-white"
                                  : "bg-white text-gray-700 border hover:border-secondary hover:text-secondary"
                              )}
                            >
                              {isSelected && (
                                <Check className="inline h-3.5 w-3.5 mr-1" />
                              )}
                              {district.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
