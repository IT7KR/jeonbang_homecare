"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WorkPhotosResponse } from "@/lib/api/admin/types";

interface WorkPhotoSelectorProps {
  workPhotos: WorkPhotosResponse | null;
  selectedPhotos: string[];
  onSelectionChange: (photos: string[]) => void;
  maxSelection?: number;
  className?: string;
}

export function WorkPhotoSelector({
  workPhotos,
  selectedPhotos,
  onSelectionChange,
  maxSelection = 3,
  className,
}: WorkPhotoSelectorProps) {
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");

  if (!workPhotos) {
    return (
      <div className={cn("p-4 text-center text-gray-500 text-sm", className)}>
        시공 사진 정보를 불러오는 중...
      </div>
    );
  }

  const hasBeforePhotos = workPhotos.before_photo_urls.length > 0;
  const hasAfterPhotos = workPhotos.after_photo_urls.length > 0;

  if (!hasBeforePhotos && !hasAfterPhotos) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">업로드된 시공 사진이 없습니다</p>
      </div>
    );
  }

  const currentPhotoUrls =
    activeTab === "before"
      ? workPhotos.before_photo_urls
      : workPhotos.after_photo_urls;
  const currentPhotoPaths =
    activeTab === "before"
      ? workPhotos.before_photos
      : workPhotos.after_photos;

  const togglePhoto = (path: string) => {
    if (selectedPhotos.includes(path)) {
      onSelectionChange(selectedPhotos.filter((p) => p !== path));
    } else if (selectedPhotos.length < maxSelection) {
      onSelectionChange([...selectedPhotos, path]);
    }
  };

  const getPhotoPath = (url: string, index: number): string => {
    // URL에서 경로 추출 또는 저장된 경로 사용
    return currentPhotoPaths[index] || url;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 탭 전환 */}
      <div className="flex gap-2">
        {hasBeforePhotos && (
          <button
            type="button"
            onClick={() => setActiveTab("before")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === "before"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            시공 전
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {workPhotos.before_photo_urls.length}
            </Badge>
          </button>
        )}
        {hasAfterPhotos && (
          <button
            type="button"
            onClick={() => setActiveTab("after")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === "after"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            시공 후
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {workPhotos.after_photo_urls.length}
            </Badge>
          </button>
        )}
      </div>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {currentPhotoUrls.map((url, index) => {
          const path = getPhotoPath(url, index);
          const isSelected = selectedPhotos.includes(path);
          const selectionIndex = selectedPhotos.indexOf(path);
          const canSelect = selectedPhotos.length < maxSelection || isSelected;

          return (
            <button
              key={`${activeTab}-${index}`}
              type="button"
              onClick={() => canSelect && togglePhoto(path)}
              disabled={!canSelect}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : canSelect
                  ? "border-gray-200 hover:border-gray-300"
                  : "border-gray-200 opacity-50 cursor-not-allowed"
              )}
            >
              <Image
                src={url}
                alt={`${activeTab === "before" ? "시공 전" : "시공 후"} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 25vw"
              />

              {/* 선택 표시 */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {selectionIndex + 1}
                  </div>
                </div>
              )}

              {/* 호버 체크 표시 */}
              {!isSelected && canSelect && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <Check className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택 상태 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {selectedPhotos.length}장 선택됨 / 최대 {maxSelection}장
        </span>
        {selectedPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectionChange([])}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            선택 해제
          </button>
        )}
      </div>
    </div>
  );
}
