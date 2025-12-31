"use client";

import { StatusChangeModal } from "@/components/admin/StatusChangeModal";
import {
  getPartnerStatusInfo,
  willSendSmsForPartnerStatusChange,
  needsReasonForPartnerStatusChange,
} from "@/lib/constants/partner";

interface PartnerStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendSms: boolean, reason?: string) => void;
  currentStatus: string;
  newStatus: string;
  isLoading: boolean;
}

export function PartnerStatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  isLoading,
}: PartnerStatusChangeModalProps) {
  const currentStatusInfo = getPartnerStatusInfo(currentStatus);
  const newStatusInfo = getPartnerStatusInfo(newStatus);

  const showSmsOption = willSendSmsForPartnerStatusChange(newStatus);
  const showReasonInput = needsReasonForPartnerStatusChange(newStatus);

  // SMS 설명 문구
  const getSmsDescription = () => {
    if (newStatus === "approved") {
      return "협력사에게 승인 알림 문자를 발송합니다";
    }
    if (newStatus === "rejected") {
      return "협력사에게 거절 알림 문자를 발송합니다";
    }
    return "상태 변경 알림 문자를 발송합니다";
  };

  // 사유 라벨
  const getReasonLabel = () => {
    if (newStatus === "rejected") {
      return "거절 사유";
    }
    if (newStatus === "inactive") {
      return "비활성화 사유";
    }
    return "사유";
  };

  return (
    <StatusChangeModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      currentStatusLabel={currentStatusInfo.label}
      newStatusLabel={newStatusInfo.label}
      currentStatusColor={`${currentStatusInfo.bgColor} ${currentStatusInfo.color}`}
      newStatusColor={`${newStatusInfo.bgColor} ${newStatusInfo.color}`}
      isLoading={isLoading}
      showSmsOption={showSmsOption}
      smsDescription={getSmsDescription()}
      defaultSmsChecked={true}
      showReasonInput={showReasonInput}
      reasonLabel={getReasonLabel()}
      reasonPlaceholder={`${getReasonLabel()}를 입력하세요`}
      reasonRequired={showReasonInput}
    />
  );
}
