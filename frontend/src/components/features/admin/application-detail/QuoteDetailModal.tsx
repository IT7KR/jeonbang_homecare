"use client";

import { FileText, X } from "lucide-react";
import { ApplicationDetail } from "@/lib/api/admin";
import { QuoteItemTable } from "@/components/features/admin/quotes";

interface QuoteDetailModalProps {
  applicationId: number;
  assignmentId: number;
  application: ApplicationDetail;
  setApplication: React.Dispatch<React.SetStateAction<ApplicationDetail | null>>;
  onClose: () => void;
}

export function QuoteDetailModal({
  applicationId,
  assignmentId,
  application,
  setApplication,
  onClose,
}: QuoteDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            견적 상세
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          <QuoteItemTable
            applicationId={applicationId}
            assignmentId={assignmentId}
            customerName={application.customer_name}
            customerPhone={application.customer_phone}
            onTotalChange={(total) => {
              if (application?.assignments) {
                setApplication((prev) => {
                  if (!prev || !prev.assignments) return prev;
                  return {
                    ...prev,
                    assignments: prev.assignments.map((a) =>
                      a.id === assignmentId ? { ...a, estimated_cost: total } : a
                    ),
                  };
                });
              }
            }}
          />
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
