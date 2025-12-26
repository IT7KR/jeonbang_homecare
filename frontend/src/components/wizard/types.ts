import { ReactNode } from "react";

/**
 * 마법사 테마 variant
 */
export type WizardVariant = "primary" | "secondary";

/**
 * 스텝 상태
 */
export type StepStatus = "pending" | "active" | "completed";

/**
 * 스텝 정보
 */
export interface StepInfo {
  /** 스텝 번호 (1부터 시작) */
  number: number;
  /** 스텝 라벨 */
  label: string;
  /** 스텝 설명 (선택) */
  description?: string;
  /** 스텝 아이콘 (선택) */
  icon?: ReactNode;
  /** 스텝 상태 */
  status: StepStatus;
}

/**
 * 스텝 인디케이터 Props
 */
export interface StepIndicatorProps {
  /** 스텝 목록 */
  steps: Array<{
    label: string;
    description?: string;
    icon?: ReactNode;
    /** 예상 소요시간 (예: "약 1분") */
    estimatedTime?: string;
  }>;
  /** 현재 스텝 (1부터 시작) */
  currentStep: number;
  /** 완료된 스텝 목록 */
  completedSteps: number[];
  /** 테마 variant */
  variant?: WizardVariant;
  /** 클릭 시 해당 스텝으로 이동 */
  onStepClick?: (step: number) => void;
  /** 추가 className */
  className?: string;
  /** 예상 시간 표시 여부 */
  showEstimatedTime?: boolean;
}

/**
 * 마법사 네비게이션 Props
 */
export interface WizardNavigationProps {
  /** 현재 스텝 (1부터 시작) */
  currentStep: number;
  /** 총 스텝 수 */
  totalSteps: number;
  /** 이전 버튼 클릭 */
  onPrev?: () => void;
  /** 다음 버튼 클릭 */
  onNext?: () => void;
  /** 제출 버튼 클릭 */
  onSubmit?: () => void;
  /** 이전 버튼 라벨 */
  prevLabel?: string;
  /** 다음 버튼 라벨 */
  nextLabel?: string;
  /** 제출 버튼 라벨 */
  submitLabel?: string;
  /** 이전 버튼 표시 여부 */
  showPrev?: boolean;
  /** 다음 버튼 비활성화 */
  isNextDisabled?: boolean;
  /** 제출 버튼 비활성화 */
  isSubmitDisabled?: boolean;
  /** 제출 중 상태 */
  isSubmitting?: boolean;
  /** 첫 번째 스텝인지 */
  isFirstStep?: boolean;
  /** 마지막 스텝인지 */
  isLastStep?: boolean;
  /** 전화 문의 버튼 표시 */
  showPhoneButton?: boolean;
  /** 전화번호 */
  phoneNumber?: string;
  /** 테마 variant */
  variant?: WizardVariant;
  /** 추가 className */
  className?: string;
  /** 진행률 퍼센트 표시 여부 */
  showProgressPercentage?: boolean;
}

/**
 * 스텝 헤더 Props
 */
export interface StepHeaderProps {
  /** 스텝 번호 */
  stepNumber: number;
  /** 총 스텝 수 */
  totalSteps: number;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 아이콘 */
  icon?: ReactNode;
  /** 테마 variant */
  variant?: WizardVariant;
  /** 추가 className */
  className?: string;
}

/**
 * 마법사 컨테이너 Props
 */
export interface WizardContainerProps {
  /** 자식 요소 */
  children: ReactNode;
  /** 테마 variant */
  variant?: WizardVariant;
  /** 추가 className */
  className?: string;
}
