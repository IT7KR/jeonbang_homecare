import { ReactNode } from "react";
import type { ServiceGroupId } from "@/lib/constants/services";

// Re-export for convenience
export type { ServiceGroupId };

/**
 * 서비스 컴포넌트 공통 variant 타입
 */
export type ServiceVariant = "primary" | "secondary";

/**
 * 개별 서비스 항목 인터페이스
 */
export interface ServiceItem {
  /** 서비스 고유 코드 */
  code: string;
  /** 서비스 이름 */
  name: string;
  /** 서비스 설명 (선택) */
  description?: string | null;
}

/**
 * 카테고리 항목 인터페이스 (API 응답용)
 */
export interface CategoryItem {
  /** 카테고리 코드 */
  code: string;
  /** 카테고리 이름 */
  name: string;
  /** 카테고리 부제목 (선택) */
  subtitle?: string;
  /** 아이콘 이름 (lucide-react) */
  icon?: string | null;
  /** 카테고리 내 서비스 목록 */
  services: ServiceItem[];
}

/**
 * 상수 카테고리 인터페이스 (협력사 페이지용)
 */
export interface ConstantCategory {
  /** 카테고리 ID */
  id: string;
  /** 카테고리 이름 */
  name: string;
  /** 카테고리 부제목 (선택) */
  subtitle?: string;
  /** 아이콘 이름 (lucide-react) */
  icon?: string;
  /** 서비스 이름 목록 */
  services: readonly string[];
}

/**
 * ServiceCard 컴포넌트 Props
 */
export interface ServiceCardProps {
  /** 서비스 코드 */
  code: string;
  /** 서비스 이름 */
  name: string;
  /** 서비스 설명 (선택, API에서 null 반환 가능) */
  description?: string | null;
  /** 선택 여부 */
  isSelected: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 테마 variant */
  variant?: ServiceVariant;
  /** 추가 className */
  className?: string;
}

/**
 * ServiceCategoryAccordion 컴포넌트 Props
 */
export interface ServiceCategoryAccordionProps {
  /** 카테고리 ID/코드 */
  id: string;
  /** 카테고리 이름 */
  name: string;
  /** 카테고리 번호 (순서) */
  index: number;
  /** 아이콘 이름 */
  icon?: string | null;
  /** 서비스 목록 */
  services: ServiceItem[];
  /** 선택된 서비스 코드 목록 */
  selectedServices: string[];
  /** 서비스 토글 핸들러 */
  onServiceToggle: (code: string) => void;
  /** 확장 상태 */
  isExpanded: boolean;
  /** 확장 토글 핸들러 */
  onToggleExpand: () => void;
  /** 테마 variant */
  variant?: ServiceVariant;
  /** 추가 className */
  className?: string;
}

/**
 * ServiceSelectionSummary 컴포넌트 Props
 */
export interface ServiceSelectionSummaryProps {
  /** 선택된 서비스 수 */
  count: number;
  /** 선택된 서비스 이름 목록 */
  selectedNames: string[];
  /** 최대 표시 개수 */
  maxDisplay?: number;
  /** 테마 variant */
  variant?: ServiceVariant;
  /** 추가 className */
  className?: string;
}

/**
 * ServiceSearchInput 컴포넌트 Props
 */
export interface ServiceSearchInputProps {
  /** 검색어 */
  value: string;
  /** 검색어 변경 핸들러 */
  onChange: (value: string) => void;
  /** placeholder */
  placeholder?: string;
  /** 테마 variant */
  variant?: ServiceVariant;
  /** 추가 className */
  className?: string;
}

/**
 * ServiceGroupTabs 컴포넌트 Props
 */
export interface ServiceGroupTabsProps {
  /** 활성화된 그룹 */
  activeGroup: ServiceGroupId;
  /** 그룹 변경 핸들러 */
  onGroupChange: (groupId: ServiceGroupId) => void;
  /** 그룹별 선택 개수 */
  selectedCounts?: Record<ServiceGroupId, number>;
  /** 테마 variant */
  variant?: ServiceVariant;
  /** 레이아웃 방향 */
  layout?: "horizontal" | "vertical";
  /** 추가 className */
  className?: string;
}

/**
 * ServiceSelector 컴포넌트 공통 Props
 */
export interface ServiceSelectorBaseProps {
  /** 선택된 서비스 코드 목록 */
  selectedServices: string[];
  /** 서비스 토글 핸들러 */
  onServiceToggle: (code: string) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 테마 variant */
  variant?: ServiceVariant;
  /** 안내 텍스트 표시 여부 */
  showInstructions?: boolean;
  /** 안내 제목 */
  instructionTitle?: string;
  /** 안내 설명 */
  instructionDescription?: string;
  /** 그룹 탭 활성화 */
  enableGroupTabs?: boolean;
  /** 검색 활성화 */
  enableSearch?: boolean;
  /** 데스크톱 2단 레이아웃 활성화 (768px+) */
  enableDesktopLayout?: boolean;
  /** 기본 활성 그룹 */
  defaultGroup?: ServiceGroupId;
  /** 추가 className */
  className?: string;
}

/**
 * API 데이터 기반 ServiceSelector Props
 */
export interface ApiServiceSelectorProps extends ServiceSelectorBaseProps {
  /** API 카테고리 데이터 */
  categories: CategoryItem[];
  /** 상수 카테고리 (사용 안함) */
  constantCategories?: never;
}

/**
 * 상수 데이터 기반 ServiceSelector Props
 */
export interface ConstantServiceSelectorProps extends ServiceSelectorBaseProps {
  /** 상수 카테고리 데이터 */
  constantCategories: readonly ConstantCategory[];
  /** API 카테고리 (사용 안함) */
  categories?: never;
}

/**
 * ServiceSelector 통합 Props
 */
export type ServiceSelectorProps =
  | ApiServiceSelectorProps
  | ConstantServiceSelectorProps;
