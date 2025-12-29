"use client";

import {
  MapPin,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Wrench,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Download,
  Loader2,
} from "lucide-react";
import { ApplicationDetail } from "@/lib/api/admin";
import { getServiceName } from "@/lib/utils/service";
import { SafeText, SafeBlockText } from "@/components/common/SafeText";
import { FILE_BASE_URL } from "@/hooks/useApplicationDetail";

interface ServiceDetailSectionProps {
  application: ApplicationDetail;
  expanded: boolean;
  onToggle: () => void;
  onPhotoClick: (index: number) => void;
  onDownloadPhoto: (photoUrl: string, index: number) => void;
  onDownloadAllPhotos: () => void;
  isDownloadingAll: boolean;
  downloadingPhoto: number | null;
}

export function ServiceDetailSection({
  application,
  expanded,
  onToggle,
  onPhotoClick,
  onDownloadPhoto,
  onDownloadAllPhotos,
  isDownloadingAll,
  downloadingPhoto,
}: ServiceDetailSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Wrench size={18} className="text-primary" />
          서비스 상세
        </h2>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 선택한 서비스 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">선택 서비스</p>
            <div className="flex flex-wrap gap-1.5">
              {application.selected_services.map((service, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full"
                >
                  {getServiceName(service)}
                </span>
              ))}
            </div>
          </div>

          {/* 주소 */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <SafeText
                text={application.address}
                className="font-medium text-gray-900"
                as="p"
              />
              {application.address_detail && (
                <SafeText
                  text={application.address_detail}
                  className="text-gray-600"
                  as="p"
                />
              )}
            </div>
          </div>

          {/* 전달사항 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">전달사항</p>
            <SafeBlockText
              text={application.description}
              className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed"
            />
          </div>

          {/* 희망 일정 */}
          {(application.preferred_consultation_date || application.preferred_work_date) && (
            <div className="grid grid-cols-2 gap-3">
              {application.preferred_consultation_date && (
                <div className="flex items-center gap-2 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                  <CalendarIcon size={14} className="text-yellow-600" />
                  <div className="text-xs">
                    <p className="text-yellow-700">희망 상담일</p>
                    <p className="font-medium text-yellow-900">
                      {application.preferred_consultation_date}
                    </p>
                  </div>
                </div>
              )}
              {application.preferred_work_date && (
                <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                  <CalendarIcon size={14} className="text-orange-600" />
                  <div className="text-xs">
                    <p className="text-orange-700">희망 작업일</p>
                    <p className="font-medium text-orange-900">
                      {application.preferred_work_date}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 첨부 사진 */}
          {application.photos && application.photos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <ImageIcon size={12} />
                  첨부 사진 ({application.photos.length}장)
                </p>
                <button
                  onClick={onDownloadAllPhotos}
                  disabled={isDownloadingAll}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="전체 다운로드 (ZIP)"
                >
                  {isDownloadingAll ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>다운로드 중...</span>
                    </>
                  ) : (
                    <>
                      <Download size={12} />
                      <span>전체 다운로드</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.photos.slice(0, 6).map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden group"
                  >
                    <button
                      type="button"
                      onClick={() => onPhotoClick(idx)}
                      className="w-full h-full hover:ring-2 hover:ring-primary transition-all"
                    >
                      <img
                        src={`${FILE_BASE_URL}${photo}`}
                        alt={`첨부 사진 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {/* 호버 시 버튼 표시 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPhotoClick(idx);
                        }}
                        className="p-2.5 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-white shadow-sm"
                        title="확대"
                      >
                        <ZoomIn size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadPhoto(photo, idx);
                        }}
                        disabled={downloadingPhoto === idx}
                        className="p-2.5 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-white shadow-sm disabled:opacity-50"
                        title="다운로드"
                      >
                        {downloadingPhoto === idx ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Download size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {application.photos.length > 6 && (
                  <button
                    type="button"
                    onClick={() => onPhotoClick(6)}
                    className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-gray-300 transition-colors"
                  >
                    +{application.photos.length - 6}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
