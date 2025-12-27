"use client";

import { useRef, useState, useCallback } from "react";
import { ImagePlus, X, AlertCircle, Loader2, Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";
import { compressImage } from "@/lib/utils/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  uploadWorkPhotos,
  deleteWorkPhoto,
  getWorkPhotos,
} from "@/lib/api/admin/work-photos";
import type { WorkPhotosResponse } from "@/lib/api/admin/types";

interface WorkPhotoUploadProps {
  applicationId: number;
  assignmentId: number;
  initialData?: WorkPhotosResponse | null;
  maxPhotosPerType?: number;
  className?: string;
  onPhotosChange?: (data: WorkPhotosResponse) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function WorkPhotoUpload({
  applicationId,
  assignmentId,
  initialData = null,
  maxPhotosPerType = 10,
  className,
  onPhotosChange,
}: WorkPhotoUploadProps) {
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [beforePhotos, setBeforePhotos] = useState<string[]>(
    initialData?.before_photo_urls || []
  );
  const [afterPhotos, setAfterPhotos] = useState<string[]>(
    initialData?.after_photo_urls || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "before" | "after";
    index: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentPhotos = activeTab === "before" ? beforePhotos : afterPhotos;
  const setCurrentPhotos = activeTab === "before" ? setBeforePhotos : setAfterPhotos;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = maxPhotosPerType - currentPhotos.length;
    if (availableSlots <= 0) {
      toast.warning(`최대 ${maxPhotosPerType}장까지만 업로드 가능합니다`);
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    const errors: string[] = [];

    // 파일 검증
    const validFiles = filesToProcess.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: 파일 크기가 10MB를 초과합니다`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (errors.length > 0) toast.warning(errors[0]);
      return;
    }

    setIsUploading(true);

    try {
      // 클라이언트 압축 (선택사항 - 서버에서도 압축함)
      const compressedFiles: File[] = [];
      for (const file of validFiles) {
        try {
          const compressed = await compressImage(file);
          compressedFiles.push(compressed);
        } catch {
          compressedFiles.push(file); // 압축 실패 시 원본 사용
        }
      }

      // 업로드
      await uploadWorkPhotos(
        applicationId,
        assignmentId,
        activeTab,
        compressedFiles
      );

      // 새 데이터 조회
      const updated = await getWorkPhotos(applicationId, assignmentId);
      setBeforePhotos(updated.before_photo_urls);
      setAfterPhotos(updated.after_photo_urls);
      onPhotosChange?.(updated);

      toast.success(`${compressedFiles.length}장의 사진이 업로드되었습니다`);
    } catch (error) {
      toast.error("사진 업로드에 실패했습니다");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteWorkPhoto(
        applicationId,
        assignmentId,
        deleteConfirm.type,
        deleteConfirm.index
      );

      // 새 데이터 조회
      const updated = await getWorkPhotos(applicationId, assignmentId);
      setBeforePhotos(updated.before_photo_urls);
      setAfterPhotos(updated.after_photo_urls);
      onPhotosChange?.(updated);

      toast.success("사진이 삭제되었습니다");
    } catch (error) {
      toast.error("사진 삭제에 실패했습니다");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const PhotoGrid = ({ photos, type }: { photos: string[]; type: "before" | "after" }) => {
    const canAddMore = photos.length < maxPhotosPerType;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((url, index) => (
            <div
              key={`${type}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
            >
              <Image
                src={url}
                alt={`시공 ${type === "before" ? "전" : "후"} 사진 ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setDeleteConfirm({ type, index })}
                className="absolute top-1 right-1 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                {index + 1}/{photos.length}
              </div>
            </div>
          ))}

          {/* Add button */}
          {canAddMore && type === activeTab && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs text-gray-500">업로드 중</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500">추가</span>
                </>
              )}
            </button>
          )}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">등록된 사진이 없습니다</p>
            {type === activeTab && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                사진 업로드
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "before" | "after")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="before" className="gap-1">
              <Camera className="w-4 h-4" />
              시공 전 ({beforePhotos.length})
            </TabsTrigger>
            <TabsTrigger value="after" className="gap-1">
              <Camera className="w-4 h-4" />
              시공 후 ({afterPhotos.length})
            </TabsTrigger>
          </TabsList>
          <span className="text-xs text-gray-500">
            각 최대 {maxPhotosPerType}장
          </span>
        </div>

        <TabsContent value="before" className="mt-4">
          <PhotoGrid photos={beforePhotos} type="before" />
        </TabsContent>

        <TabsContent value="after" className="mt-4">
          <PhotoGrid photos={afterPhotos} type="after" />
        </TabsContent>
      </Tabs>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Info */}
      <div className="flex items-start gap-1.5 text-xs text-gray-500">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          JPEG, PNG, WebP 형식 지원 / 파일당 최대 10MB / 서버에서 자동 최적화됩니다
        </span>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사진 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 사진을 삭제하시겠습니까? 삭제된 사진은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
