"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  ImagePlus,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getPartnerWorkPhotos,
  uploadPartnerPhotos,
  deletePartnerPhoto,
  type PartnerViewPhoto,
  type PartnerWorkPhotosResponse,
} from "@/lib/api/partner-portal";

type PhotoType = "before" | "after";

interface PartnerPhotoUploadProps {
  token: string;
  className?: string;
  onUploadComplete?: () => void;
}

const PHOTO_TABS: { key: PhotoType; label: string; description: string }[] = [
  { key: "before", label: "시공 전", description: "작업 시작 전 현장 사진" },
  { key: "after", label: "시공 후", description: "작업 완료 후 결과 사진" },
];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PartnerPhotoUpload({
  token,
  className,
  onUploadComplete,
}: PartnerPhotoUploadProps) {
  const [activeTab, setActiveTab] = useState<PhotoType>("before");
  const [data, setData] = useState<PartnerWorkPhotosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    photoType: PhotoType;
    photoIndex: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getPartnerWorkPhotos(token);
      setData(result);
    } catch (err) {
      console.error("Failed to load work photos:", err);
      setError("사진 정보를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 현재 탭의 사진 목록
  const currentPhotos: PartnerViewPhoto[] =
    activeTab === "before" ? data?.before_photos || [] : data?.after_photos || [];
  const maxPhotos = data?.max_photos_per_type || 10;
  const canUpload = data?.can_upload && currentPhotos.length < maxPhotos;

  // 파일 유효성 검사
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: 파일 크기가 10MB를 초과합니다.`);
        continue;
      }
      valid.push(file);
    }

    const remaining = maxPhotos - currentPhotos.length;
    if (valid.length > remaining) {
      errors.push(`최대 ${remaining}장까지만 업로드할 수 있습니다.`);
      return { valid: valid.slice(0, remaining), errors };
    }

    return { valid, errors };
  };

  // 파일 업로드 처리
  const handleUpload = async (files: File[]) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (valid.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(`${valid.length}장 업로드 중...`);
      setError(null);

      await uploadPartnerPhotos(token, activeTab, valid);

      setUploadProgress("업로드 완료!");
      await loadData();
      onUploadComplete?.();

      setTimeout(() => setUploadProgress(null), 2000);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("사진 업로드에 실패했습니다. 다시 시도해주세요.");
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
    // 입력 초기화 (같은 파일 재선택 허용)
    e.target.value = "";
  };

  // 사진 삭제 처리
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setIsDeleting(true);
      await deletePartnerPhoto(
        token,
        deleteConfirm.photoType,
        deleteConfirm.photoIndex
      );
      await loadData();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("사진 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("border-0 shadow-md", className)}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.can_upload) {
    return null; // 업로드 불가 상태면 표시하지 않음
  }

  return (
    <Card className={cn("border-0 shadow-md overflow-hidden", className)}>
      {/* 헤더 */}
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white pb-3 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-5 w-5" />
          시공 사진 업로드
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* 탭 전환 */}
        <div className="flex gap-2">
          {PHOTO_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-indigo-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 현재 탭 설명 */}
        <p className="text-sm text-gray-500 text-center">
          {PHOTO_TABS.find((t) => t.key === activeTab)?.description}
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 bg-red-50 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {/* 업로드 진행 상태 */}
        {uploadProgress && (
          <div className="p-3 bg-indigo-50 rounded-xl flex items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <p className="text-sm text-indigo-700">{uploadProgress}</p>
          </div>
        )}

        {/* 사진 그리드 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 기존 사진들 */}
          {currentPhotos.map((photo, index) => (
            <div
              key={`${photo.filename}-${index}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
            >
              <Image
                src={photo.url}
                alt={`${activeTab === "before" ? "시공 전" : "시공 후"} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 120px"
              />
              {/* 삭제 버튼 */}
              <button
                onClick={() =>
                  setDeleteConfirm({ photoType: activeTab, photoIndex: index })
                }
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}

          {/* 업로드 버튼 (빈 슬롯) */}
          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
                isUploading
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50"
              )}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-400">추가</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 사진 카운트 */}
        <p className="text-xs text-gray-400 text-center">
          {currentPhotos.length} / {maxPhotos}장
        </p>

        {/* 업로드 버튼들 */}
        {canUpload && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="h-12 text-sm gap-2"
            >
              <Camera className="h-4 w-4" />
              카메라 촬영
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-12 text-sm gap-2"
            >
              <Upload className="h-4 w-4" />
              갤러리 선택
            </Button>
          </div>
        )}

        {/* 안내 문구 */}
        <p className="text-xs text-gray-400 text-center">
          JPEG, PNG, WebP, HEIC 지원 / 최대 10MB
        </p>

        {/* 숨겨진 파일 입력들 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
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
              {isDeleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
