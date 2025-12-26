import { ReactNode } from "react";

/**
 * 시니어 친화적 폼 컴포넌트 variant
 */
export type SeniorFormVariant = "primary" | "secondary";

/**
 * SeniorLabel 컴포넌트 Props
 */
export interface SeniorLabelProps {
  /** 라벨 텍스트 */
  children: ReactNode;
  /** 연결된 입력 필드 ID */
  htmlFor?: string;
  /** 필수 여부 */
  required?: boolean;
  /** 선택 항목 여부 */
  optional?: boolean;
  /** 힌트 텍스트 */
  hint?: ReactNode;
  /** 테마 variant */
  variant?: SeniorFormVariant;
  /** 추가 className */
  className?: string;
}

/**
 * FieldError 컴포넌트 Props
 */
export interface FieldErrorProps {
  /** 에러 메시지 */
  message?: string;
  /** 연결된 필드 ID */
  fieldId?: string;
  /** 테마 variant */
  variant?: SeniorFormVariant;
  /** 추가 className */
  className?: string;
}

/**
 * AgreementCheckbox 컴포넌트 Props
 */
export interface AgreementCheckboxProps {
  /** 체크박스 ID */
  id: string;
  /** 체크박스 이름 */
  name: string;
  /** 라벨 텍스트 */
  label: ReactNode;
  /** 상세 설명 */
  description?: string;
  /** 체크 상태 */
  checked: boolean;
  /** 변경 핸들러 */
  onChange: (checked: boolean) => void;
  /** 필수 여부 */
  required?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 테마 variant */
  variant?: SeniorFormVariant;
  /** 전체 내용 보기 링크 */
  viewDetailsLink?: string;
  /** 추가 className */
  className?: string;
}

/**
 * 확인 항목 인터페이스
 */
export interface ConfirmationItem {
  /** 라벨 */
  label: string;
  /** 값 */
  value: string | string[];
  /** 아이콘 (선택) */
  icon?: ReactNode;
}

/**
 * 확인 섹션 인터페이스
 */
export interface ConfirmationSection {
  /** 섹션 제목 */
  title: string;
  /** 항목 목록 */
  items: ConfirmationItem[];
}

/**
 * ConfirmationStep 컴포넌트 Props
 */
export interface ConfirmationStepProps {
  /** 확인 섹션 목록 */
  sections: ConfirmationSection[];
  /** 편집 버튼 클릭 핸들러 */
  onEdit?: (sectionIndex: number) => void;
  /** 테마 variant */
  variant?: SeniorFormVariant;
  /** 추가 className */
  className?: string;
}

/**
 * SeniorInput 컴포넌트 Props
 */
export interface SeniorInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 입력 필드 ID */
  id: string;
  /** 라벨 텍스트 */
  label: string;
  /** 필수 여부 */
  required?: boolean;
  /** 선택 항목 여부 */
  optional?: boolean;
  /** 힌트 텍스트 */
  hint?: ReactNode;
  /** 에러 메시지 */
  error?: string;
  /** 테마 variant */
  variant?: SeniorFormVariant;
  /** 컨테이너 className */
  containerClassName?: string;
  /** 좌측 아이콘 */
  leftIcon?: ReactNode;
}

/**
 * SeniorTextarea 컴포넌트 Props
 */
export interface SeniorTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 입력 필드 ID */
  id: string;
  /** 라벨 텍스트 */
  label: string;
  /** 필수 여부 */
  required?: boolean;
  /** 선택 항목 여부 */
  optional?: boolean;
  /** 힌트 텍스트 */
  hint?: ReactNode;
  /** 에러 메시지 */
  error?: string;
  /** 테마 variant */
  variant?: SeniorFormVariant;
  /** 컨테이너 className */
  containerClassName?: string;
  /**
   * 접이식 모드 활성화
   * 기본 줄 수로 시작하고, 펼치기 버튼으로 확장
   */
  collapsible?: boolean;
  /** 접힌 상태의 줄 수 (collapsible=true일 때) */
  collapsedRows?: number;
  /** 펼쳐진 상태의 줄 수 (collapsible=true일 때) */
  expandedRows?: number;
  /** 펼치기 버튼 텍스트 */
  expandLabel?: string;
  /** 접기 버튼 텍스트 */
  collapseLabel?: string;
}
