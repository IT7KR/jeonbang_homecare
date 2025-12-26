"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_GROUPS, type ServiceGroupId } from "@/lib/constants/services";
import { ServiceCategoryAccordion } from "./ServiceCategoryAccordion";
import { ServiceSelectionSummary } from "./ServiceSelectionSummary";
import { ServiceSearchInput } from "./ServiceSearchInput";
import { ServiceGroupTabs } from "./ServiceGroupTabs";
import type {
  ServiceSelectorProps,
  ServiceItem,
  CategoryItem,
  ConstantCategory,
} from "./types";

/**
 * 서비스 선택기 컴포넌트 (리팩토링)
 *
 * API 데이터 또는 상수 데이터를 기반으로 서비스를 선택할 수 있습니다.
 * 시니어 친화적인 UI와 명확한 선택 상태를 제공합니다.
 *
 * @features
 * - 그룹 탭: 13개 카테고리를 3개 그룹으로 분류
 * - 검색: 서비스명/카테고리명으로 실시간 검색
 * - 2단 레이아웃: 데스크톱에서 사이드바 + 콘텐츠 구조
 */
export function ServiceSelector(props: ServiceSelectorProps) {
  const {
    selectedServices,
    onServiceToggle,
    isLoading = false,
    error,
    variant = "primary",
    showInstructions = true,
    instructionTitle = "아래 목록에서 원하시는 서비스를 선택해 주세요",
    instructionDescription = "여러 개를 선택할 수 있습니다. 서비스 항목을 누르면 선택됩니다.",
    enableGroupTabs = false,
    enableSearch = false,
    enableDesktopLayout = false,
    enableQuickNav = true,
    defaultGroup = "outdoor",
    seniorMode = false,
    compactMode = false,
    className,
  } = props;

  const isPrimary = variant === "primary";

  // 그룹 탭 상태
  const [activeGroup, setActiveGroup] = useState<ServiceGroupId>(defaultGroup);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");

  // 확장된 카테고리 상태 (기본: 처음 3개, 시니어 모드에서는 전체)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // 초기화 여부 추적 (그룹별로 한 번만 초기화)
  const initializedGroupsRef = useRef<Set<ServiceGroupId>>(new Set());

  // 데이터 타입 결정
  const isApiData = "categories" in props && props.categories;
  const isConstantData =
    "constantCategories" in props && props.constantCategories;

  // 카테고리 목록 통합
  const categoriesList: Array<CategoryItem | ConstantCategory> = isApiData
    ? props.categories
    : isConstantData
    ? [...props.constantCategories]
    : [];

  // 카테고리 ID 추출 헬퍼
  const getCategoryId = useCallback(
    (cat: CategoryItem | ConstantCategory): string => {
      return "code" in cat ? cat.code : cat.id;
    },
    []
  );

  // 그룹별 필터링된 카테고리
  const groupFilteredCategories = useMemo(() => {
    if (!enableGroupTabs) return categoriesList;

    const group = SERVICE_GROUPS.find((g) => g.id === activeGroup);
    if (!group) return categoriesList;

    // Others 그룹인 경우: others에 명시된 것 + 다른 그룹 어디에도 속하지 않은 것(미분류) 포함
    if (activeGroup === "others") {
      const otherGroupsIds = new Set(
        SERVICE_GROUPS.filter((g) => g.id !== "others").flatMap(
          (g) => g.categoryIds
        )
      );

      return categoriesList.filter((cat) => {
        const catId = getCategoryId(cat);
        return group.categoryIds.includes(catId) || !otherGroupsIds.has(catId);
      });
    }

    return categoriesList.filter((cat) => {
      const catId = getCategoryId(cat);
      return group.categoryIds.includes(catId);
    });
  }, [categoriesList, activeGroup, enableGroupTabs, getCategoryId]);

  // 검색 필터링된 카테고리
  const filteredCategories = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return groupFilteredCategories;

    const query = searchQuery.toLowerCase().trim();

    return groupFilteredCategories.filter((cat) => {
      // 카테고리 이름 검색
      if (cat.name.toLowerCase().includes(query)) return true;

      // 서비스 이름 검색
      const services =
        "code" in cat
          ? cat.services
          : cat.services.map((s) => ({ code: s, name: s }));

      return services.some((s) =>
        (typeof s === "string" ? s : s.name).toLowerCase().includes(query)
      );
    });
  }, [groupFilteredCategories, searchQuery, enableSearch]);

  // 그룹별 선택 개수 계산
  const groupSelectedCounts = useMemo(() => {
    // 다른 그룹(others 제외)에 속한 ID 집합 미리 계산
    const otherGroupsIds = new Set(
      SERVICE_GROUPS.filter((g) => g.id !== "others").flatMap(
        (g) => g.categoryIds
      )
    );

    return SERVICE_GROUPS.reduce((acc, group) => {
      let groupCategories;

      if (group.id === "others") {
        // Others: 명시적 포함 + 미분류 항목
        groupCategories = categoriesList.filter((cat) => {
          const catId = getCategoryId(cat);
          return (
            group.categoryIds.includes(catId) || !otherGroupsIds.has(catId)
          );
        });
      } else {
        // 일반 그룹
        groupCategories = categoriesList.filter((cat) => {
          const catId = getCategoryId(cat);
          return group.categoryIds.includes(catId);
        });
      }

      let count = 0;
      groupCategories.forEach((cat) => {
        const services =
          "code" in cat
            ? cat.services
            : cat.services.map((s) => ({ code: s, name: s }));

        services.forEach((s) => {
          const code = typeof s === "string" ? s : s.code;
          if (selectedServices.includes(code)) count++;
        });
      });

      return { ...acc, [group.id]: count };
    }, {} as Record<ServiceGroupId, number>);
  }, [categoriesList, selectedServices, getCategoryId]);

  // 초기 확장 상태 설정 (그룹별로 한 번만 초기화하여 깜빡임 방지)
  useEffect(() => {
    // 이미 초기화된 그룹이면 스킵
    if (initializedGroupsRef.current.has(activeGroup)) {
      return;
    }

    if (filteredCategories.length > 0) {
      const initialExpanded = new Set<string>();
      // 개선: 시니어 모드에서도 초기에는 상위 2개만 펼쳐서 스크롤 부담 감소
      const categoriesToExpand = filteredCategories.slice(
        0,
        seniorMode ? 2 : 3
      );

      categoriesToExpand.forEach((cat) => {
        initialExpanded.add(getCategoryId(cat));
      });
      setExpandedCategories(initialExpanded);
      // 초기화 완료 표시
      initializedGroupsRef.current.add(activeGroup);
    }
  }, [activeGroup, filteredCategories, getCategoryId, seniorMode]);

  // 카테고리 확장/축소 토글
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // 모두 펼치기/접기
  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    filteredCategories.forEach((cat) => {
      allIds.add(getCategoryId(cat));
    });
    setExpandedCategories(allIds);
  }, [filteredCategories, getCategoryId]);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // 카테고리별 서비스 목록 가져오기
  const getServices = useCallback(
    (category: CategoryItem | ConstantCategory): ServiceItem[] => {
      if ("code" in category) {
        // API 데이터 - is_active를 isActive로 변환
        return category.services.map((s) => ({
          ...s,
          // API 응답의 is_active를 isActive로 매핑
          isActive:
            (s as unknown as { is_active?: boolean }).is_active !== false,
        }));
      } else {
        // 상수 데이터 - 이름만 있는 경우
        return category.services.map((s) => ({
          code: s,
          name: s,
          isActive: true,
        }));
      }
    },
    []
  );

  // 선택된 서비스 이름 목록 가져오기
  const getSelectedServiceNames = useCallback((): string[] => {
    const names: string[] = [];
    categoriesList.forEach((cat) => {
      const services = getServices(cat);
      services.forEach((s) => {
        if (selectedServices.includes(s.code)) {
          names.push(s.name);
        }
      });
    });
    return names;
  }, [categoriesList, selectedServices, getServices]);

  // 서비스 토글 핸들러를 메모이제이션 (자식 컴포넌트 리렌더 방지)
  const handleServiceToggle = useCallback(
    (code: string) => {
      onServiceToggle(code);
    },
    [onServiceToggle]
  );

  // 카테고리 토글 핸들러를 메모이제이션
  const handleCategoryToggle = useCallback(
    (categoryId: string) => () => {
      toggleCategory(categoryId);
    },
    [toggleCategory]
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2
          className={cn(
            "w-14 h-14 animate-spin",
            isPrimary ? "text-primary" : "text-secondary"
          )}
        />
        <p className="text-lg md:text-xl text-gray-600">
          서비스 목록을 불러오는 중...
        </p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg md:text-xl text-red-500">{error}</p>
        <p className="text-base md:text-lg text-gray-500 mt-2">
          잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  const selectedNames = getSelectedServiceNames();
  const allExpanded = expandedCategories.size === filteredCategories.length;

  // 검색/그룹 탭 컨트롤 영역
  const ControlsSection = () => (
    <div className="space-y-4">
      {enableSearch && (
        <ServiceSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="서비스 검색"
          variant={variant}
        />
      )}
      {enableGroupTabs && (
        <ServiceGroupTabs
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
          selectedCounts={groupSelectedCounts}
          variant={variant}
          layout={enableDesktopLayout ? "vertical" : "horizontal"}
        />
      )}
    </div>
  );

  // 카테고리 목록 영역
  const CategoriesSection = () => (
    <div className="space-y-3">
      {/* 퀵 네비게이션 (가로 칩 목록) - 옵션으로 제어 */}
      {enableQuickNav && filteredCategories.length > 1 && (
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-1 px-1">
          {filteredCategories.map((cat) => {
            const id = getCategoryId(cat);
            const isExpanded = expandedCategories.has(id);
            return (
              <button
                key={`nav-${id}`}
                type="button"
                onClick={() => {
                  if (!isExpanded) toggleCategory(id);
                  // 해당 ID를 가진 요소로 스크롤
                  setTimeout(() => {
                    const el = document.getElementById(`category-${id}`);
                    if (el) {
                      const offset = 100; // 상단 여백 (헤더 고려)
                      const bodyRect =
                        document.body.getBoundingClientRect().top;
                      const elementRect = el.getBoundingClientRect().top;
                      const elementPosition = elementRect - bodyRect;
                      const offsetPosition = elementPosition - offset;

                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth",
                      });
                    }
                  }, 50);
                }}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all",
                  isExpanded
                    ? isPrimary
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary/10 border-secondary text-secondary"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 펼치기/접기 컨트롤 - 컴팩트 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {filteredCategories.length}개 카테고리
        </span>
        <button
          type="button"
          onClick={allExpanded ? collapseAll : expandAll}
          className={cn(
            "px-3 py-1.5 rounded-lg",
            "text-sm font-medium",
            "border transition-colors",
            isPrimary
              ? "border-primary/30 text-primary hover:bg-primary/5"
              : "border-secondary/30 text-secondary hover:bg-secondary/5"
          )}
        >
          {allExpanded ? "모두 접기" : "모두 펼치기"}
        </button>
      </div>

      {/* 카테고리 목록 */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-3">
          {filteredCategories.map((category, index) => {
            const id = getCategoryId(category);
            const name = category.name;
            const icon = category.icon;
            const services = getServices(category);

            return (
              <ServiceCategoryAccordion
                key={id}
                id={`category-${id}`}
                name={name}
                index={index}
                icon={icon}
                services={services}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                isExpanded={expandedCategories.has(id)}
                onToggleExpand={handleCategoryToggle(id)}
                variant={variant}
                seniorMode={seniorMode}
                compactMode={compactMode}
              />
            );
          })}
        </div>
      ) : (
        // 검색 결과 없음
        <div className="text-center py-12">
          <Search className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <p className="text-lg md:text-xl text-gray-500">
            "{searchQuery}"에 해당하는 서비스가 없습니다
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className={cn(
              "mt-4 px-6 py-3 rounded-xl",
              "text-base md:text-lg font-semibold",
              isPrimary
                ? "text-primary hover:bg-primary/10"
                : "text-secondary hover:bg-secondary/10"
            )}
          >
            전체 보기
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* 안내 문구 */}
      {showInstructions && (
        <div
          className={cn(
            "rounded-2xl p-6 border-2",
            isPrimary
              ? "bg-primary/5 border-primary/20"
              : "bg-secondary/5 border-secondary/20"
          )}
        >
          <p
            className={cn(
              "text-xl md:text-2xl font-bold",
              isPrimary ? "text-primary" : "text-secondary"
            )}
          >
            {instructionTitle}
          </p>
          {instructionDescription && (
            <p className="text-base md:text-lg text-gray-600 mt-2">
              {instructionDescription}
            </p>
          )}
        </div>
      )}

      {/* 선택 요약 */}
      <ServiceSelectionSummary
        count={selectedServices.length}
        selectedNames={selectedNames}
        variant={variant}
      />

      {/* 레이아웃: 데스크톱 2단 또는 기본 세로 스택 */}
      {enableDesktopLayout && (enableGroupTabs || enableSearch) ? (
        <>
          {/* 모바일: 세로 스택 */}
          <div className="md:hidden space-y-4">
            <ControlsSection />
            <CategoriesSection />
          </div>

          {/* 데스크톱: 2단 레이아웃 */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-6">
            {/* 사이드바 - sticky */}
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-4">
                <ControlsSection />
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="md:col-span-3">
              <CategoriesSection />
            </div>
          </div>
        </>
      ) : (
        // 기본 레이아웃 (세로 스택)
        <div className="space-y-4">
          {(enableGroupTabs || enableSearch) && <ControlsSection />}
          <CategoriesSection />
        </div>
      )}

    </div>
  );
}

export default ServiceSelector;
