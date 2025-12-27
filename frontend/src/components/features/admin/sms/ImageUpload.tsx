"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";
import { compressImage } from "@/lib/utils/image";
import type { ImageFile } from "@/lib/api/admin/types";

interface ImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizePerFile?: number; // bytes (자동 압축 전 최대 크기)
  className?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

export function ImageUpload({
  images,
  onChange,
  maxImages = 3,
  maxSizePerFile = 20 * 1024 * 1024, // 20MB (자동 압축되므로 여유 있게)
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 개수 제한 체크
    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      toast.warning(`최대 ${maxImages}개까지만 첨부 가능합니다`);
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    const errors: string[] = [];

    // 파일 타입 검증
    const validFiles = filesToProcess.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다`);
        return false;
      }
      if (file.size > maxSizePerFile) {
        errors.push(`${file.name}: 파일 크기가 너무 큽니다`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (errors.length > 0) toast.warning(errors[0]);
      return;
    }

    setIsCompressing(true);

    try {
      const newImages: ImageFile[] = [];

      for (const file of validFiles) {
        // 기존 compressImage 함수로 압축
        const compressedFile = await compressImage(file);

        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
          size: compressedFile.size,
          type: compressedFile.type,
        });
      }

      onChange([...images, ...newImages]);

      // 압축된 경우 안내
      const compressed = validFiles.some((f, i) => f.size !== newImages[i]?.size);
      if (compressed) {
        toast.success("이미지가 자동 최적화되었습니다");
      }
    } catch (error) {
      toast.error("이미지 처리 중 오류가 발생했습니다");
    } finally {
      setIsCompressing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    onChange(images.filter((img) => img.id !== id));
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          이미지 첨부
        </label>
        <span className="text-xs text-gray-500">
          {images.length}/{maxImages}개
        </span>
      </div>

      {/* Image preview grid */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((image) => (
          <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <Image
              src={image.preview}
              alt="첨부 이미지"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(image.id)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
              {formatFileSize(image.size)}
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isCompressing}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-xs text-gray-500">처리중</span>
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
          JPEG, PNG, GIF 형식 지원 / 고용량 이미지는 자동 최적화됩니다
        </span>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Convert ImageFile to Base64 data URI
 */
export async function imageFileToBase64(image: ImageFile): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(image.file);
  });
}
