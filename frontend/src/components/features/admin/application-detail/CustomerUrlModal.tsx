"use client";

import { Link2, X } from "lucide-react";
import { ApplicationDetail } from "@/lib/api/admin";
import { CustomerUrlManager } from "@/components/features/admin/photos";

interface CustomerUrlModalProps {
  applicationId: number;
  assignmentId: number;
  application: ApplicationDetail;
  onClose: () => void;
}

export function CustomerUrlModal({
  applicationId,
  assignmentId,
  application,
  onClose,
}: CustomerUrlModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            고객 열람 URL 관리
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <CustomerUrlManager
            applicationId={applicationId}
            assignmentId={assignmentId}
            customerName={application.customer_name}
            customerPhone={application.customer_phone}
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
