"use client";

import { Link2, X } from "lucide-react";
import { ApplicationDetail, PartnerListItem } from "@/lib/api/admin";
import { PartnerUrlManager } from "@/components/features/admin/photos";

interface PartnerUrlModalProps {
  applicationId: number;
  assignmentId: number;
  application: ApplicationDetail;
  partners: PartnerListItem[];
  onClose: () => void;
}

export function PartnerUrlModal({
  applicationId,
  assignmentId,
  application,
  partners,
  onClose,
}: PartnerUrlModalProps) {
  const currentAssignment = application?.assignments?.find((a) => a.id === assignmentId);
  const currentPartner = partners.find((p) => p.id === currentAssignment?.partner_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            협력사 포털 URL 관리
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <PartnerUrlManager
            applicationId={applicationId}
            assignmentId={assignmentId}
            partnerName={currentAssignment?.partner_name || currentPartner?.representative_name}
            partnerPhone={currentPartner?.contact_phone}
          />
        </div>

        <div className="flex justify-end p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
