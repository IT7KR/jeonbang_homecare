// 신청 관련 상수

export const STATUS_OPTIONS = [
  {
    value: "new",
    label: "신규",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "consulting",
    label: "상담중",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    value: "assigned",
    label: "배정완료",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "scheduled",
    label: "일정확정",
    color: "bg-primary-50 text-primary-700 border-primary-200",
  },
  {
    value: "completed",
    label: "완료",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  {
    value: "cancelled",
    label: "취소",
    color: "bg-red-50 text-red-600 border-red-200",
  },
] as const;

export const TIME_OPTIONS = [
  { value: "", label: "시간 선택" },
  { value: "09:00", label: "오전 9시" },
  { value: "10:00", label: "오전 10시" },
  { value: "11:00", label: "오전 11시" },
  { value: "13:00", label: "오후 1시" },
  { value: "14:00", label: "오후 2시" },
  { value: "15:00", label: "오후 3시" },
  { value: "16:00", label: "오후 4시" },
  { value: "오전", label: "오전 (시간 미정)" },
  { value: "오후", label: "오후 (시간 미정)" },
  { value: "종일", label: "종일" },
] as const;

export const CANCEL_REASONS = [
  { value: "", label: "사유 선택" },
  { value: "고객 요청", label: "고객 요청" },
  { value: "일정 조율 불가", label: "일정 조율 불가" },
  { value: "서비스 범위 초과", label: "서비스 범위 초과" },
  { value: "협력사 배정 불가", label: "협력사 배정 불가" },
  { value: "중복 신청", label: "중복 신청" },
  { value: "other", label: "기타 (직접 입력)" },
] as const;

// 배정 상태 (3개로 단순화)
export const ASSIGNMENT_STATUSES = ["pending", "scheduled", "completed"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

// 배정 상태 매핑
export const ASSIGNMENT_STATUS_MAP: Record<string, { label: string; color: string; description: string }> = {
  pending: {
    label: "대기",
    color: "bg-gray-100 text-gray-700",
    description: "일정 미확정",
  },
  scheduled: {
    label: "일정확정",
    color: "bg-purple-50 text-purple-700",
    description: "일정이 확정됨",
  },
  completed: {
    label: "완료",
    color: "bg-green-50 text-green-700",
    description: "작업 완료",
  },
};

// 배정 상태 전환 규칙
export const ASSIGNMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["scheduled"],
  scheduled: ["completed"],
  completed: [], // 최종 상태
};

// 배정 퀵 액션 정의
export const ASSIGNMENT_QUICK_ACTIONS: Record<string, { label: string; nextStatus: string; icon: string } | null> = {
  pending: { label: "일정 확정", nextStatus: "scheduled", icon: "Calendar" },
  scheduled: { label: "완료 처리", nextStatus: "completed", icon: "CheckCircle" },
  completed: null,
};

// 배정 스텝 정의 (스텝 인디케이터용)
export const ASSIGNMENT_STEPS = [
  { status: "pending", label: "대기" },
  { status: "scheduled", label: "일정확정" },
  { status: "completed", label: "완료" },
] as const;

// 헬퍼 함수들
export const getStatusInfo = (statusValue: string) => {
  return STATUS_OPTIONS.find((s) => s.value === statusValue) || STATUS_OPTIONS[0];
};

export const getAssignmentStatusInfo = (statusValue: string) => {
  return ASSIGNMENT_STATUS_MAP[statusValue] || { label: statusValue, color: "bg-gray-100 text-gray-700", description: "" };
};

// 배정 상태 전환 가능 여부 확인
export const canTransitionAssignmentTo = (fromStatus: string, toStatus: string): boolean => {
  return ASSIGNMENT_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
};

// 다음 가능한 배정 상태 목록 조회
export const getNextAssignmentStatuses = (currentStatus: string): string[] => {
  return ASSIGNMENT_STATUS_TRANSITIONS[currentStatus] || [];
};

// 배정 퀵 액션 조회
export const getAssignmentQuickAction = (status: string) => {
  return ASSIGNMENT_QUICK_ACTIONS[status] || null;
};

// 현재 배정 상태의 스텝 인덱스 조회
export const getAssignmentStepIndex = (status: string): number => {
  return ASSIGNMENT_STEPS.findIndex(step => step.status === status);
};

/**
 * 상태 변경 시 SMS가 실제로 발송되는지 확인하는 함수
 * 백엔드 로직과 동기화되어야 함
 */
export const willSendSmsForStatusChange = (
  prevStatus: string,
  newStatus: string
): boolean => {
  // consulting 상태로 변경 (접수 확인 알림)
  if (newStatus === "consulting" && prevStatus === "new") {
    return true;
  }

  // scheduled 상태로 변경 (일정 확정 알림)
  if (newStatus === "scheduled" && prevStatus !== "scheduled") {
    return true;
  }

  // completed 상태로 변경 (완료 알림)
  if (newStatus === "completed" && prevStatus !== "completed") {
    return true;
  }

  // cancelled 상태는 별도 취소 모달에서 처리
  // assigned 상태 변경은 SMS 발송 로직 없음
  return false;
};

// 타입 정의
export type ApplicationStatusItem = typeof STATUS_OPTIONS[number];
export type TimeOption = typeof TIME_OPTIONS[number];
export type CancelReason = typeof CANCEL_REASONS[number];
