"use client";

import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import type { SMSLogItem } from "@/lib/api/admin";
import { getSMSStatusLabel, getSMSStatusColor } from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";
import { TYPE_LABELS, TRIGGER_SOURCE_LABELS, getImageUrl } from "@/hooks/useSMS";

interface MessageDetailModalProps {
  log: SMSLogItem;
  onClose: () => void;
  onImageClick: (index: number) => void;
}

export function MessageDetailModal({
  log,
  onClose,
  onImageClick,
}: MessageDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">메시지 상세</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">수신번호:</span>{" "}
              <span className="font-mono font-semibold">
                {formatPhone(log.receiver_phone)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">발송일시:</span>{" "}
              <span>{formatDate(log.sent_at || log.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-gray-500">상태:</span>
            <span
              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getSMSStatusColor(log.status)}`}
            >
              {getSMSStatusLabel(log.status)}
            </span>
            <span className="text-gray-500">유형:</span>
            <span className="text-gray-700">
              {TYPE_LABELS[log.sms_type] || log.sms_type}
            </span>
            <span className="text-gray-500">출처:</span>
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                TRIGGER_SOURCE_LABELS[log.trigger_source]?.className ||
                "bg-gray-100 text-gray-700"
              }`}
            >
              {TRIGGER_SOURCE_LABELS[log.trigger_source]?.label || log.trigger_source}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">메시지 내용</p>
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
              {log.message}
            </div>
          </div>
          {/* MMS 이미지 */}
          {log.mms_images && log.mms_images.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">첨부 이미지</p>
              <div className="grid grid-cols-3 gap-2">
                {log.mms_images.map((imgPath, idx) => (
                  <button
                    key={idx}
                    onClick={() => onImageClick(idx)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors"
                  >
                    <Image
                      src={getImageUrl(imgPath)}
                      alt={`첨부 이미지 ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* 호버 오버레이 + 돋보기 버튼 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="p-2.5 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <ZoomIn size={20} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {log.result_message && log.status === "failed" && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <span className="font-medium">실패 사유:</span> {log.result_message}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
