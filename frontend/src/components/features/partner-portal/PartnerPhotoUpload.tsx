"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Camera,
  ImagePlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
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
import { UploadProgress } from "@/components/ui/upload-progress";
import { SimplePagination } from "@/components/ui/photo-pagination";
import {
  uploadInChunks,
  type ChunkProgress,
} from "@/lib/utils/chunk-upload";
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
const ITEMS_PER_PAGE = 9; // 3x3 grid

export function PartnerPhotoUpload({
  token,
  className,
  onUploadComplete,
}: PartnerPhotoUploadProps) {
  const [activeTab, setActiveTab] = useState<PhotoType>("before");
  const [data, setData] = useState<PartnerWorkPhotosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ChunkProgress | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    photoType: PhotoType;
    indices: number[];
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset on tab change
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIndices(new Set());
    setCurrentPage(1);
    setError(null);
    setSuccessMessage(null);
  }, [activeTab]);

  // Load data
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

  // Current tab photos
  const currentPhotos: PartnerViewPhoto[] =
    activeTab === "before" ? data?.before_photos || [] : data?.after_photos || [];
  const maxPhotos = data?.max_photos_per_type || 30;
  const canUpload = data?.can_upload && currentPhotos.length < maxPhotos;

  // Paginated photos
  const paginatedPhotos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentPhotos.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPhotos, currentPage]);

  // Get actual index
  const getActualIndex = (pageIndex: number) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + pageIndex;
  };

  // Validate files
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

  // Upload handler with chunk support
  const handleUpload = async (files: File[]) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (valid.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);

      const result = await uploadInChunks({
        files: valid,
        chunkSize: 5,
        compress: true,
        compressBatchSize: 3,
        onProgress: setUploadProgress,
        uploadFn: async (chunk) => {
          return uploadPartnerPhotos(token, activeTab, chunk);
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccessMessage(`${result.totalProcessed}장 업로드 완료!`);
      await loadData();
      onUploadComplete?.();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("사진 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
    e.target.value = "";
  };

  // Delete handlers
  const handleDeleteSingle = (index: number) => {
    setDeleteConfirm({ photoType: activeTab, indices: [index] });
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    const indices = Array.from(selectedIndices).sort((a, b) => b - a);
    setDeleteConfirm({ photoType: activeTab, indices });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setIsDeleting(true);
      // Delete in reverse order
      for (const index of deleteConfirm.indices) {
        await deletePartnerPhoto(token, deleteConfirm.photoType, index);
      }
      await loadData();
      setDeleteConfirm(null);
      setIsSelectionMode(false);
      setSelectedIndices(new Set());
    } catch (err) {
      console.error("Delete failed:", err);
      setError("사진 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection handlers
  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === currentPhotos.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(currentPhotos.map((_, i) => i)));
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
    return null;
  }

  return (
    <Card className={cn("border-0 shadow-md overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white pb-3 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-5 w-5" />
          시공 사진 업로드
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Tab switcher */}
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
              {tab.label} ({(activeTab === tab.key ? currentPhotos : (tab.key === "before" ? data?.before_photos : data?.after_photos))?.length || 0})
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p className="text-sm text-gray-500 text-center">
          {PHOTO_TABS.find((t) => t.key === activeTab)?.description}
        </p>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="p-3 bg-green-50 rounded-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress && (
          <UploadProgress progress={uploadProgress} />
        )}

        {/* Selection toolbar */}
        {currentPhotos.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {currentPhotos.length}/{maxPhotos}장
            </span>
            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={toggleSelectAll}
                  >
                    {selectedIndices.size === currentPhotos.length ? "해제" : "전체"}
                  </Button>
                  {selectedIndices.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {selectedIndices.size}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIndices(new Set());
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setIsSelectionMode(true)}
                >
                  선택
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2">
          {paginatedPhotos.map((photo, index) => {
            const actualIndex = getActualIndex(index);
            const thumbnailUrl = photo.thumbnail_url || photo.url;
            const isSelected = selectedIndices.has(actualIndex);

            return (
              <div
                key={`${photo.filename}-${actualIndex}`}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer",
                  isSelected && "ring-2 ring-indigo-500"
                )}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleSelection(actualIndex);
                  } else {
                    setLightboxIndex(actualIndex);
                    setLightboxOpen(true);
                  }
                }}
              >
                <Image
                  src={thumbnailUrl}
                  alt={`${activeTab === "before" ? "시공 전" : "시공 후"} ${actualIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 120px"
                />

                {/* Selection checkbox */}
                {isSelectionMode && (
                  <div className="absolute top-1 left-1">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-500 bg-white rounded" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 bg-white/80 rounded" />
                    )}
                  </div>
                )}

                {/* Delete button */}
                {!isSelectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingle(actualIndex);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                )}

                {/* Photo number */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                  {actualIndex + 1}
                </div>
              </div>
            );
          })}

          {/* Add button */}
          {canUpload && !isSelectionMode && (
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

        {/* Pagination */}
        <SimplePagination
          totalItems={currentPhotos.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

        {/* Upload buttons */}
        {canUpload && !isSelectionMode && (
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

        {/* Info text */}
        <p className="text-xs text-gray-400 text-center">
          JPEG, PNG, WebP, HEIC 지원 / 최대 10MB / 각 {maxPhotos}장
        </p>

        {/* Hidden file inputs */}
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

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사진 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.indices.length === 1
                ? "이 사진을 삭제하시겠습니까?"
                : `선택한 ${deleteConfirm?.indices.length}장의 사진을 삭제하시겠습니까?`}
              {" "}삭제된 사진은 복구할 수 없습니다.
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

      {/* Image lightbox with zoom */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={currentPhotos.map((photo) => ({ src: photo.url }))}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
        }}
      />
    </Card>
  );
}
