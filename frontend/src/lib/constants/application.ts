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

// 배정 상태 매핑
export const ASSIGNMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-gray-100 text-gray-700" },
  notified: { label: "알림발송", color: "bg-blue-50 text-blue-700" },
  accepted: { label: "수락", color: "bg-green-50 text-green-700" },
  rejected: { label: "거절", color: "bg-red-50 text-red-600" },
  scheduled: { label: "일정확정", color: "bg-purple-50 text-purple-700" },
  in_progress: { label: "진행중", color: "bg-yellow-50 text-yellow-700" },
  completed: { label: "완료", color: "bg-primary-50 text-primary-700" },
  cancelled: { label: "취소", color: "bg-red-50 text-red-600" },
};

// 헬퍼 함수들
export const getStatusInfo = (statusValue: string) => {
  return STATUS_OPTIONS.find((s) => s.value === statusValue) || STATUS_OPTIONS[0];
};

export const getAssignmentStatusInfo = (statusValue: string) => {
  return ASSIGNMENT_STATUS_MAP[statusValue] || { label: statusValue, color: "bg-gray-100 text-gray-700" };
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
export type StatusOption = typeof STATUS_OPTIONS[number];
export type TimeOption = typeof TIME_OPTIONS[number];
export type CancelReason = typeof CANCEL_REASONS[number];
