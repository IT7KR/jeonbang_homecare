"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  ImagePlus,
  Trash2,
  AlertCircle,
  Loader2,
  Camera,
  X,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";
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
import { UploadProgress } from "@/components/ui/upload-progress";
import { PhotoPagination } from "@/components/ui/photo-pagination";
import {
  uploadInChunks,
  type ChunkProgress,
} from "@/lib/utils/chunk-upload";
import {
  uploadWorkPhotos,
  deleteWorkPhoto,
  getWorkPhotos,
  reorderWorkPhotos,
} from "@/lib/api/admin/work-photos";
import type { WorkPhotosResponse } from "@/lib/api/admin/types";
import { SortablePhotoGrid } from "./SortablePhotoGrid";

interface WorkPhotoUploadProps {
  applicationId: number;
  assignmentId: number;
  initialData?: WorkPhotosResponse | null;
  maxPhotosPerType?: number;
  className?: string;
  onPhotosChange?: (data: WorkPhotosResponse) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ITEMS_PER_PAGE = 10;
const DEFAULT_MAX_PHOTOS = 30;

export function WorkPhotoUpload({
  applicationId,
  assignmentId,
  initialData = null,
  maxPhotosPerType = DEFAULT_MAX_PHOTOS,
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
  const [beforeThumbnails, setBeforeThumbnails] = useState<string[]>(
    initialData?.before_thumbnail_urls || []
  );
  const [afterThumbnails, setAfterThumbnails] = useState<string[]>(
    initialData?.after_thumbnail_urls || []
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ChunkProgress | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "before" | "after";
    indices: number[];
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const onPhotosChangeRef = useRef(onPhotosChange);
  onPhotosChangeRef.current = onPhotosChange;

  // Reset selection when tab changes
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIndices(new Set());
    setCurrentPage(1);
  }, [activeTab]);

  // Load photos on mount
  useEffect(() => {
    if (initialData) {
      setIsLoading(false);
      return;
    }

    const loadPhotos = async () => {
      try {
        const data = await getWorkPhotos(applicationId, assignmentId);
        setBeforePhotos(data.before_photo_urls || []);
        setAfterPhotos(data.after_photo_urls || []);
        setBeforeThumbnails(data.before_thumbnail_urls || []);
        setAfterThumbnails(data.after_thumbnail_urls || []);
        onPhotosChangeRef.current?.(data);
      } catch (error) {
        console.error("Failed to load work photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [applicationId, assignmentId, initialData]);

  const currentPhotos = activeTab === "before" ? beforePhotos : afterPhotos;
  const currentThumbnails = activeTab === "before" ? beforeThumbnails : afterThumbnails;

  // Paginated photos
  const paginatedPhotos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentPhotos.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPhotos, currentPage]);

  const paginatedThumbnails = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentThumbnails.slice(start, start + ITEMS_PER_PAGE);
  }, [currentThumbnails, currentPage]);

  // Get actual index in full array
  const getActualIndex = (pageIndex: number) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + pageIndex;
  };

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

    // Validate files
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
      // Use chunk upload utility
      const result = await uploadInChunks({
        files: validFiles,
        chunkSize: 5,
        compress: true,
        compressBatchSize: 3,
        onProgress: setUploadProgress,
        uploadFn: async (chunk) => {
          return uploadWorkPhotos(applicationId, assignmentId, activeTab, chunk);
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh photos
      const updated = await getWorkPhotos(applicationId, assignmentId);
      setBeforePhotos(updated.before_photo_urls);
      setAfterPhotos(updated.after_photo_urls);
      setBeforeThumbnails(updated.before_thumbnail_urls || []);
      setAfterThumbnails(updated.after_thumbnail_urls || []);
      onPhotosChange?.(updated);

      toast.success(`${result.totalProcessed}장의 사진이 업로드되었습니다`);
    } catch (error) {
      toast.error("사진 업로드에 실패했습니다");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDeleteSingle = (index: number) => {
    setDeleteConfirm({ type: activeTab, indices: [index] });
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    const indices = Array.from(selectedIndices).sort((a, b) => b - a);
    setDeleteConfirm({ type: activeTab, indices });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      // Delete in reverse order to maintain correct indices
      for (const index of deleteConfirm.indices) {
        await deleteWorkPhoto(
          applicationId,
          assignmentId,
          deleteConfirm.type,
          index
        );
      }

      // Refresh data
      const updated = await getWorkPhotos(applicationId, assignmentId);
      setBeforePhotos(updated.before_photo_urls);
      setAfterPhotos(updated.after_photo_urls);
      setBeforeThumbnails(updated.before_thumbnail_urls || []);
      setAfterThumbnails(updated.after_thumbnail_urls || []);
      onPhotosChange?.(updated);

      // Reset selection
      setIsSelectionMode(false);
      setSelectedIndices(new Set());

      const message =
        deleteConfirm.indices.length === 1
          ? "사진이 삭제되었습니다"
          : `${deleteConfirm.indices.length}장의 사진이 삭제되었습니다`;
      toast.success(message);
    } catch (error) {
      toast.error("사진 삭제에 실패했습니다");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

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

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleReorder = async (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;

    // Build the new order array: [0,1,2,...n-1] with item moved from oldIndex to newIndex
    const photos = activeTab === "before" ? beforePhotos : afterPhotos;
    const thumbnails = activeTab === "before" ? beforeThumbnails : afterThumbnails;
    const indices = photos.map((_, i) => i);

    // Move index from oldIndex to newIndex
    const [movedIndex] = indices.splice(oldIndex, 1);
    indices.splice(newIndex, 0, movedIndex);

    // Create reordered arrays for optimistic update
    const reorderedPhotos = indices.map((i) => photos[i]);
    const reorderedThumbs = indices.map((i) => thumbnails[i]);

    // Optimistic update
    if (activeTab === "before") {
      setBeforePhotos(reorderedPhotos);
      setBeforeThumbnails(reorderedThumbs);
    } else {
      setAfterPhotos(reorderedPhotos);
      setAfterThumbnails(reorderedThumbs);
    }

    try {
      await reorderWorkPhotos(applicationId, assignmentId, activeTab, indices);
      toast.success("사진 순서가 변경되었습니다");
    } catch (error) {
      // Revert on error
      const data = await getWorkPhotos(applicationId, assignmentId);
      setBeforePhotos(data.before_photo_urls);
      setAfterPhotos(data.after_photo_urls);
      setBeforeThumbnails(data.before_thumbnail_urls || []);
      setAfterThumbnails(data.after_thumbnail_urls || []);
      toast.error("순서 변경에 실패했습니다");
      console.error("Reorder error:", error);
    }
  };

  const PhotoGrid = ({
    photos,
    thumbnails,
    type,
  }: {
    photos: string[];
    thumbnails: string[];
    type: "before" | "after";
  }) => {
    const canAddMore = currentPhotos.length < maxPhotosPerType;

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        {photos.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {currentPhotos.length}/{maxPhotosPerType}장
            </span>
            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedIndices.size === currentPhotos.length
                      ? "전체 해제"
                      : "전체 선택"}
                  </Button>
                  {selectedIndices.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제 ({selectedIndices.size})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
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
                  onClick={() => setIsSelectionMode(true)}
                >
                  선택
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress && type === activeTab && (
          <UploadProgress progress={uploadProgress} className="mb-4" />
        )}

        {/* Photo grid with drag-and-drop */}
        {photos.length > 0 && (
          <SortablePhotoGrid
            photos={photos}
            thumbnails={thumbnails}
            photoType={type}
            startIndex={getActualIndex(0)}
            isSelectionMode={isSelectionMode}
            selectedIndices={selectedIndices}
            onSelect={toggleSelection}
            onDelete={handleDeleteSingle}
            onReorder={handleReorder}
            onPhotoClick={handlePhotoClick}
          />
        )}

        {/* Add button */}
        {canAddMore && type === activeTab && !isSelectionMode && photos.length > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-gray-500">업로드 중</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">사진 추가</span>
              </>
            )}
          </button>
        )}

        {/* Pagination */}
        <PhotoPagination
          totalItems={currentPhotos.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

        {/* Empty state */}
        {currentPhotos.length === 0 && (
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

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs
        value={activeTab}
        onValueChange={(v: string) => setActiveTab(v as "before" | "after")}
      >
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
          <span className="text-xs text-gray-500">각 최대 {maxPhotosPerType}장</span>
        </div>

        <TabsContent value="before" className="mt-4">
          <PhotoGrid
            photos={paginatedPhotos}
            thumbnails={paginatedThumbnails}
            type="before"
          />
        </TabsContent>

        <TabsContent value="after" className="mt-4">
          <PhotoGrid
            photos={paginatedPhotos}
            thumbnails={paginatedThumbnails}
            type="after"
          />
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
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
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
        slides={currentPhotos.map((url) => ({ src: url }))}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
        }}
      />
    </div>
  );
}
