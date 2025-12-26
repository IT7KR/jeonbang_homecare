/**
 * 상태 관련 상수 및 헬퍼 함수
 *
 * 신청(Application), 협력사(Partner), SMS 등의 상태 정의를 중앙 관리합니다.
 */

// ===== 타입 정의 =====

export interface StatusConfig {
  label: string;
  color: string;
  order: number;
}

export interface StatusOption {
  value: string;
  label: string;
}

// ===== 신청(Application) 상태 =====

export const APPLICATION_STATUS = {
  NEW: "new",
  CONSULTING: "consulting",
  ASSIGNED: "assigned",
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> =
  {
    [APPLICATION_STATUS.NEW]: {
      label: "신규",
      color: "bg-primary-50 text-primary-700",
      order: 1,
    },
    [APPLICATION_STATUS.CONSULTING]: {
      label: "상담중",
      color: "bg-secondary-50 text-secondary-700",
      order: 2,
    },
    [APPLICATION_STATUS.ASSIGNED]: {
      label: "배정완료",
      color: "bg-purple-50 text-purple-700",
      order: 3,
    },
    [APPLICATION_STATUS.SCHEDULED]: {
      label: "일정확정",
      color: "bg-blue-50 text-blue-700",
      order: 4,
    },
    [APPLICATION_STATUS.COMPLETED]: {
      label: "완료",
      color: "bg-gray-100 text-gray-600",
      order: 5,
    },
    [APPLICATION_STATUS.CANCELLED]: {
      label: "취소",
      color: "bg-red-50 text-red-600",
      order: 6,
    },
  };

export const APPLICATION_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "전체 상태" },
  { value: APPLICATION_STATUS.NEW, label: "신규" },
  { value: APPLICATION_STATUS.CONSULTING, label: "상담중" },
  { value: APPLICATION_STATUS.ASSIGNED, label: "배정완료" },
  { value: APPLICATION_STATUS.SCHEDULED, label: "일정확정" },
  { value: APPLICATION_STATUS.COMPLETED, label: "완료" },
  { value: APPLICATION_STATUS.CANCELLED, label: "취소" },
];

// ===== 협력사(Partner) 상태 =====

export const PARTNER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  INACTIVE: "inactive",
} as const;

export type PartnerStatus =
  (typeof PARTNER_STATUS)[keyof typeof PARTNER_STATUS];

export const PARTNER_STATUS_CONFIG: Record<PartnerStatus, StatusConfig> = {
  [PARTNER_STATUS.PENDING]: {
    label: "대기중",
    color: "bg-secondary-50 text-secondary-700",
    order: 1,
  },
  [PARTNER_STATUS.APPROVED]: {
    label: "승인됨",
    color: "bg-primary-50 text-primary-700",
    order: 2,
  },
  [PARTNER_STATUS.REJECTED]: {
    label: "거절됨",
    color: "bg-red-50 text-red-600",
    order: 3,
  },
  [PARTNER_STATUS.INACTIVE]: {
    label: "비활성",
    color: "bg-gray-100 text-gray-600",
    order: 4,
  },
};

export const PARTNER_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "전체 상태" },
  { value: PARTNER_STATUS.PENDING, label: "대기중" },
  { value: PARTNER_STATUS.APPROVED, label: "승인됨" },
  { value: PARTNER_STATUS.REJECTED, label: "거절됨" },
  { value: PARTNER_STATUS.INACTIVE, label: "비활성" },
];

// ===== SMS 상태 =====

export const SMS_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type SMSStatus = (typeof SMS_STATUS)[keyof typeof SMS_STATUS];

export const SMS_STATUS_CONFIG: Record<SMSStatus, StatusConfig> = {
  [SMS_STATUS.PENDING]: {
    label: "대기중",
    color: "bg-secondary-50 text-secondary-700",
    order: 1,
  },
  [SMS_STATUS.SENT]: {
    label: "발송완료",
    color: "bg-primary-50 text-primary-700",
    order: 2,
  },
  [SMS_STATUS.FAILED]: {
    label: "실패",
    color: "bg-red-50 text-red-600",
    order: 3,
  },
};

export const SMS_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "전체 상태" },
  { value: SMS_STATUS.PENDING, label: "대기중" },
  { value: SMS_STATUS.SENT, label: "발송완료" },
  { value: SMS_STATUS.FAILED, label: "실패" },
];

// ===== 헬퍼 함수 =====

/**
 * 신청 상태 라벨 반환
 */
export function getApplicationStatusLabel(status: string): string {
  return (
    APPLICATION_STATUS_CONFIG[status as ApplicationStatus]?.label ?? status
  );
}

/**
 * 신청 상태 색상 클래스 반환
 */
export function getApplicationStatusColor(status: string): string {
  return (
    APPLICATION_STATUS_CONFIG[status as ApplicationStatus]?.color ??
    "bg-gray-100 text-gray-600"
  );
}

/**
 * 협력사 상태 라벨 반환
 */
export function getPartnerStatusLabel(status: string): string {
  return PARTNER_STATUS_CONFIG[status as PartnerStatus]?.label ?? status;
}

/**
 * 협력사 상태 색상 클래스 반환
 */
export function getPartnerStatusColor(status: string): string {
  return (
    PARTNER_STATUS_CONFIG[status as PartnerStatus]?.color ??
    "bg-gray-100 text-gray-600"
  );
}

/**
 * SMS 상태 라벨 반환
 */
export function getSMSStatusLabel(status: string): string {
  return SMS_STATUS_CONFIG[status as SMSStatus]?.label ?? status;
}

/**
 * SMS 상태 색상 클래스 반환
 */
export function getSMSStatusColor(status: string): string {
  return (
    SMS_STATUS_CONFIG[status as SMSStatus]?.color ?? "bg-gray-100 text-gray-600"
  );
}
